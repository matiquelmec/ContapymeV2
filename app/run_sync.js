const fs = require('fs');
const path = require('path');

// 1. Cargar variables de entorno desde .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

// Inicializar cliente Supabase local
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Algoritmo RegimeDetector de Slingshot
function detectRegime(prices, highs, lows) {
  const window = Math.min(50, prices.length - 1);
  if (prices.length < 10) {
    return { regime: 'RANGING', efficiency: 0.3 };
  }

  const currentPrice = prices[prices.length - 1];
  const oldPrice = prices[prices.length - 1 - window];
  
  const change = Math.abs(currentPrice - oldPrice);
  let volatility = 0;
  for (let i = prices.length - window; i < prices.length; i++) {
    volatility += Math.abs(prices[i] - prices[i - 1]);
  }
  const efficiency = change / (volatility + 1e-9);

  let maxHigh = -Infinity;
  let minLow = Infinity;
  for (let i = prices.length - window; i < prices.length; i++) {
    if (highs[i] > maxHigh) maxHigh = highs[i];
    if (lows[i] < minLow) minLow = lows[i];
  }
  const rangeSize = maxHigh - minLow;
  const posPct = (currentPrice - minLow) / (rangeSize + 1e-9);

  const momLong = currentPrice - oldPrice;

  let regime = 'RANGING';
  if (efficiency > 0.28) {
    regime = momLong > 0 ? 'MARKUP' : 'MARKDOWN';
  } else {
    if (posPct < 0.3) {
      regime = 'ACCUMULATION';
    } else if (posPct > 0.7) {
      regime = 'DISTRIBUTION';
    } else if (efficiency < 0.1) {
      regime = 'CHOPPY';
    }
  }

  return { regime, efficiency };
}

// Algoritmo de Confluencia SMC
function calculateSMCConfluence(prices, highs, lows, regime, efficiency) {
  const currentPrice = prices[prices.length - 1];
  const window = Math.min(50, prices.length - 1);

  let maxHigh = -Infinity;
  let minLow = Infinity;
  for (let i = prices.length - window; i < prices.length; i++) {
    if (highs[i] > maxHigh) maxHigh = highs[i];
    if (lows[i] < minLow) minLow = lows[i];
  }
  const rangeSize = maxHigh - minLow;
  const retracement = (maxHigh - currentPrice) / (rangeSize + 1e-9);
  const isOTE = retracement >= 0.618 && retracement <= 0.786;

  let confluence = 50;
  let logic = 'CONSOLIDACIÓN DE RANGO LATERAL';
  let verdict = 'SIDEWAYS';

  if (regime === 'MARKUP') {
    confluence = Math.round(72 + efficiency * 18);
    logic = 'OB RETEST & ESTRUCTURA ALCISTA (MARKUP)';
    verdict = 'GO';
  } else if (regime === 'MARKDOWN') {
    confluence = Math.round(75 + efficiency * 15);
    logic = 'BREAK OF STRUCTURE BAJISTA (MARKDOWN)';
    verdict = 'AVOID';
  } else if (regime === 'ACCUMULATION') {
    confluence = isOTE ? 88 : 72;
    logic = isOTE ? 'RETESTEO ZONA OTE DE FIBONACCI (GOLDEN POCKET)' : 'ABSORCIÓN DE OFERTA EN SOPORTE (ACUMULACIÓN)';
    verdict = 'GO';
  } else if (regime === 'DISTRIBUTION') {
    confluence = 78;
    logic = 'DISTRIBUCIÓN INSTITUCIONAL EN RESISTENCIAS';
    verdict = 'AVOID';
  } else if (regime === 'CHOPPY') {
    confluence = 35;
    logic = 'VOLATILIDAD SUCIA (MERCADO ERRÁTICO)';
    verdict = 'AVOID';
  } else {
    confluence = 55;
    logic = 'RANGO DE EQUILIBRIO TEMPORAL';
    verdict = 'SIDEWAYS';
  }

  if (efficiency > 0.4) {
    confluence += 7;
  }

  confluence = Math.min(98, Math.max(12, confluence));

  return { confluence, logic, verdict };
}

const tickersYahoo = {
  dolar: { nombre: 'Dólar Observado', ticker: 'CLP=X' },
  euro: { nombre: 'Euro en Chile', ticker: 'EURCLP=X' },
  ipsa: { nombre: 'IPSA Chile', ticker: '%5EIPSA' },
  sp500: { nombre: 'S&P 500 Index', ticker: '%5EGSPC' },
  libra_cobre: { nombre: 'Cobre COMEX', ticker: 'HG=F' },
  oro: { nombre: 'Oro COMEX', ticker: 'GC=F' },
  wti: { nombre: 'Petróleo WTI', ticker: 'CL=F' }
};

async function run() {
  console.log("🚀 Iniciando sincronización manual de telemetría de Slingshot...");
  const hoyStr = new Date().toISOString().split('T')[0];

  for (const [codigo, info] of Object.entries(tickersYahoo)) {
    try {
      console.log(`⏳ Procesando ${codigo} (${info.ticker})...`);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${info.ticker}?interval=1d&range=60d`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!res.ok) {
        throw new Error(`Yahoo status ${res.status}`);
      }

      const data = await res.json();
      const chart = data?.chart?.result?.[0];
      const meta = chart?.meta;
      const quote = chart?.indicators?.quote?.[0];

      if (meta && quote && quote.close) {
        const valorActual = parseFloat(meta.regularMarketPrice || quote.close[quote.close.length - 1] || 0);

        const prices = [];
        const highs = [];
        const lows = [];
        for (let i = 0; i < quote.close.length; i++) {
          const c = quote.close[i];
          const h = quote.high ? quote.high[i] : c;
          const l = quote.low ? quote.low[i] : c;
          if (c !== null && c !== undefined && h !== null && l !== null) {
            prices.push(c);
            highs.push(h);
            lows.push(l);
          }
        }

        const { regime, efficiency } = detectRegime(prices, highs, lows);
        const { confluence, logic, verdict } = calculateSMCConfluence(prices, highs, lows, regime, efficiency);

        const telemetryJson = JSON.stringify({
          regime,
          confluence,
          logic,
          verdict,
          efficiency: Number(efficiency.toFixed(4)),
          price: valorActual
        });

        // Escribimos la telemetría en la columna fuente de Supabase
        const { error } = await supabase.from('economic_indicators').upsert({
          codigo,
          nombre: info.nombre,
          valor: valorActual,
          fecha: hoyStr,
          fuente: telemetryJson, // Guardado en fuente
          updated_at: new Date().toISOString()
        }, { onConflict: 'codigo' });

        if (error) {
          console.error(`❌ Error guardando ${codigo} en Supabase:`, error.message);
        } else {
          console.log(`✅ ${codigo} sincronizado. Régimen: ${regime}, Confluencia: ${confluence}%.`);
        }
      }
    } catch (e) {
      console.error(`❌ Error con ${codigo}:`, e.message);
    }
  }
  console.log("🏁 Sincronización finalizada.");
}

run();
