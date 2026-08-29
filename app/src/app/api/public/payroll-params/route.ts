import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || "http://localhost:8000";

const FALLBACK = {
  sueldo_minimo: 539000,
  tope_afp_uf: 90.0,
  tope_salud_uf: 90.0,
  tope_afc_uf: 135.2,
  sis_pct: 1.62,
  afc_indefinido_trabajador_pct: 0.6,
  afc_indefinido_empresa_pct: 2.4,
  afc_fijo_empresa_pct: 3.0,
  afp_commissions: {
    HABITAT: 1.27,
    CAPITAL: 1.44,
    CUPRUM: 1.44,
    MODELO: 0.58,
    PLANVITAL: 1.16,
    UNO: 0.49,
    PROVIDA: 1.45,
  },
};

const FALLBACK_ECONOMIC = {
  uf_valor: 39500,
  utm_valor: 68500,
};

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") || "";
  const query = period ? `?periodo=${encodeURIComponent(period)}` : "";

  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/indicators/payroll-legal-params${query}`, {
      method: "GET",
      cache: "no-store",
    });
    const payload = await response.json();
    if (response.ok && payload?.success) {
      return NextResponse.json({
        success: true,
        period: payload.periodo_solicitado,
        legal_params: payload.legal_params ?? FALLBACK,
        economic_params: payload.economic_params ?? FALLBACK_ECONOMIC,
        source: "engine",
      });
    }
  } catch {
    // Engine offline: fallback a Supabase directo
  }

  // Respaldo resiliente directo desde Supabase para UF y UTM
  let economicParams = { ...FALLBACK_ECONOMIC };
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const [ufRes, utmRes] = await Promise.all([
        supabase
          .from("economic_indicators")
          .select("valor")
          .eq("codigo", "uf")
          .order("fecha", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("economic_indicators")
          .select("valor")
          .eq("codigo", "utm")
          .order("fecha", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (ufRes.data?.valor) economicParams.uf_valor = Number(ufRes.data.valor);
      if (utmRes.data?.valor) economicParams.utm_valor = Number(utmRes.data.valor);
    }
  } catch {
    // Si falla Supabase, se mantiene FALLBACK_ECONOMIC
  }

  return NextResponse.json({
    success: true,
    period: period || new Date().toISOString().slice(0, 7),
    legal_params: FALLBACK,
    economic_params: economicParams,
    source: "supabase_resilient_fallback",
  });
}
