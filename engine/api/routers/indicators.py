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

    async with httpx.AsyncClient(timeout=10.0) as client:
        for codigo, nombre in INDICADORES.items():
            try:
                # API de mindicador.cl — gratuita y oficial
                url = f"https://mindicador.cl/api/{codigo}"
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()

                # El valor del día es el primero del array "serie"
                serie = data.get("serie", [])
                if not serie:
                    errores.append(f"{codigo}: sin datos")
                    continue

                valor = serie[0].get("valor", 0)
                fecha_valor = serie[0].get("fecha", hoy)[:10]  # Solo YYYY-MM-DD

                # Upsert en Supabase (actualiza si ya existe el código)
                db.table("economic_indicators").upsert({
                    "codigo": codigo,
                    "nombre": nombre,
                    "valor": float(valor),
                    "fecha": fecha_valor,
                    "fuente": "mindicador.cl",
                    "updated_at": "now()"
                }, on_conflict="codigo").execute()

                actualizados.append({
                    "codigo": codigo,
                    "valor": valor,
                    "fecha": fecha_valor
                })

            except Exception as e:
                errores.append(f"{codigo}: {str(e)}")

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
