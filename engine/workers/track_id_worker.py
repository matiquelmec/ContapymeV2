import asyncio
import os
import time
import datetime
import logging
import tempfile
from typing import Dict, Any, Tuple

from core.dte.sii_client import SIIClient
from core.dte.dte_signer import DTESigner
from core.dte.utils import prepare_sii_raw_response, sanitize_sii_payload
from core.database import get_supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ─── Configuración por entorno ──────────────────────────────────────────────
def _flag(name: str, default: bool) -> bool:
    return os.environ.get(name, "true" if default else "false").strip().lower() not in ("false", "0", "no", "off")

WORKER_ENABLED = _flag("DTE_WORKER_ENABLED", True)           # apaga TODO el worker DTE
AUTO_RESEND_ENABLED = _flag("DTE_AUTO_RESEND_ENABLED", True) # apaga solo el reenvío automático de 'signed'
POLL_INTERVAL = int(os.environ.get("DTE_WORKER_INTERVAL_SECONDS", "60"))
MAX_SEND_ATTEMPTS = int(os.environ.get("DTE_MAX_SEND_ATTEMPTS", "6"))
RESEND_BATCH = int(os.environ.get("DTE_RESEND_BATCH", "50"))
TOKEN_TTL_SECONDS = int(os.environ.get("DTE_TOKEN_TTL_SECONDS", "1800"))  # ~30 min

# Backoff (minutos) por nº de intento (1-indexed). Tras agotarlos se deja de reintentar.
_BACKOFF_MIN = [1, 5, 30, 120, 360, 720]

# Estados SII finales
_ACCEPTED = {"ACE", "ACEPTADO", "OK", "0", "EPR", "DOK"}
_REJECTED = {"RCH", "RECHAZADO", "RPR", "RFR", "RSC", "RCT", "ANC"}

# Cache de sesiones (token) a nivel de proceso: session_key -> (client, token, expira_epoch)
_token_cache: Dict[Tuple, Tuple[Any, str, float]] = {}


def _utcnow() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


