"""
indicators_scheduler.py — Worker Cronometrado de Indicadores Económicos Chile
==============================================================================
Implementa un scheduler APScheduler que actualiza automáticamente los
indicadores económicos una vez por día desde mindicador.cl.

INTEGRACIÓN CON MAIN.PY:
  El scheduler se activa vía eventos de startup/shutdown de FastAPI.
  Ver main.py para la integración (lifespan handler).

INDICADORES ACTUALIZADOS:
  - UF  (Unidad de Fomento)
  - UTM (Unidad Tributaria Mensual)
  - USD (Dólar Americano)
  - EUR (Euro)
  - IPC (Índice de Precios al Consumidor)
"""

import logging
import httpx
from datetime import date, datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from core.database import get_supabase

logger = logging.getLogger("contapyme.indicators")

# ─── Indicadores a actualizar ─────────────────────────────────────────────────
INDICADORES = {
    "uf":          "UF (Unidad de Fomento)",
    "utm":         "UTM (Unidad Tributaria Mensual)",
    "dolar":       "Dólar Americano (USD)",
    "euro":        "Euro (EUR)",
    "ipc":         "IPC (Índice de Precios al Consumidor)",
    "libra_cobre": "Cobre (US$ por Libra)",
    "tpm":         "Tasa Política Monetaria (TPM)",
    "imacec":      "IMACEC (Crecimiento Regional)",
}

# ─── Scheduler global (singleton) ─────────────────────────────────────────────
_scheduler: AsyncIOScheduler | None = None


async def _fetch_and_store_indicators() -> dict:
    """
    Worker principal: consulta mindicador.cl y persiste en Supabase.
    Función pura que puede ser llamada manualmente o por el scheduler.
    """
    db = get_supabase()
    hoy = date.today().isoformat()
    actualizados = []
    errores = []

    logger.info(f"[Scheduler] Actualizando indicadores económicos — {hoy}")

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
            for codigo, nombre in INDICADORES.items():
                try:
                    url = f"https://mindicador.cl/api/{codigo}"
                    resp = await client.get(url, follow_redirects=True)
                    resp.raise_for_status()
                    data = resp.json()

                    serie = data.get("serie", [])
                    if not serie:
                        msg = f"{codigo}: API sin datos en serie"
                        errores.append(msg)
                        logger.warning(f"[Scheduler] {msg}")
                        continue

                    valor = float(serie[0].get("valor", 0))
                    fecha_valor = serie[0].get("fecha", hoy)[:10]

                    db.table("economic_indicators").upsert(
                        {
                            "codigo": codigo,
                            "nombre": nombre,
                            "valor": valor,
                            "fecha": fecha_valor,
                            "fuente": "mindicador.cl",
                            "updated_at": datetime.utcnow().isoformat(),
                        },
                        on_conflict="codigo",
                    ).execute()

                    actualizados.append({"codigo": codigo, "valor": valor, "fecha": fecha_valor})
                    logger.info(f"[Scheduler] ✅ {codigo.upper()} = {valor:,.2f} ({fecha_valor})")

                except httpx.HTTPStatusError as e:
                    msg = f"{codigo}: HTTP {e.response.status_code}"
                    errores.append(msg)
                    logger.error(f"[Scheduler] ❌ {msg}")
                except Exception as e:
                    import traceback
                    msg = f"{codigo}: {type(e).__name__} - {str(e)}"
                    errores.append(msg)
                    logger.error(f"[Scheduler] ❌ {msg}")
                    logger.debug(f"[Scheduler] Traceback: {traceback.format_exc()}")

            # ─── Yahoo Finance Ticker Sync (IPSA & WTI) ───────────────────────
            # Estos datos no están en mindicador.cl, los buscamos vía Yahoo Finance Query Engine
            TICKERS = {
                "ipsa": ("IPSA Chile", "%5EIPSA"),
                "wti":  ("Petróleo WTI", "CL=F")
            }
            for codigo, (nombre, ticker) in TICKERS.items():
                try:
                    # Usamos el motor de consulta v8 de Yahoo (sin necesidad de API KEY)
                    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=1d"
                    resp = await client.get(url, follow_redirects=True)
                    if resp.status_code == 200:
                        data = resp.json()
                        chart = data.get("chart", {}).get("result", [{}])[0]
                        meta = chart.get("meta", {})
                        valor = float(meta.get("regularMarketPrice", 0))
                        prev_close = float(meta.get("previousClose", valor))
                        variacion = ((valor - prev_close) / prev_close) * 100 if prev_close != 0 else 0
                        
                        # Persistimos con el formato unificado
                        db.table("economic_indicators").upsert({
                            "codigo": codigo,
                            "nombre": nombre,
                            "valor": valor,
                            "fecha": hoy,
                            "fuente": "Yahoo Finance (Global)",
                            "updated_at": datetime.utcnow().isoformat(),
                        }, on_conflict="codigo").execute()
                        
                        actualizados.append({"codigo": codigo, "valor": valor})
                        logger.info(f"[Scheduler] ✅ {codigo.upper()} (Market Pulse) = {valor:,.2f} ({variacion:+.2f}%)")
                except Exception as ey:
                    logger.warning(f"[Scheduler] ⚠️ Error capturando {codigo} de Yahoo Finance: {ey}")

    except Exception as e:
        logger.critical(f"[Scheduler] Error crítico en worker de indicadores: {e}")
        errores.append(f"Error crítico: {str(e)}")

    result = {
        "success": len(errores) == 0,
        "actualizados": actualizados,
        "errores": errores,
        "total": len(actualizados),
        "timestamp": datetime.utcnow().isoformat(),
    }

    if errores:
        logger.warning(f"[Scheduler] Completado con {len(errores)} error(es): {errores}")
    else:
        logger.info(f"[Scheduler] ✅ Todos los indicadores actualizados correctamente.")

    return result


