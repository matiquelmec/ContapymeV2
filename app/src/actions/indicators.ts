'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Indicator } from '@/lib/types/dashboard'

// Throttling en memoria para evitar llamadas simultáneas a APIs externas en la misma instancia de servidor
let lastSyncTime = 0
const SYNC_COOLDOWN = 5 * 60 * 1000 // 5 minutos de cooldown en memoria
const OUTDATED_INTERVAL = 4 * 60 * 60 * 1000 // 4 horas de validez de datos en DB

/**
 * Obtiene los indicadores económicos más recientes de Supabase.
 * Gatilla una actualización autónoma en segundo plano si los datos están obsoletos.
 */
export async function getLatestIndicators() {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('economic_indicators')
      .select('*')
      .order('codigo')
    
    if (error) {
      console.error('[DATABASE ERROR] Fallo al obtener indicadores:', error.message)
      return { success: false, error: 'No se pudieron obtener indicadores de la base de datos.', data: [] }
    }

    const indicators = (data as any[]) || []

    // Verificar si los datos están desactualizados
    let shouldSync = false
    if (indicators.length === 0) {
      shouldSync = true
    } else {
      // Tomamos el registro con la fecha de actualización más antigua para asegurar frescura total
      const oldestUpdate = indicators.reduce((min, ind) => {
        const t = ind.updated_at ? new Date(ind.updated_at).getTime() : 0
        return t < min ? t : min
      }, Date.now())

      const now = Date.now()
      if (now - oldestUpdate > OUTDATED_INTERVAL && now - lastSyncTime > SYNC_COOLDOWN) {
        shouldSync = true
      }
    }

    if (shouldSync) {
      lastSyncTime = Date.now()
      console.log('[Indicators Action] Datos obsoletos detectados. Iniciando sincronización autónoma en segundo plano...')
      // Gatillar la actualización de forma asíncrona sin bloquear la respuesta al usuario
      syncIndicatorsAction()
        .then((res) => {
          console.log(`[Indicators Action] Sincronización en segundo plano completada. Éxito: ${res.success}. Actualizados: ${res.actualizados.join(', ')}`)
          revalidatePath('/')
          revalidatePath('/dashboard')
        })
        .catch((err) => {
          console.error('[Indicators Action] Error en sincronización en segundo plano:', err.message)
        })
    }

    // Convertir de forma segura para TypeScript
    const formattedIndicators: Indicator[] = indicators.map(ind => ({
      codigo: ind.codigo,
      nombre: ind.nombre,
      unidad_medida: ind.unidad_medida || '',
      fecha: ind.fecha,
      valor: Number(ind.valor)
    }))

    return { success: true, data: formattedIndicators }
  } catch (err: any) {
    console.error("[Indicators Action Error]:", err.message);
    return { success: false, error: 'Error de conexión con la central de indicadores.', data: [] }
  }
}

/**
 * Sincronización activa y manual de indicadores.
 * Utilizado por el botón del dashboard para forzar la actualización.
 */
export async function updateIndicators() {
  try {
    const res = await syncIndicatorsAction()
    revalidatePath('/dashboard')
    revalidatePath('/')
    
    if (!res.success) {
      return { 
        success: false, 
        error: `Actualización incompleta. Errores: ${res.errores.join(', ')}` 
      }
    }

    return {
      success: true,
      total: res.actualizados.length,
      errores: res.errores
    }
  } catch (err: any) {
    return { success: false, error: `Fallo al sincronizar indicadores: ${err.message}` }
  }
}

/**
 * Función interna Server-Side que realiza la sincronización consumiendo APIs públicas.
 */
