from __future__ import annotations

from typing import Any, Dict
import logging

from calculators.national_params import (
    TOPE_AFP_UF,
    TOPE_SALUD_UF,
    TOPE_AFC_UF,
    SIS_PCT,
    SUELDO_MINIMO,
    AFC_INDEFINIDO_TRABAJADOR_PCT,
    AFC_INDEFINIDO_EMPRESA_PCT,
    AFC_FIJO_EMPRESA_PCT,
    AFP_COMISIONES,
)

logger = logging.getLogger(__name__)


def get_period_start(periodo: str) -> str:
    periodo_clean = periodo[:7]
    return f"{periodo_clean}-01"


def resolve_economic_indicators(db: Any, period_start: str) -> Dict[str, float]:
    uf_valor = 38000.0
    utm_valor = 67294.0

    try:
        ind_res = (
            db.table("economic_indicators")
            .select("codigo, valor")
            .in_("codigo", ["uf", "utm"])
            .lte("fecha", period_start)
            .order("fecha", desc=True)
            .limit(2)
            .execute()
        )

        for ind in ind_res.data or []:
            if ind["codigo"] == "uf":
                uf_valor = float(ind["valor"])
            elif ind["codigo"] == "utm":
                utm_valor = float(ind["valor"])
    except Exception as exc:
        logger.warning("Fallo al obtener UF/UTM; usando fallback. error=%s", exc)

    return {"uf_valor": uf_valor, "utm_valor": utm_valor}


def resolve_legal_payroll_params(db: Any, period_start: str) -> Dict[str, Any]:
    resolved = {
        "sueldo_minimo": SUELDO_MINIMO,
        "tope_afp_uf": TOPE_AFP_UF,
        "tope_salud_uf": TOPE_SALUD_UF,
        "tope_afc_uf": TOPE_AFC_UF,
        "sis_pct": SIS_PCT,
        "afc_indefinido_trabajador_pct": AFC_INDEFINIDO_TRABAJADOR_PCT,
        "afc_indefinido_empresa_pct": AFC_INDEFINIDO_EMPRESA_PCT,
        "afc_fijo_empresa_pct": AFC_FIJO_EMPRESA_PCT,
        "afp_commissions": AFP_COMISIONES,
        "source": "fallback_national_params",
    }

    try:
        param_res = (
            db.table("national_payroll_params")
            .select("*")
            .lte("periodo", period_start)
            .order("periodo", desc=True)
            .limit(1)
            .execute()
        )
        if param_res.data:
            row = param_res.data[0]
            resolved["sueldo_minimo"] = int(row.get("sueldo_minimo", resolved["sueldo_minimo"]))
            resolved["tope_afp_uf"] = float(row.get("tope_afp_uf", resolved["tope_afp_uf"]))
            resolved["tope_salud_uf"] = float(row.get("tope_salud_uf", resolved["tope_salud_uf"]))
            resolved["tope_afc_uf"] = float(row.get("tope_afc_uf", resolved["tope_afc_uf"]))
            resolved["sis_pct"] = float(row.get("sis_pct", resolved["sis_pct"]))
            resolved["afc_indefinido_trabajador_pct"] = float(
                row.get("afc_indefinido_trabajador_pct", resolved["afc_indefinido_trabajador_pct"])
            )
            resolved["afc_indefinido_empresa_pct"] = float(
                row.get("afc_indefinido_empresa_pct", resolved["afc_indefinido_empresa_pct"])
            )
            resolved["afc_fijo_empresa_pct"] = float(
                row.get("afc_fijo_empresa_pct", resolved["afc_fijo_empresa_pct"])
            )
            resolved["source"] = "national_payroll_params"
            resolved["source_periodo"] = row.get("periodo")
    except Exception as exc:
        logger.warning("Fallo al obtener parametros legales; usando fallback. error=%s", exc)

    return resolved
