"""
Worker de Indicadores Económicos — Contapyme V2
Consulta la API oficial de mindicador.cl y guarda los valores del día en Supabase.
Indicadores: UF, UTM, Dólar (USD), Euro (EUR), IPC
"""
import httpx
import time
from datetime import date
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from core.database import get_supabase
from core.auth import verify_token

router = APIRouter()

# Mapa de indicadores: código mindicador.cl → nombre display
INDICADORES = {
    "uf":     "UF (Unidad de Fomento)",
    "utm":    "UTM (Unidad Tributaria Mensual)",
    "dolar":  "Dólar Americano (USD)",
    "euro":   "Euro (EUR)",
    "ipc":    "IPC (Índice de Precios al Consumidor)",
}

# ─── Sistema de Caché Interno para Indicadores ───────────────────────────
_indicators_cache = {"data": None, "ts": 0}
IND_CACHE_TTL = 3600 # 1 hora

@router.post("/update")
async def update_indicators(current_user: dict = Depends(verify_token)):
    """
    Consulta mindicador.cl para cada indicador y hace upsert en economic_indicators.
    """
    db = get_supabase()
    hoy = date.today().isoformat()
    actualizados = []
    errores = []

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
        for codigo, nombre in INDICADORES.items():
            try:
                url = f"https://mindicador.cl/api/{codigo}"
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()

                serie = data.get("serie", [])
                if not serie:
                    errores.append(f"{codigo}: sin datos")
                    continue

                batch = []
                for entry in serie[:31]:
                    valor = entry.get("valor", 0)
                    fecha_valor = entry.get("fecha")[:10]
                    
                    batch.append({
                        "codigo": codigo, "nombre": nombre, "valor": float(valor),
                        "fecha": fecha_valor, "fuente": "mindicador.cl", "updated_at": "now()"
                    })

                db.table("economic_indicators").upsert(batch, on_conflict="codigo, fecha").execute()
                actualizados.append({"codigo": codigo, "nombre": nombre, "registros": len(batch)})

            except Exception as e:
                msg = f"{codigo}: {type(e).__name__} - {str(e)}"
                errores.append(msg)
                print(f"[INDICATORS] Error en {codigo}: {msg}")

    # Invalidar caché tras actualización
    _indicators_cache["data"] = None
    return {"success": len(errores) == 0, "actualizados": actualizados, "errores": errores, "total": len(actualizados)}

@router.get("/latest")
async def get_latest_indicators():
    """
    Devuelve los últimos valores de cada indicador. Público para Landing Page.
    """
    global _indicators_cache
    if _indicators_cache["data"] and (time.time() - _indicators_cache["ts"] < IND_CACHE_TTL):
        return {"success": True, "data": _indicators_cache["data"]}
    
    db = get_supabase()
    try:
        result = db.table("economic_indicators").select("*").order("fecha", desc=True).execute()
        if not result.data: return {"success": True, "data": []}

        latest_map = {}
        for row in result.data:
            cod = row["codigo"]
            if cod not in latest_map: latest_map[cod] = row
        
        final_data = list(latest_map.values())
        _indicators_cache["data"] = final_data
        _indicators_cache["ts"] = time.time()
        
        return {"success": True, "data": final_data}
    except Exception as e:
        print(f"[INDICATORS] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
