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

export async function createBankAccount(data: {
  organization_id: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  chart_account_id?: string;
}) {
  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/bank/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Error al crear cuenta bancaria");
    revalidatePath("/dashboard/reconciliation");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function analyzeBankStatementAction(formData: FormData) {
  try {
    // El formData ya debe contener organization_id y bank_account_id desde el cliente
    const response = await fetch(`${ENGINE_URL}/api/v1/bank/analyze`, {
      method: "POST",
      body: formData,
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Error al analizar cartola");
    
    return { success: true, data: result };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function saveReconciliationAction(data: {
  organization_id: string;
  matches: Array<{
    journal_entry_line_id: string;
    status: string;
    notes?: string;
  }>;
}) {
  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/bank/save-reconciliation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    if (!response.ok) {
      const errorMsg = typeof result.detail === 'string' 
        ? result.detail 
        : (typeof result.detail === 'object' ? JSON.stringify(result.detail) : "Error al guardar conciliación");
      throw new Error(errorMsg);
    }
    
    revalidatePath("/dashboard/reconciliation");
    return { success: true, message: result.message };
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
