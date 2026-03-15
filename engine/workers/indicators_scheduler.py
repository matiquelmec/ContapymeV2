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
from datetime import date, datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from core.database import get_supabase

logger = logging.getLogger("contapyme.indicators")

# ─── Indicadores a actualizar ─────────────────────────────────────────────────
INDICADORES = {
    "uf":    "UF (Unidad de Fomento)",
    "utm":   "UTM (Unidad Tributaria Mensual)",
    "dolar": "Dólar Americano (USD)",
    "euro":  "Euro (EUR)",
    "ipc":   "IPC (Índice de Precios al Consumidor)",
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
        async with httpx.AsyncClient(timeout=15.0) as client:
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
                    msg = f"{codigo}: {str(e)}"
                    errores.append(msg)
                    logger.error(f"[Scheduler] ❌ {msg}")

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

        logger.info("[Scheduler] ✅ Scheduler de indicadores creado: Lun-Vie 09:00 AM (Santiago)")

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
