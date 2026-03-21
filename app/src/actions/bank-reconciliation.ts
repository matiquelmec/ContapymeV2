"use server";

import { revalidatePath } from "next/cache";

const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8000";

export async function getBankAccounts(organizationId: string) {
  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/bank/accounts?organization_id=${organizationId}`, {
      cache: 'no-store'
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("error getBankAccounts:", error);
    return [];
  }
}

export async function analyzeBankStatementAction(formData: FormData) {
  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/bank/analyze`, {
      method: "POST",
      body: formData, // FormData handles the multi-part file upload
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Error al analizar cartola");
    
    return { success: true, data: result };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function getBankMappingRules(organizationId: string) {
  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/bank/rules/${organizationId}`, {
      cache: 'no-store'
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("error getBankMappingRules:", error);
    return [];
  }
}
