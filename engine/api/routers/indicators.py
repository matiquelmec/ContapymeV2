"""
Worker de Indicadores Económicos — Contapyme V2 (Motor de Alta Precisión)
==============================================================================
Sincroniza Indicadores desde mindicador.cl y Yahoo Finance. 
Resuelve el problema de "Cargando..." habilitando Market Pulse dinámico.
"""
import httpx
import time
import logging
from datetime import date, datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from core.database import get_supabase
from core.auth import verify_token

logger = logging.getLogger("contapyme.indicators.api")
router = APIRouter()

# ─── Configuraciones ──────────────────────────────────────────────────────────
INDICADORES_MAP = {
    "uf":          "UF (Unidad de Fomento)",
    "utm":         "UTM (Unidad Tributaria Mensual)",
    "dolar":       "Dólar Americano (USD)",
    "euro":        "Euro (EUR)",
    "ipc":         "IPC (Índice de Precios al Consumidor)",
    "libra_cobre": "Cobre (US$ por Libra)",
    "tpm":         "Tasa Política Monetaria (TPM)",
    "imacec":      "IMACEC (Crecimiento Regional)",
}

TICKERS_YAHOO = {
    "ipsa": ("IPSA Chile", "%5EIPSA"),
    "wti":  ("Petróleo WTI", "CL=F")
}

_indicators_cache = {"data": None, "ts": 0}
IND_CACHE_TTL = 3600 

@router.post("/update")
async def update_indicators(current_user: dict = Depends(verify_token)):
    """
    Efectúa una sincronización manual de todos los indicadores, incluyendo Market Pulse.
    """
    db = get_supabase()
    hoy = date.today().isoformat()
    actualizados = []
    errores = []

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
        # 1. Bloque mindicador.cl
        for codigo, nombre in INDICADORES_MAP.items():
            try:
                url = f"https://mindicador.cl/api/{codigo}"
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    serie = data.get("serie", [])
                    if serie:
                        valor = float(serie[0].get("valor", 0))
                        fecha_valor = serie[0].get("fecha", hoy)[:10]

                        db.table("economic_indicators").upsert({
                            "codigo": codigo, 
                            "nombre": nombre, 
                            "valor": valor,
                            "fecha": fecha_valor, 
                            "fuente": "mindicador.cl", 
                            "updated_at": datetime.utcnow().isoformat()
                        }, on_conflict="codigo,fecha").execute()

                        actualizados.append(codigo)
            except Exception as e:
                errores.append(f"{codigo}: {str(e)}")

        # 2. Bloque Yahoo Finance (Market Pulse)
        for codigo, (nombre, ticker) in TICKERS_YAHOO.items():
            try:
                url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=1d"
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    chart = data.get("chart", {}).get("result", [{}])[0]
                    meta = chart.get("meta", {})
                    valor = float(meta.get("regularMarketPrice", 0))

                    db.table("economic_indicators").upsert({
                        "codigo": codigo, 
                        "nombre": nombre, 
                        "valor": valor,
                        "fecha": hoy,
                        "fuente": "Yahoo Finance", 
                        "updated_at": datetime.utcnow().isoformat()
                    }, on_conflict="codigo,fecha").execute()

                    actualizados.append(codigo)
            except Exception as e:
                errores.append(f"{codigo}: {str(e)}")

    # Limpiar caché
    _indicators_cache["data"] = None
    return {
        "success": len(errores) == 0, 
        "actualizados": actualizados, 
        "errores": errores, 
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/latest")
async def get_latest_indicators():
    """
    Retorna los indicadores más frescos para el Dashboard y Landing Page.
    """
    global _indicators_cache
    if _indicators_cache["data"] and (time.time() - _indicators_cache["ts"] < IND_CACHE_TTL):
        return {"success": True, "data": _indicators_cache["data"]}
    
    db = get_supabase()
    try:
        # Obtenemos todo y el código de unicidad ya nos garantiza el último valor
        result = db.table("economic_indicators").select("*").order("codigo").execute()
        
        _indicators_cache["data"] = result.data
        _indicators_cache["ts"] = time.time()
        
        return {"success": True, "data": result.data}
    except Exception as e:
        logger.error(f"[INDICATORS] Error fetching latest: {e}")
        raise HTTPException(status_code=500, detail="Error de base de datos.")
