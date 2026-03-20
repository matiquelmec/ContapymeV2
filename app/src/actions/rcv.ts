'use server'

import { revalidatePath } from 'next/cache'

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:8000'

// ==========================================
// IMPORTACIÓN
// ==========================================

/** Importa un CSV de Compras o Ventas al Engine Python */
export async function importRCVAction(
  formData: FormData,
  organizationId: string,
  periodo: string,
  type: 'purchases' | 'sales',
  force: boolean = false
) {
  try {
    const endpoint = type === 'purchases' ? 'import-purchases' : 'import-sales'

    const response = await fetch(
      `${ENGINE_URL}/api/v1/rcv/${endpoint}?organization_id=${organizationId}&periodo=${periodo}&force=${force}`,
      {
        method: 'POST',
        body: formData,
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Error en el Motor Python' }))
      return { success: false, error: err.detail }
    }

    const result = await response.json()
    revalidatePath('/dashboard/accounting/rcv')

    return {
      success: true,
      inserted: result.inserted,
      tipo_suma: result.tipo_suma ?? 0,
      tipo_resta: result.tipo_resta ?? 0,
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Error de red: ${errorMessage}` }
  }
}

// ==========================================
// ANÁLISIS — TOP PROVEEDORES / CLIENTES
// ==========================================

/** Top N proveedores por monto calculado (J+K con lógica tipo doc) */
export async function getTopVendors(
  organizationId: string,
  periodo?: string,
  limit: number = 10
) {
  try {
    const url = new URL(`${ENGINE_URL}/api/v1/rcv/analysis/top-vendors`)
    url.searchParams.append('organization_id', organizationId)
    url.searchParams.append('limit', String(limit))
    if (periodo) url.searchParams.append('periodo', periodo)

    const response = await fetch(url.toString(), { cache: 'no-store' })
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

/** Top N clientes por monto calculado (J+K con lógica tipo doc) */
export async function getTopCustomers(
  organizationId: string,
  periodo?: string,
  limit: number = 10
) {
  try {
    const url = new URL(`${ENGINE_URL}/api/v1/rcv/analysis/top-customers`)
    url.searchParams.append('organization_id', organizationId)
    url.searchParams.append('limit', String(limit))
    if (periodo) url.searchParams.append('periodo', periodo)

    const response = await fetch(url.toString(), { cache: 'no-store' })
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

// ==========================================
// KPIs Y RESUMEN
// ==========================================

/** KPIs del período: montos compras/ventas, proveedores/clientes únicos, balance */
export async function getRCVSummary(organizationId: string, periodo?: string) {
  try {
    const url = new URL(`${ENGINE_URL}/api/v1/rcv/analysis/summary`)
    url.searchParams.append('organization_id', organizationId)
    if (periodo) url.searchParams.append('periodo', periodo)

    const response = await fetch(url.toString(), { cache: 'no-store' })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

// ==========================================
// PERÍODOS DISPONIBLES
// ==========================================

/** Lista de períodos (YYYY-MM-01) que tienen datos de compras o ventas */
export async function getAvailablePeriodos(organizationId: string) {
  try {
    const url = new URL(`${ENGINE_URL}/api/v1/rcv/periodos`)
    url.searchParams.append('organization_id', organizationId)

    const response = await fetch(url.toString(), { cache: 'no-store' })
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

// ==========================================
// HISTORIAL DE IMPORTACIONES
// ==========================================

/** Historial de lotes importados, agrupado por (periodo, tipo) */
export async function getRCVHistory(organizationId: string, limit: number = 30) {
  try {
    const url = new URL(`${ENGINE_URL}/api/v1/rcv/history`)
    url.searchParams.append('organization_id', organizationId)
    url.searchParams.append('limit', String(limit))

    const response = await fetch(url.toString(), { cache: 'no-store' })
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}
// ==========================================
// CONSOLIDADO (PARA RENDIMIENTO)
// ==========================================

export async function getRCVDashboardData(organizationId: string, periodo?: string) {
  try {
    const [vendors, customers, summary, periods] = await Promise.all([
      getTopVendors(organizationId, periodo),
      getTopCustomers(organizationId, periodo),
      getRCVSummary(organizationId, periodo),
      getAvailablePeriodos(organizationId)
    ]);

    // Ordenar periodos de forma descendente (más recientes primero)
    const sortedPeriods = (periods || []).sort((a: any, b: any) => 
      b.periodo.localeCompare(a.periodo)
    );

    return {
      vendors: vendors.slice(0, 50),
      customers: customers.slice(0, 50),
      summary,
      periods: sortedPeriods
    };
  } catch (err) {
    console.error("Error consolidando datos RCV:", err);
    return {
      vendors: [],
      customers: [],
      summary: null,
      periods: []
    };
  }
}
