"use server";

import { callNvidiaNim } from "@/lib/nvidia/nim-client";
import { getLatestIndicators } from "@/actions/indicators";

export interface MacroAnalysisResponse {
  success: boolean;
  analysis?: string;
  indicatorsUsed?: Record<string, number | string>;
  modelUsed?: string;
  error?: string;
  timestamp?: string;
}

// Caché en memoria para evitar llamadas redundantes repetidas dentro de 5 minutos
let cachedAnalysis: {
  analysis: string;
  timestamp: string;
  model: string;
} | null = null;
let lastAnalysisTime = 0;
const ANALYSIS_COOLDOWN = 5 * 60 * 1000; // 5 minutos

export async function generateNvidiaMacroAnalysisAction(forceRefresh = false): Promise<MacroAnalysisResponse> {
  try {
    const now = Date.now();
    if (!forceRefresh && cachedAnalysis && now - lastAnalysisTime < ANALYSIS_COOLDOWN) {
      return {
        success: true,
        analysis: cachedAnalysis.analysis,
        modelUsed: cachedAnalysis.model,
        timestamp: cachedAnalysis.timestamp,
      };
    }

    const indicatorsRes = await getLatestIndicators();
    const indicators = indicatorsRes.success ? indicatorsRes.data : [];

    const getVal = (cod: string, fallback: string) => {
      const found = indicators.find((i) => i.codigo === cod);
      return found ? found.valor : fallback;
    };

    const uf = getVal("uf", "39.600");
    const dolar = getVal("dolar", "932");
    const utm = getVal("utm", "68.000");
    const cobre = getVal("libra_cobre", "4.50");
    const wti = getVal("wti", "76.5");
    const tpm = getVal("tpm", "5.50%");

    const systemPrompt = `Eres el Director de Análisis Macroeconómico de Contapymepuq en Punta Arenas, Magallanes. Tu trabajo es interpretar las variables económicas oficiales y explicar con rigor y claridad su impacto en las empresas de la Patagonia (comercio, Zona Franca, salmonicultura, transporte marítimo y pymes).

REGLAS DE ORO:
1. No inventes cifras. Usa exclusivamente los números reales suministrados.
2. Genera exactamente 2 párrafos concisos en español:
   - Párrafo 1 (Macro): Tendencia global de divisas y materias primas.
   - Párrafo 2 (Magallanes): Transmisión directa a los costos, flujo de caja y Zona Franca de Punta Arenas.
3. Tono analítico, seguro y aplicable.`;

    const userPrompt = `Datos económicos en tiempo real de Chile y Magallanes:
- Dólar Observado: $${dolar} CLP
- Cobre COMEX: US$ ${cobre} / lb
- Petróleo WTI: US$ ${wti} / barril
- Unidad de Fomento (UF): $${uf} CLP
- Tasa de Política Monetaria (TPM Banco Central): ${tpm}
- UTM: $${utm} CLP

Genera el análisis de impacto estratégico para la Región de Magallanes.`;

    const analysis = await callNvidiaNim(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        model: "nvidia/nemotron-3.5-lightning-30b-a3b",
        temperature: 0.3,
        max_tokens: 600,
        enable_thinking: false,
      }
    );

    const timestamp = new Date().toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });

    cachedAnalysis = {
      analysis,
      timestamp,
      model: "NVIDIA Nemotron 3.5 Lightning",
    };
    lastAnalysisTime = now;

    return {
      success: true,
      analysis,
      modelUsed: "NVIDIA Nemotron 3.5 Lightning",
      timestamp,
      indicatorsUsed: { dolar, cobre, wti, uf, tpm, utm },
    };
  } catch (err: any) {
    console.error("[NVIDIA Macro Analysis Error]:", err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}
