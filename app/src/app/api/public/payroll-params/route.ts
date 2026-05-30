import { NextRequest, NextResponse } from "next/server";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || "http://localhost:8000";

const FALLBACK = {
  sueldo_minimo: 539000,
  tope_afp_uf: 84.3,
  tope_salud_uf: 84.3,
  tope_afc_uf: 126.6,
  sis_pct: 1.49,
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

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") || "";
  const query = period ? `?periodo=${encodeURIComponent(period)}` : "";

  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/indicators/payroll-legal-params${query}`, {
      method: "GET",
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      throw new Error("engine_error");
    }

    return NextResponse.json({
      success: true,
      period: payload.periodo_solicitado,
      legal_params: payload.legal_params ?? FALLBACK,
      economic_params: payload.economic_params ?? null,
      source: "engine",
    });
  } catch {
    return NextResponse.json({
      success: true,
      period: period || null,
      legal_params: FALLBACK,
      economic_params: null,
      source: "fallback",
    });
  }
}
