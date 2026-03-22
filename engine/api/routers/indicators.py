"""
Worker de Indicadores Económicos — Contapyme V2
Consulta la API oficial de mindicador.cl y guarda los valores del día en Supabase.
Indicadores: UF, UTM, Dólar (USD), Euro (EUR), IPC
"""
import httpx
from datetime import date
from fastapi import APIRouter, HTTPException
from core.database import get_supabase

router = APIRouter()

# Mapa de indicadores: código mindicador.cl → nombre display
INDICADORES = {
    "uf":     "UF (Unidad de Fomento)",
    "utm":    "UTM (Unidad Tributaria Mensual)",
    "dolar":  "Dólar Americano (USD)",
    "euro":   "Euro (EUR)",
    "ipc":    "IPC (Índice de Precios al Consumidor)",
}


@router.post("/update")
async def update_indicators():
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
                # API de mindicador.cl — gratuita y oficial
                url = f"https://mindicador.cl/api/{codigo}"
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()

                # En lugar de solo el último, enviamos como una serie temporal
                serie = data.get("serie", [])
                if not serie:
                    errores.append(f"{codigo}: sin datos")
                    continue

                # Procesamos los últimos 31 días (un mes completo) para robustecer el histórico
                batch = []
                for entry in serie[:31]:
                    valor = entry.get("valor", 0)
                    fecha_valor = entry.get("fecha")[:10]  # YYYY-MM-DD
                    
                    batch.append({
                        "codigo": codigo,
                        "nombre": nombre,
                        "valor": float(valor),
                        "fecha": fecha_valor,
                        "fuente": "mindicador.cl",
                        "updated_at": "now()"
                    })

                # Upsert masivo basado en la nueva restricción única (codigo, fecha)
                db.table("economic_indicators").upsert(batch, on_conflict="codigo, fecha").execute()

                actualizados.append({
                    "codigo": codigo,
                    "nombre": nombre,
                    "registros": len(batch)
                })

            except Exception as e:
                import traceback
                msg = f"{codigo}: {type(e).__name__} - {str(e)}"
                errores.append(msg)
                print(f"[INDICATORS] Error en {codigo}: {msg}")
                traceback.print_exc()

    return {
        "success": len(errores) == 0,
        "actualizados": actualizados,
        "errores": errores,
        "total": len(actualizados)
    }


@router.get("/latest")
async def get_latest_indicators():
    """
    Devuelve los últimos valores de todos los indicadores guardados en DB.
    """
    db = get_supabase()
    try:
        result = db.table("economic_indicators").select("*").execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
