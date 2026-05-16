"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { engineFetch } from "@/lib/engine-client";

export async function getChartOfAccounts(organizationId: string) {
  try {
    const response = await engineFetch(`/api/v1/accounting/chart-of-accounts?organization_id=${organizationId}`, {
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
    const response = await engineFetch(`/api/v1/accounting/chart-of-accounts/initialize?organization_id=${organizationId}`, {
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
    const response = await engineFetch(`/api/v1/accounting/generate-from-rcv`, {
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
    let url = `/api/v1/accounting/ledger?organization_id=${organizationId}&account_code=${accountCode}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;

    const response = await engineFetch(url, { cache: 'no-store' });
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

export async function exportLedgerAction(
  organizationId: string,
  accountCode: string,
  accountName: string,
  startDate?: string,
  endDate?: string,
  ledgerData?: any,
  orgName?: string,
  orgRut?: string
) {
  try {
    const data = ledgerData || await getLedger(organizationId, accountCode, startDate, endDate);
    if (!data) return { success: false, error: "No se pudieron obtener los datos del Libro Mayor." };

    // BOM UTF-8 para que Excel lo abra correctamente en español
    const BOM = '\uFEFF';
    const rows: string[] = [];

    // Encabezado Corporativo Oficial
    rows.push(`Razón Social:,${orgName || 'N/A'}`);
    rows.push(`RUT:,${orgRut || 'N/A'}`);
    rows.push(`LIBRO MAYOR CONTABLE`);
    rows.push(`Cuenta:,[${data.account_code}] ${data.account_name}`);
    rows.push(`Naturaleza:,${data.naturaleza}`);
    rows.push(`Período:,${startDate || 'Desde el inicio'} al ${endDate || 'Hoy'}`);
    rows.push(`Generado por:,Contapymepuq Sistema de Gestión Contable`);
    rows.push(``);

    // Columnas Actualizadas con Nº Comprobante
    rows.push(`Fecha,Nº Comprobante,Glosa / Concepto,Cargo (Debe),Abono (Haber),Saldo Acumulado`);

    if (data.saldo_anterior !== 0) {
      rows.push(`Apertura,,Saldo Anterior Heredado,,,${data.saldo_anterior}`);
    }

    for (const m of data.movements) {
      const fecha = m.fecha ? new Date(m.fecha + 'T12:00:00').toLocaleDateString('es-CL') : '';
      const numAsiento = m.numero_asiento || '';
      const glosa = `"${ (m.glosa || '').replace(/"/g, '""') }"`;
      const debe = m.debe > 0 ? m.debe : '';
      const haber = m.haber > 0 ? m.haber : '';
      rows.push(`${fecha},${numAsiento},${glosa},${debe},${haber},${m.saldo}`);
    }

    rows.push(``);
    rows.push(`TOTALES,,,${data.total_debe},${data.total_haber},${data.saldo_final}`);

    const csv = BOM + rows.join('\n');
    const orgPrefix = orgRut ? `${orgRut.replace(/[^0-9Kk]/g, '')}_` : '';
    const filename = `LibroMayor_${orgPrefix}${accountCode.replace(/\./g, '-')}_${startDate || 'inicio'}_al_${endDate || 'hoy'}.csv`;
    
    return { success: true, csv, filename };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function getTrialBalance(organizationId: string, startDate: string, endDate: string) {
  try {
    const response = await engineFetch(
      `/api/v1/accounting/trial-balance?organization_id=${organizationId}&start_date=${startDate}&end_date=${endDate}`,
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
    let url = `/api/v1/accounting/reports?organization_id=${organizationId}&year=${year}`;
    if (month) url += `&month=${month}`;

    const response = await engineFetch(url, { cache: 'no-store' });
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
    const response = await engineFetch(`/api/v1/accounting/chart-of-accounts`, {
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

export async function updateAccountAction(accountId: string, data: any) {
  try {
    const response = await engineFetch(`/api/v1/accounting/chart-of-accounts/${accountId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Error al actualizar cuenta");
    
    revalidatePath("/dashboard/accounting/chart-of-accounts");
    return { success: true, data: result };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function getChartStats(organizationId: string) {
  try {
    const response = await engineFetch(`/api/v1/accounting/chart-of-accounts/stats?organization_id=${organizationId}`, {
      cache: 'no-store'
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("error getChartStats:", error);
    return null;
  }
}

export async function deleteAccountAction(accountId: string, organizationId: string) {
  try {
    const response = await engineFetch(`/api/v1/accounting/chart-of-accounts/${accountId}?organization_id=${organizationId}`, {
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
    const response = await engineFetch(`/api/v1/accounting/config?organization_id=${organizationId}`, {
      cache: 'no-store'
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("error getAccountingConfig:", error);
    return [];
  }
}

export async function initializeAccountingConfigAction(organizationId: string) {
  try {
    const response = await engineFetch(`/api/v1/accounting/config/initialize?organization_id=${organizationId}`, {
      method: "POST",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Error al inicializar configuración");
    
    revalidatePath("/dashboard/accounting/config");
    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function updateAccountingConfigAction(configId: string, data: any) {
  try {
    const response = await engineFetch(`/api/v1/accounting/config/${configId}`, {
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

// --- REGLAS DE MAPEO (RCV ENTITY MAPPING) ---

export async function getMappingRules(organizationId: string) {
  try {
    const response = await engineFetch(`/api/v1/accounting/mapping-rules?organization_id=${organizationId}`, {
      cache: 'no-store'
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("error getMappingRules:", error);
    return [];
  }
}

export async function createMappingRuleAction(data: {
  organization_id: string;
  context: string;
  account_id: string;
}) {
  try {
    const response = await engineFetch(`/api/v1/accounting/mapping-rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Error al crear regla");
    
    revalidatePath("/dashboard/accounting/config");
    return { success: true, data: result };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function deleteMappingRuleAction(ruleId: string) {
  try {
    const response = await engineFetch(`/api/v1/accounting/mapping-rules/${ruleId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) throw new Error("Error al eliminar regla");
    
    revalidatePath("/dashboard/accounting/config");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function exportLceMayorXmlAction(organizationId: string, periodoStr: string) {
  try {
    const response = await engineFetch(`/api/v1/accounting/lce_mayor?organization_id=${organizationId}&periodo=${periodoStr}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
        let errorText = await response.text();
        try {
            const errJson = JSON.parse(errorText);
            errorText = errJson.detail || errorText;
        } catch(e) {}
      console.error("[LCE XML error]", errorText);
      throw new Error(`Error al generar XML: ${errorText}`);
    }

    const xml = await response.text();
    const filename = `LCE_MAYOR_${periodoStr.replace('-', '')}.xml`;

    return { success: true, xml, filename };
  } catch (error: any) {
    console.error("Error en exportLceMayorXmlAction:", error);
    return { success: false, error: error.message };
  }
}