async def _cleanup_old_audit_logs():
    """
    Tarea de mantenimiento B2B: Elimina audit_logs más antiguos a 6 meses
    para mantener el rendimiento de la tabla y no asfixiar PostgreSQL.
    """
    db = get_supabase()
    limite_fecha = (datetime.utcnow() - timedelta(days=180)).isoformat()
    logger.info(f"[Mantenimiento] Iniciando purga de bitácora (anteriores a {limite_fecha})...")
    
    try:
        # Usar Supabase RESTual (Postgrest) para eliminar sin necesidad de un Trigger SQL manual
        res = db.table("audit_logs").delete().lte("created_at", limite_fecha).execute()
        if res.data is not None:
            logger.info(f"[Mantenimiento] ✅ Purga completada. Se liberaron {len(res.data)} registros antiguos.")
        else:
            logger.info("[Mantenimiento] ✅ Purga ejecutada sin errores (sin datos retornados).")
    except Exception as e:
        logger.error(f"[Mantenimiento] ❌ Error purgando la bitácora vieja: {e}")


def get_scheduler() -> AsyncIOScheduler:
    """
    Retorna el scheduler singleton, creándolo si no existe.
    Configurado para actualizar indicadores diariamente a las 09:00 AM Chile.
    """
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(timezone="America/Santiago")

        # Cron: lunes–viernes a las 09:00 AM (hora Chile)
        # Los indicadores del SII solo cambian en días hábiles
        _scheduler.add_job(
            func=_fetch_and_store_indicators,
            trigger=CronTrigger(
                day_of_week="mon-fri",
                hour=9,
                minute=0,
                timezone="America/Santiago",
            ),
            id="daily_indicators_update",
            name="Actualización Diaria Indicadores Económicos",
            replace_existing=True,
            misfire_grace_time=3600,  # 1 hora de gracia si el servidor estaba offline
        )

        # Cron: Limpieza de Bitácora (El primer día de cada mes a las 03:00 AM)
        _scheduler.add_job(
            func=_cleanup_old_audit_logs,
            trigger=CronTrigger(
                day="1",
                hour=3,
                minute=0,
                timezone="America/Santiago",
            ),
            id="monthly_audit_cleanup",
            name="Limpieza Mensual de Audit Logs (Retiros de > 6 meses)",
            replace_existing=True,
        )

        logger.info("[Scheduler] ✅ Scheduler de indicadores y mantenimiento creado (09:00 AM y 03:00 AM)")

    return _scheduler


async def start_scheduler():
    """
    Arranca el scheduler. Llamar desde el lifespan de FastAPI.
    También ejecuta una actualización inmediata al iniciar.
    """
    scheduler = get_scheduler()
    if not scheduler.running:
        scheduler.start()
        logger.info("[Scheduler] 🚀 Iniciado correctamente.")
        # Actualización inmediata al arrancar el servidor
        try:
            result = await _fetch_and_store_indicators()
            logger.info(f"[Scheduler] Actualización al inicio: {result['total']} indicadores OK.")
        except Exception as e:
            logger.warning(f"[Scheduler] Actualización al inicio falló (no crítico): {e}")


async def stop_scheduler():
    """
    Detiene el scheduler limpiamente. Llamar desde el lifespan shutdown.
    """
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("[Scheduler] 🛑 Detenido correctamente.")
