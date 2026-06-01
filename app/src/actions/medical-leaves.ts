"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MedicalLeaveType =
  | "licencia_comun"
  | "accidente_trabajo"
  | "licencia_maternal";

export interface MedicalLeave {
  id: string;
  organization_id: string;
  employee_id: string;
  tipo: MedicalLeaveType;
  fecha_inicio: string;
  fecha_fin: string;
  dias_licencia: number;
  folio?: string;
  previred_movement_code: "3" | "6";
  periodo: string;
  comentarios?: string;
  created_at: string;
  employees?: {
    nombres: string;
    apellido_paterno: string;
    apellido_materno?: string;
    rut?: string;
  };
}

/** Código de movimiento Previred según el tipo de licencia. */
function movementCodeForType(tipo: MedicalLeaveType): "3" | "6" {
  return tipo === "accidente_trabajo" ? "6" : "3";
}

/** Primer día del mes (YYYY-MM-01) de una fecha. */
function periodStart(fecha: string): string {
  return `${String(fecha).slice(0, 7)}-01`;
}

/**
 * Registra una licencia médica y deriva automáticamente las novedades del
 * empleado para el período: días trabajados (30 − días de licencia) y el
 * código de movimiento Previred (3 subsidio / 6 accidente).
 */
export async function createMedicalLeave(data: {
  organization_id: string;
  employee_id: string;
  tipo: MedicalLeaveType;
  fecha_inicio: string;
  fecha_fin: string;
  dias_licencia: number;
  folio?: string;
  comentarios?: string;
}) {
  try {
    const supabase = await createClient();

    if (data.dias_licencia <= 0) {
      return { success: false, error: "Los días de licencia deben ser mayores a cero." };
    }

    const movement = movementCodeForType(data.tipo);
    const periodo = periodStart(data.fecha_inicio);

    const { data: leave, error } = await supabase
      .from("medical_leaves")
      .insert({
        organization_id: data.organization_id,
        employee_id: data.employee_id,
        tipo: data.tipo,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        dias_licencia: data.dias_licencia,
        folio: data.folio || null,
        previred_movement_code: movement,
        periodo,
        comentarios: data.comentarios || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Derivar novedades del empleado para el período (convención 30 días).
    const diasTrabajados = Math.max(0, 30 - Math.min(30, data.dias_licencia));
    const { error: empError } = await supabase
      .from("employees")
      .update({
        dias_trabajados: diasTrabajados,
        previred_movement_code: movement,
      })
      .eq("id", data.employee_id)
      .eq("organization_id", data.organization_id);

    if (empError) throw new Error(empError.message);

    revalidatePath("/dashboard/payroll/novedades");
    revalidatePath("/dashboard/payroll");
    return { success: true, data: leave as MedicalLeave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al registrar la licencia médica." };
  }
}

export async function getMedicalLeaves(orgId: string, periodo?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("medical_leaves")
    .select(`
      *,
      employees ( nombres, apellido_paterno, apellido_materno, rut )
    `)
    .eq("organization_id", orgId)
    .order("fecha_inicio", { ascending: false });

  if (periodo) {
    query = query.eq("periodo", periodStart(periodo));
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error al obtener licencias médicas:", error);
    return [];
  }
  return data as unknown as MedicalLeave[];
}

/**
 * Elimina una licencia médica y restablece las novedades del empleado a un
 * mes normal (30 días, sin movimiento) si no quedan otras licencias vigentes
 * en el mismo período.
 */
export async function deleteMedicalLeave(id: string, orgId: string) {
  try {
    const supabase = await createClient();

    const { data: leave, error: fetchError } = await supabase
      .from("medical_leaves")
      .select("employee_id, periodo")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single();

    if (fetchError || !leave) {
      return { success: false, error: fetchError?.message || "Licencia no encontrada." };
    }

    const { error } = await supabase
      .from("medical_leaves")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) throw new Error(error.message);

    // ¿Quedan otras licencias del mismo empleado y período?
    const { data: remaining } = await supabase
      .from("medical_leaves")
      .select("id")
      .eq("employee_id", leave.employee_id)
      .eq("periodo", leave.periodo)
      .limit(1);

    if (!remaining || remaining.length === 0) {
      await supabase
        .from("employees")
        .update({ dias_trabajados: 30, previred_movement_code: "0" })
        .eq("id", leave.employee_id)
        .eq("organization_id", orgId);
    }

    revalidatePath("/dashboard/payroll/novedades");
    revalidatePath("/dashboard/payroll");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar la licencia médica." };
  }
}
