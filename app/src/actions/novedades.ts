"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveNovedadesBulk(
  novedades: {
    employee_id: string;
    dias_trabajados: number;
    horas_extra_pendientes: number;
    bono_extra: number;
  }[]
) {
  try {
    const supabase = await createClient();
    
    // Ejecutar actualizaciones secuenciales o concurrentes controladas
    const promises = novedades.map((nov) =>
      supabase
        .from("employees")
        .update({
          dias_trabajados: nov.dias_trabajados,
          horas_extra_pendientes: nov.horas_extra_pendientes,
          bono_extra: nov.bono_extra,
        })
        .eq("id", nov.employee_id)
    );

    const results = await Promise.all(promises);
    
    for (const res of results) {
      if (res.error) throw new Error(res.error.message);
    }

    revalidatePath("/dashboard/payroll");
    revalidatePath("/dashboard/payroll/novedades");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar novedades masivas" };
  }
}
