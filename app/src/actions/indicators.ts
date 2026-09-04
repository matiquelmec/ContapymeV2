'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Indicator } from '@/lib/types/dashboard'

// Cooldowns en memoria
let lastSyncTime = 0
const SYNC_COOLDOWN = 5 * 60 * 1000 
const OUTDATED_INTERVAL = 4 * 60 * 60 * 1000 

/**
 * Detector de Régimen de Mercado (Kaufman Efficiency Ratio & Wyckoff) portado de Slingshot
 */
function detectRegime(prices: number[], highs: number[], lows: number[]): { regime: string, efficiency: number } {
  const window = Math.min(50, prices.length - 1)
  if (prices.length < 10) {
    return { regime: 'RANGING', efficiency: 0.3 }
  }

  const currentPrice = prices[prices.length - 1]
  const oldPrice = prices[prices.length - 1 - window]
  
  // 1. Ratio de Eficiencia de Kaufman (Efficiency Ratio)
  const change = Math.abs(currentPrice - oldPrice)
  let volatility = 0
  for (let i = prices.length - window; i < prices.length; i++) {
    volatility += Math.abs(prices[i] - prices[i - 1])
  }
  const efficiency = change / (volatility + 1e-9)

  // 2. Posición dentro del rango de 50 días
  let maxHigh = -Infinity
  let minLow = Infinity
  for (let i = prices.length - window; i < prices.length; i++) {
    if (highs[i] > maxHigh) maxHigh = highs[i]
    if (lows[i] < minLow) minLow = lows[i]
  }
  const rangeSize = maxHigh - minLow
  const posPct = (currentPrice - minLow) / (rangeSize + 1e-9)

  const momLong = currentPrice - oldPrice

  // 3. Determinar régimen
  let regime = 'RANGING'
  if (efficiency > 0.28) {
    regime = momLong > 0 ? 'MARKUP' : 'MARKDOWN'
  } else {
    if (posPct < 0.3) {
      regime = 'ACCUMULATION'
    } else if (posPct > 0.7) {
      regime = 'DISTRIBUTION'
    } else if (efficiency < 0.1) {
      regime = 'CHOPPY'
    }
  }

  return { regime, efficiency }
}

/**
 * Calcula confluencia SMC y Lógica de entrada basada en las heurísticas de Slingshot
 */
function calculateSMCConfluence(prices: number[], highs: number[], lows: number[], regime: string, efficiency: number) {
  const currentPrice = prices[prices.length - 1]
  const window = Math.min(50, prices.length - 1)

  let maxHigh = -Infinity
  let minLow = Infinity
  for (let i = prices.length - window; i < prices.length; i++) {
    if (highs[i] > maxHigh) maxHigh = highs[i]
    if (lows[i] < minLow) minLow = lows[i]
  }
  const rangeSize = maxHigh - minLow
  
  // Retroceso de Fibonacci
  const retracement = (maxHigh - currentPrice) / (rangeSize + 1e-9)
  const isOTE = retracement >= 0.618 && retracement <= 0.786 // Golden Pocket de Fibonacci (61.8% - 78.6%)

  let confluence = 50
  let logic = 'CONSOLIDACIÓN DE RANGO LATERAL'
  let verdict = 'SIDEWAYS'

  if (regime === 'MARKUP') {
    confluence = Math.round(72 + efficiency * 18)
    logic = 'OB RETEST & ESTRUCTURA ALCISTA (MARKUP)'
    verdict = 'GO'
  } else if (regime === 'MARKDOWN') {
    confluence = Math.round(75 + efficiency * 15)
    logic = 'BREAK OF STRUCTURE BAJISTA (MARKDOWN)'
    verdict = 'AVOID'
  } else if (regime === 'ACCUMULATION') {
    confluence = isOTE ? 88 : 72
    logic = isOTE 
      ? 'RETESTEO ZONA OTE DE FIBONACCI (GOLDEN POCKET)' 
      : 'ABSORCIÓN DE OFERTA EN SOPORTE (ACUMULACIÓN)'
    verdict = 'GO'
  } else if (regime === 'DISTRIBUTION') {
    confluence = 78
    logic = 'DISTRIBUCIÓN INSTITUCIONAL EN RESISTENCIAS'
    verdict = 'AVOID'
  } else if (regime === 'CHOPPY') {
    confluence = 35
    logic = 'VOLATILIDAD SUCIA (MERCADO ERRÁTICO)'
    verdict = 'AVOID'
  } else {
    confluence = 55
    logic = 'RANGO DE EQUILIBRIO TEMPORAL'
    verdict = 'SIDEWAYS'
  }

  // Bonus por eficiencia de mercado
  if (efficiency > 0.4) {
    confluence += 7
  }

  confluence = Math.min(98, Math.max(12, confluence))

  return { confluence, logic, verdict }
}

