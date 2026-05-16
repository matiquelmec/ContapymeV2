
import asyncio
from core.database import get_supabase
from api.routers.indicators import INDICADORES_MAP, TICKERS_YAHOO
import httpx
from datetime import date, datetime

async def force_update():
    print("Iniciando actualización forzada de indicadores...")
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
                print(f"Sincronizando {codigo}...")
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
                        }, on_conflict="codigo").execute()

                        actualizados.append(codigo)
                else:
                    print(f"Error en {codigo}: {resp.status_code}")
            except Exception as e:
                print(f"Error en {codigo}: {e}")
                errores.append(f"{codigo}: {str(e)}")

        # 2. Bloque Yahoo Finance
        for codigo, (nombre, ticker) in TICKERS_YAHOO.items():
            try:
                print(f"Sincronizando {codigo} (Yahoo)...")
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
                    }, on_conflict="codigo").execute()

                    actualizados.append(codigo)
                else:
                    print(f"Error en {codigo}: {resp.status_code}")
            except Exception as e:
                print(f"Error en {codigo}: {e}")
                errores.append(f"{codigo}: {str(e)}")

    print(f"Finalizado. Actualizados: {actualizados}")
    if errores:
        print(f"Errores: {errores}")

if __name__ == "__main__":
    asyncio.run(force_update())
