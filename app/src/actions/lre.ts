"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8000";

export async function getLREBooks(organizationId: string) {
  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/payroll/lre/list?organization_id=${organizationId}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("error getLREBooks engine response:", errorData);
      return { success: false, error: errorData.detail || "Error al obtener libros LRE" };
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
    const response = await fetch(`${ENGINE_URL}/api/v1/payroll/lre/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Error al generar LRE");

    revalidatePath("/dashboard/payroll/lre");
    return { success: true, message: "Libro generado correctamente" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function exportLREAction(bookId: string) {
  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/payroll/lre/export/${bookId}`);
    if (!response.ok) throw new Error("Error al exportar LRE");
    
    const blob = await response.text(); // CSV as text
    return { success: true, data: blob };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