let cachedIndicators: { data: any[]; timestamp: number } | null = null
const MEMORY_CACHE_TTL = 15 * 60 * 1000 // 15 minutos en memoria del worker Next.js

/**
 * Obtiene los indicadores económicos y telemetría de Supabase.
 * Gatilla una actualización en segundo plano si están desactualizados.
 */
export async function getLatestIndicators() {
  const now = Date.now()

  // 1. Amortización en memoria para eliminar el escaneo secuencial en cada petición
  if (cachedIndicators && now - cachedIndicators.timestamp < MEMORY_CACHE_TTL) {
    return { success: true, data: cachedIndicators.data }
  }

  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('economic_indicators')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(30) // Solo necesitamos los más recientes por indicador
    
    if (error) {
      console.error('[DATABASE ERROR] Fallo al obtener indicadores:', error.message)
      if (cachedIndicators) {
        return { success: true, data: cachedIndicators.data }
      }
      return { success: false, error: 'No se pudieron obtener indicadores.', data: [] }
    }

    // Deduplicar para garantizar que cada indicador corresponda a su última cotización en tiempo real
    const latestByCode = new Map<string, any>()
    for (const ind of (data as any[] || [])) {
      if (!latestByCode.has(ind.codigo)) {
        latestByCode.set(ind.codigo, ind)
      }
    }
    const indicators = Array.from(latestByCode.values())

    cachedIndicators = {
      data: indicators,
      timestamp: now
    }

    // Verificar si los datos están desactualizados
    let shouldSync = false
    if (indicators.length === 0) {
      shouldSync = true
    } else {
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
      console.log('[Indicators Action] Datos obsoletos detectados. Iniciando sincronización de Slingshot en segundo plano...')
      syncIndicatorsAction()
        .then((res) => {
          console.log(`[Indicators Action] Sincronización de Slingshot completada. Éxito: ${res.success}.`)
          revalidatePath('/')
          revalidatePath('/dashboard')
        })
        .catch((err) => {
          console.error('[Indicators Action] Error en sincronización de Slingshot:', err.message)
        })
    }

    // Convertir de forma segura para TypeScript.
    // Mapeamos el valor del campo 'fuente' (donde guardamos la telemetría en la DB)
    // al campo 'unidad_medida' de la interfaz de TypeScript para el frontend.
    const formattedIndicators: Indicator[] = indicators.map(ind => ({
      codigo: ind.codigo,
      nombre: ind.nombre,
      unidad_medida: ind.fuente || '',
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
 * Sincronización manual de indicadores y telemetría de Slingshot.
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
 * Función interna Server-Side que realiza la sincronización consumiendo APIs y procesando
 * el algoritmo de detección de régimen de Slingshot.
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

  // 1. Obtener indicadores oficiales estables de mindicador.cl (UF, UTM, IPC, IMACEC)
  try {
    const res = await fetch('https://mindicador.cl/api', { 
      headers,
      cache: 'no-store'
    })
    
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const data = await res.json()
    
    // Solo traemos de aquí los estables. Las divisas y metales van por Yahoo para tener históricos de 60 días
    const estables = ['uf', 'utm', 'ipc', 'imacec', 'tpm']
    for (const codigo of estables) {
      const item = data[codigo]
      if (item) {
        const valor = parseFloat(item.valor)
        const fecha = item.fecha ? item.fecha.split('T')[0] : hoyStr
        const nombre = item.nombre || codigo.toUpperCase()
        const unidad = item.unidad_medida || ''

        await supabase.from('economic_indicators').upsert({
          codigo,
          nombre,
          valor,
          fecha,
          fuente: 'mindicador.cl',
          unidad_medida: unidad,
          updated_at: new Date().toISOString()
        }, { onConflict: 'codigo' })

        actualizados.push(codigo)
      }
    }
  } catch (err: any) {
    console.error('[Sync Indicators] Error mindicador.cl:', err.message)
    errores.push(`mindicador.cl: ${err.message}`)
  }

  // 2. Obtener divisas, bolsas y metales de Yahoo Finance con serie temporal de 60 días
  const tickersYahoo = {
    dolar: { nombre: 'Dólar Observado', ticker: 'CLP=X' },
    euro: { nombre: 'Euro en Chile', ticker: 'EURCLP=X' },
    ipsa: { nombre: 'IPSA Chile', ticker: '%5EIPSA' },
    sp500: { nombre: 'S&P 500 Index', ticker: '%5EGSPC' },
    libra_cobre: { nombre: 'Cobre COMEX', ticker: 'HG=F' }, // HG=F es cobre futuros
    oro: { nombre: 'Oro COMEX', ticker: 'GC=F' },
    wti: { nombre: 'Petróleo WTI', ticker: 'CL=F' }
  }

  for (const [codigo, info] of Object.entries(tickersYahoo)) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${info.ticker}?interval=1d&range=60d`
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
        const quote = chart?.indicators?.quote?.[0]
        
        if (meta && quote && quote.close) {
          const valorActual = parseFloat(meta.regularMarketPrice || quote.close[quote.close.length - 1] || 0)
          
          // Limpiar datos y rellenar nulos del histórico para el algoritmo
          const prices: number[] = []
          const highs: number[] = []
          const lows: number[] = []
          
          for (let i = 0; i < quote.close.length; i++) {
            const c = quote.close[i]
            const h = quote.high ? quote.high[i] : c
            const l = quote.low ? quote.low[i] : c
            
            if (c !== null && c !== undefined && h !== null && l !== null) {
              prices.push(c)
              highs.push(h)
              lows.push(l)
            }
          }

          // Ejecutar el motor de régimen de Slingshot
          const { regime, efficiency } = detectRegime(prices, highs, lows)
          const { confluence, logic, verdict } = calculateSMCConfluence(prices, highs, lows, regime, efficiency)

          // Codificar la telemetría inteligente en el campo unidad_medida como JSON
          const telemetryJson = JSON.stringify({
            regime,
            confluence,
            logic,
            verdict,
            efficiency: Number(efficiency.toFixed(4)),
            price: valorActual
          })

          // Guardamos la telemetría serializada directamente en la columna 'fuente' de la DB
          // para evitar realizar alteraciones al esquema de base de datos de producción.
          const { error } = await supabase.from('economic_indicators').upsert({
            codigo,
            nombre: info.nombre,
            valor: valorActual,
            fecha: hoyStr,
            fuente: telemetryJson,
            updated_at: new Date().toISOString()
          }, { onConflict: 'codigo' })


          if (error) {
            console.error(`[Sync Indicators] Error guardando Yahoo ${codigo}:`, error.message)
            errores.push(`yahoo_${codigo}_db: ${error.message}`)
          } else {
            actualizados.push(codigo)
          }
        } else {
          throw new Error('Formato de respuesta de Yahoo no válido o sin histórico')
        }
      } else {
        throw new Error(`Yahoo Finance status ${res.status}`)
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
 * Acción combinada para actualizar noticias e indicadores económicos.
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
