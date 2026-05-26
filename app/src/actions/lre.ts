"use server";

import { revalidatePath } from "next/cache";
import { engineFetch } from "@/lib/engine-client";
import { parseError } from "@/lib/utils/errors";

// TODO: Cambiar a false una vez que se integre la pasarela de pagos
const BYPASS_PLAN_LIMITS = true;

export async function getLREBooks(organizationId: string) {
  try {
    const response = await engineFetch(`/api/v1/payroll/lre/list?organization_id=${organizationId}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("error getLREBooks engine response:", errorData);
      return { success: false, error: parseError(errorData.detail || "Error al obtener libros LRE") };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("error getLREBooks unexpected:", error);
    return { success: false, error: "No se pudo conectar con el motor de remuneraciones" };
  }
}

export async function generateLREAction(formData: {
  organization_id: string;
  periodo: string;
  company_name: string;
  company_rut: string;
}) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if ((!profile || profile.plan === "personal") && !BYPASS_PLAN_LIMITS) {
      throw new Error("El Libro de Remuneraciones Electrónico (LRE) está bloqueado en el plan Personal. Por favor, suba de plan a Estudio Contable o superior.");
    }

    const response = await engineFetch('/api/v1/payroll/lre/generate', {
      method: "POST",
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(parseError(result.detail || "Error al generar LRE"));

    revalidatePath("/dashboard/payroll/lre");
    return { success: true, message: "Libro generado correctamente", book_id: result.book_id };
  } catch (error: any) {
    return { success: false, error: parseError(error) };
  }
}

export async function exportLREAction(bookId: string) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if ((!profile || profile.plan === "personal") && !BYPASS_PLAN_LIMITS) {
      throw new Error("La exportación LRE requiere una suscripción Estudio Contable o superior.");
    }

    const response = await engineFetch(`/api/v1/payroll/lre/export/${bookId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = parseError(errorData.detail || "Error al exportar LRE");
      throw new Error(detail);
    }
    
    const blob = await response.text(); // CSV as text
    return { success: true, data: blob };
  } catch (error: any) {
    return { success: false, error: parseError(error) };
  }
}