def _iso_z(dt: datetime.datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _next_retry_at(attempts: int) -> datetime.datetime:
    idx = max(0, min(attempts, len(_BACKOFF_MIN)) - 1)
    return _utcnow() + datetime.timedelta(minutes=_BACKOFF_MIN[idx])


async def _get_session(org_id: str, company_id: str, env: str, is_boleta: bool):
    """Obtiene (client, token) reutilizando un token cacheado a nivel de proceso.

    Evita re-autenticar (getSeed+getToken) en cada ciclo, lo que martillaba el SII.
    """
    key = (org_id, company_id, env, "boleta" if is_boleta else "dte")
    cached = _token_cache.get(key)
    if cached and cached[2] > time.time():
        return cached[0], cached[1]

    from core.dte.dte_logic import DTELogic
    logic = DTELogic(org_id)
    pfx_bytes, cert_password = logic._get_certificate()
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pfx") as tmp:
        tmp.write(pfx_bytes)
        tmp_pfx_path = tmp.name
    try:
        signer = DTESigner()
        signer.load_certificate(tmp_pfx_path, cert_password)
        sii_client = SIIClient(environment=env)
        if is_boleta:
            token = await sii_client.get_boleta_token(signer.sign_seed(await sii_client.get_boleta_seed()))
        else:
            token = await sii_client.get_token(signer.sign_seed(await sii_client.get_seed()))
    finally:
        if os.path.exists(tmp_pfx_path):
            os.remove(tmp_pfx_path)

    _token_cache[key] = (sii_client, token, time.time() + TOKEN_TTL_SECONDS)
    return sii_client, token


async def _resend_signed(supabase):
    """Reenvía DTEs 'signed' sin track_id, con backoff exponencial y tope de intentos.

    Solo toma los que ya cumplieron su next_send_retry_at y no agotaron MAX_SEND_ATTEMPTS.
    Esto reemplaza el reenvío masivo cada 60s que gatillaba throttling en el SII.
    """
    if not AUTO_RESEND_ENABLED:
        return

    now_z = _iso_z(_utcnow())
    try:
        resp = supabase.table("dte_issued")\
            .select("id, organization_id, folio, tipo_dte, send_attempts")\
            .eq("status", "signed")\
            .is_("track_id", "null")\
            .lt("send_attempts", MAX_SEND_ATTEMPTS)\
            .or_(f"next_send_retry_at.is.null,next_send_retry_at.lte.{now_z}")\
            .limit(RESEND_BATCH)\
            .execute()
    except Exception as e:
        logger.error(f"Error buscando DTEs 'signed' para reenviar: {e}")
        return

    pendientes = resp.data or []
    if not pendientes:
        return

    logger.info(f"Reenvío con backoff: {len(pendientes)} DTE 'signed' por reintentar.")
    from core.dte.dte_logic import DTELogic
    for sdte in pendientes:
        attempts = (sdte.get("send_attempts") or 0) + 1
        try:
            logic = DTELogic(sdte["organization_id"])
            await logic.retry_send_to_sii(sdte["id"])
            supabase.table("dte_issued").update(
                {"send_attempts": attempts, "last_send_error": None}
            ).eq("id", sdte["id"]).execute()
            logger.info(f"DTE Folio {sdte['folio']} reenviado OK (intento {attempts}).")
        except Exception as rex:
            err = str(rex)[:500]
            update = {"send_attempts": attempts, "last_send_error": err,
                      "next_send_retry_at": _iso_z(_next_retry_at(attempts))}
            if attempts >= MAX_SEND_ATTEMPTS:
                logger.error(f"DTE {sdte['id']} agotó {attempts} intentos de envío; se deja de reintentar. Último error: {err}")
            else:
                logger.warning(f"DTE {sdte['id']} falló intento {attempts}; reintento diferido (backoff). {err}")
            try:
                supabase.table("dte_issued").update(update).eq("id", sdte["id"]).execute()
            except Exception as upd_e:
                logger.error(f"No se pudo actualizar backoff del DTE {sdte['id']}: {upd_e}")


async def _poll_track_ids(supabase):
    """Consulta el estado en el SII de DTEs ya enviados (con track_id) y actualiza la BD."""
    response = supabase.table("dte_issued")\
        .select("id, company_id, tipo_dte, track_id, status, sii_status, organization_id, dte_companies(rut)")\
        .not_is("track_id", "null")\
        .in_("sii_status", ["pending", "REC", "", None])\
        .execute()

    dtes = response.data or []
    if not dtes:
        return
    logger.info(f"{len(dtes)} DTE con track_id pendientes de estado final.")

    for dte in dtes:
        dte_id = dte["id"]
        track_id = dte["track_id"]
        rut_empresa = (dte.get("dte_companies") or {}).get("rut")
        org_id = dte["organization_id"]
        company_id = dte["company_id"]
        if not rut_empresa:
            logger.warning(f"DTE {dte_id} sin RUT de empresa; se omite.")
            continue

        # Ambiente real desde el CAF; si no se puede determinar, SE OMITE (no asumir certificación).
        try:
            caf_res = supabase.table("dte_caf_folios")\
                .select("environment")\
                .eq("company_id", company_id)\
                .eq("tipo_dte", dte["tipo_dte"])\
                .limit(1)\
                .execute()
            if not caf_res.data:
                logger.warning(f"DTE {dte_id}: sin CAF para determinar ambiente; se omite (no se asume certificación).")
                continue
            env = caf_res.data[0]["environment"]
        except Exception as e_caf:
            logger.warning(f"DTE {dte_id}: error determinando ambiente ({e_caf}); se omite.")
            continue

        tipo_dte = int(dte["tipo_dte"])
        is_boleta = tipo_dte in (39, 41)

        try:
            sii_client, token = await _get_session(org_id, company_id, env, is_boleta)
        except Exception as e_auth:
            logger.error(f"Fallo autenticando sesión SII (Org {org_id}, {env}): {e_auth}")
            continue

        try:
            if is_boleta:
                status_res = await sii_client.query_boleta_track_id(token, rut_empresa, track_id)
            else:
                status_res = await sii_client.query_track_id(token, rut_empresa, track_id)
            estado_sii = (status_res.get("estado") or "").strip()
            glosa = status_res.get("glosa")

            update_data = {
                "sii_status": estado_sii,
                "sii_message": glosa,
                "sii_checked_at": _utcnow().isoformat(),
                "sii_response_payload": sanitize_sii_payload(status_res.get("response") or status_res),
                "sii_raw_response": prepare_sii_raw_response(status_res.get("raw_response") or status_res.get("raw_xml")),
            }
            if estado_sii.upper() in _ACCEPTED:
                update_data["status"] = "accepted"
                update_data["sii_submission_status"] = "accepted"
            elif estado_sii.upper() in _REJECTED:
                update_data["status"] = "rejected"
                update_data["sii_submission_status"] = "rejected"
            else:
                update_data["sii_submission_status"] = "received"

            supabase.table("dte_issued").update(update_data).eq("id", dte_id).execute()

            if update_data.get("status") == "accepted":
                try:
                    from core.dte.dte_centralizer import centralize_dte_accounting
                    await centralize_dte_accounting(dte_id, org_id)
                except Exception as cent_err:
                    logger.error(f"No se pudo centralizar DTE {dte_id}: {cent_err}")
            logger.info(f"DTE {dte_id} -> estado SII {estado_sii} ({glosa})")
        except Exception as query_e:
            logger.error(f"Error consultando Track ID {track_id}: {query_e}")


async def process_pending_dtes():
    """Un ciclo del worker: reenvío con backoff + consulta de estado de track_ids."""
    if not WORKER_ENABLED:
        return
    supabase = get_supabase()
    await _resend_signed(supabase)
    await _poll_track_ids(supabase)


async def run_worker():
    if not WORKER_ENABLED:
        logger.warning("DTE Worker DESACTIVADO por DTE_WORKER_ENABLED=false. No se procesarán DTEs.")
        return
    logger.info(f"DTE Worker activo (intervalo {POLL_INTERVAL}s, max intentos {MAX_SEND_ATTEMPTS}, auto-reenvío {AUTO_RESEND_ENABLED}).")
    while True:
        try:
            await process_pending_dtes()
        except Exception as e:
            logger.error(f"Worker Error: {e}")
        await asyncio.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    logger.info("Iniciando DTE Track ID Worker...")
    asyncio.run(run_worker())
