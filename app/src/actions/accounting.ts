"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8000";

export async function getChartOfAccounts(organizationId: string) {
  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/accounting/chart-of-accounts?organization_id=${organizationId}`, {
      cache: 'no-store'
    });
    if (!response.ok) throw new Error("Error al obtener plan de cuentas");
    return await response.json();
  } catch (error) {
    console.error("error getChartOfAccounts:", error);
    return [];
  }
}

export async function initializeChartAction(organizationId: string) {
  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/accounting/chart-of-accounts/initialize?organization_id=${organizationId}`, {
      method: "POST",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Error al inicializar");
    
    revalidatePath("/dashboard/accounting/chart-of-accounts");
    revalidatePath("/dashboard/accounting/config");
    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function generateAccountingFromRCV(formData: {
  organization_id: string;
  periodo: string;
  type: 'purchases' | 'sales';
}) {
  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/accounting/generate-from-rcv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Error al generar asientos");
    
    revalidatePath("/dashboard/accounting");
    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function getLedger(organizationId: string, accountCode: string, startDate?: string, endDate?: string) {
  try {
    let url = `${ENGINE_URL}/api/v1/accounting/ledger?organization_id=${organizationId}&account_code=${accountCode}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Error al obtener libro mayor");
    }
    return await response.json();
  } catch (error) {
    console.error("error getLedger:", error);
    return null;
  }
}

export async function getTrialBalance(organizationId: string, startDate: string, endDate: string) {
  try {
    const response = await fetch(
      `${ENGINE_URL}/api/v1/accounting/trial-balance?organization_id=${organizationId}&start_date=${startDate}&end_date=${endDate}`,
      { cache: 'no-store' }
    );
    if (!response.ok) throw new Error("Error al obtener balance de comprobación");
    return await response.json();
  } catch (error) {
    console.error("error getTrialBalance:", error);
    return [];
  }
}

export async function getFinancialReports(organizationId: string, year: number, month?: number) {
  try {
    let url = `${ENGINE_URL}/api/v1/accounting/reports?organization_id=${organizationId}&year=${year}`;
    if (month) url += `&month=${month}`;

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error("Error al obtener reportes financieros");
    return await response.json();
  } catch (error) {
    console.error("error getFinancialReports:", error);
    return null;
  }
}
export async function createAccountAction(data: {
  organization_id: string;
  codigo: string;
  nombre: string;
  nivel: number;
  tipo: string;
  naturaleza: string;
  parent_codigo?: string;
  acepta_movimiento: boolean;
  descripcion?: string;
}) {
  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/accounting/chart-of-accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Error al crear cuenta");
    
    revalidatePath("/dashboard/accounting/chart-of-accounts");
    return { success: true, data: result };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function deleteAccountAction(accountId: string, organizationId: string) {
  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/accounting/chart-of-accounts/${accountId}?organization_id=${organizationId}`, {
      method: "DELETE",
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Error al eliminar cuenta");
    
    revalidatePath("/dashboard/accounting/chart-of-accounts");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function getAccountingConfig(organizationId: string) {
  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/accounting/config?organization_id=${organizationId}`, {
      cache: 'no-store'
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("error getAccountingConfig:", error);
    return [];
  }
}

export async function updateAccountingConfigAction(configId: string, data: any) {
  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/accounting/config/${configId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Error al actualizar configuración");
    
    revalidatePath("/dashboard/accounting/config");
    return { success: true, data: result };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
