"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CustomItemTipo = "haber" | "descuento";

export interface CustomItem {
  id: string;
  organization_id: string;
  employee_id: string;
  periodo: string;
  tipo: CustomItemTipo;
  nombre: string;
  monto: number;
  es_imponible: boolean;
  created_at: string;
  employees?: {
    nombres: string;
    apellido_paterno: string;
    apellido_materno?: string;
  };
}

/** Primer día del mes (YYYY-MM-01) de una fecha o período "YYYY-MM". */
function periodStart(value: string): string {
  return `${String(value).slice(0, 7)}-01`;
}

export async function getCustomItems(orgId: string, periodo?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("payroll_custom_items")
    .select(`
      *,
      employees ( nombres, apellido_paterno, apellido_materno )
    `)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (periodo) {
    query = query.eq("periodo", periodStart(periodo));
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error al obtener items personalizados:", error);
    return [];
  }
  return data as unknown as CustomItem[];
}

export async function createCustomItem(data: {
  organization_id: string;
  employee_id: string;
  periodo: string;
  tipo: CustomItemTipo;
  nombre: string;
  monto: number;
  es_imponible: boolean;
}) {
  try {
    const supabase = await createClient();

    if (!data.nombre.trim()) return { success: false, error: "El nombre es obligatorio." };
    if (data.monto <= 0) return { success: false, error: "El monto debe ser mayor a cero." };

    const { data: item, error } = await supabase
      .from("payroll_custom_items")
      .insert({
        organization_id: data.organization_id,
        employee_id: data.employee_id,
        periodo: periodStart(data.periodo),
        tipo: data.tipo,
        nombre: data.nombre.trim(),
        monto: data.monto,
        // es_imponible solo es relevante para haberes; en descuentos se ignora.
        es_imponible: data.tipo === "haber" ? data.es_imponible : false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/payroll/novedades");
    revalidatePath("/dashboard/payroll");
    return { success: true, data: item as CustomItem };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al crear el concepto." };
  }
}

export async function deleteCustomItem(id: string, orgId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("payroll_custom_items")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/payroll/novedades");
    revalidatePath("/dashboard/payroll");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar el concepto." };
  }
}