export async function syncIndicatorsAction() {
  const supabase = createAdminClient()
  const hoyStr = new Date().toISOString().split('T')[0]
  const errores: string[] = []
  const actualizados: string[] = []

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json'
  }

  // 1. Obtener indicadores de mindicador.cl (Llamada única global)
  try {
    const res = await fetch('https://mindicador.cl/api', { 
      headers,
      cache: 'no-store'
    })
    
    if (!res.ok) {
      throw new Error(`API de mindicador.cl retornó status ${res.status}`)
    }
    
    const data = await res.json()
    const codigosMindicador = ['uf', 'utm', 'dolar', 'euro', 'ipc', 'libra_cobre', 'tpm', 'imacec']
    
    for (const codigo of codigosMindicador) {
      const item = data[codigo]
      if (item) {
        const valor = parseFloat(item.valor)
        const fecha = item.fecha ? item.fecha.split('T')[0] : hoyStr
        const nombre = item.nombre || codigo.toUpperCase()
        const unidad = item.unidad_medida || ''

        const { error } = await supabase.from('economic_indicators').upsert({
          codigo,
          nombre,
          valor,
          fecha,
          fuente: 'mindicador.cl',
          unidad_medida: unidad,
          updated_at: new Date().toISOString()
        }, { onConflict: 'codigo' })

        if (error) {
          console.error(`[Sync Indicators] Error guardando ${codigo} en Supabase:`, error.message)
          errores.push(`${codigo}_db: ${error.message}`)
        } else {
          actualizados.push(codigo)
        }
      }
    }
  } catch (err: any) {
    console.error('[Sync Indicators] Error en llamada a mindicador.cl:', err.message)
    errores.push(`mindicador.cl: ${err.message}`)
  }

  // 2. Obtener activos globales y de mercado de Yahoo Finance (APIs públicas sin API Key)
  const tickersYahoo = {
    ipsa: { nombre: 'IPSA Chile', ticker: '%5EIPSA', unidad: 'Puntos' },
    wti: { nombre: 'Petróleo WTI', ticker: 'CL=F', unidad: 'US$ / Bl' },
    sp500: { nombre: 'S&P 500', ticker: '%5EGSPC', unidad: 'Puntos' },
    oro: { nombre: 'Oro COMEX', ticker: 'GC=F', unidad: 'US$ / Oz' }
  }


  for (const [codigo, info] of Object.entries(tickersYahoo)) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${info.ticker}?interval=1d&range=1d`
      const res = await fetch(url, { 
        headers: {
          ...headers,
          'Accept': '*/*'
        },
        cache: 'no-store'
      })
      
      if (res.ok) {
        const data = await res.json()
        const chart = data?.chart?.result?.[0]
        const meta = chart?.meta
        
        if (meta) {
          const valor = parseFloat(meta.regularMarketPrice || 0)
          
          const { error } = await supabase.from('economic_indicators').upsert({
            codigo,
            nombre: info.nombre,
            valor,
            fecha: hoyStr,
            fuente: 'Yahoo Finance (Global)',
            unidad_medida: info.unidad,
            updated_at: new Date().toISOString()
          }, { onConflict: 'codigo' })

          if (error) {
            console.error(`[Sync Indicators] Error guardando Yahoo ${codigo} en Supabase:`, error.message)
            errores.push(`yahoo_${codigo}_db: ${error.message}`)
          } else {
            actualizados.push(codigo)
          }
        } else {
          throw new Error('Formato de respuesta de Yahoo no válido')
        }
      } else {
        throw new Error(`Yahoo Finance retornó status ${res.status}`)
      }
    } catch (err: any) {
      console.error(`[Sync Indicators] Error sincronizando ${codigo} de Yahoo Finance:`, err.message)
      errores.push(`yahoo_${codigo}: ${err.message}`)
    }
  }

  return { 
    success: errores.length === 0, 
    actualizados, 
    errores 
  }
}

/**
 * Acción combinada para actualizar noticias e indicadores económicos simultáneamente en vivo.
 */
export async function syncAllDataAction() {
  try {
    const { syncNewsAction } = await import('./news')
    const indicatorsRes = await syncIndicatorsAction()
    const newsRes = await syncNewsAction()
    
    return {
      success: indicatorsRes.success && newsRes.success,
      indicators: indicatorsRes,
      news: newsRes
    }
  } catch (err: any) {
    console.error('[Sync All Data] Error:', err.message)
    return { success: false, error: err.message }
  }
}

