"use server";

import { revalidatePath } from "next/cache";
import { engineFetch } from "@/lib/engine-client";
import { parseError } from "@/lib/utils/errors";

export async function getBankAccounts(organizationId: string) {
  try {
    const response = await engineFetch(`/api/v1/bank/accounts?organization_id=${organizationId}`, {
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
    const response = await engineFetch(`/api/v1/bank/accounts`, {
      method: "POST",
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
    const response = await engineFetch(`/api/v1/bank/analyze`, {
      method: "POST",
      body: formData,
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(parseError(result.detail || "Error al analizar cartola"));
    
    return { success: true, data: result };
  } catch (error: unknown) {
    return { success: false, error: parseError(error) };
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
    const response = await engineFetch(`/api/v1/bank/save-reconciliation`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(parseError(result.detail || "Error al guardar conciliación"));
    }
    
    revalidatePath("/dashboard/reconciliation");
    revalidatePath("/dashboard/accounting/journal");
    revalidatePath("/dashboard");
    return { success: true, message: result.message };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function getBankMappingRules(organizationId: string) {
  try {
    const response = await engineFetch(`/api/v1/bank/rules/${organizationId}`, {
      cache: 'no-store'
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("error getBankMappingRules:", error);
    return [];
  }
}

export async function reconcileWithAdjustmentAction(data: {
  bank_line_id: string;
  account_code: string;
  account_name: string;
  organization_id: string;
}) {
  try {
    const response = await engineFetch(`/api/v1/bank/reconcile-with-adjustment`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(parseError(result.detail || "Error al procesar ajuste bancario"));
    }
    
    revalidatePath("/dashboard/reconciliation");
    revalidatePath("/dashboard/accounting/journal");
    revalidatePath("/dashboard");
    return { success: true, message: result.message };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
