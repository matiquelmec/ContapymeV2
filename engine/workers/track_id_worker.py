import asyncio
import os
import logging
from typing import Dict, Any

from core.dte.sii_client import SIIClient
from core.dte.dte_signer import DTESigner
from core.dte.utils import prepare_sii_raw_response, sanitize_sii_payload
from core.database import get_supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def process_pending_dtes():
    """
    Worker que busca DTEs con Track ID pero sin estado final en el SII,
    consulta su estado y actualiza la base de datos.
    También busca DTEs que quedaron firmados ('signed') localmente pero no enviados y reintenta.
    """
    supabase = get_supabase()

    # ── 1. Reintentar envío de DTEs que quedaron firmados localmente sin track_id ──
    try:
        signed_response = supabase.table("dte_issued")\
            .select("id, organization_id, folio, tipo_dte")\
            .eq("status", "signed")\
            .is_("track_id", "null")\
            .execute()

        signed_dtes = signed_response.data or []
        if signed_dtes:
            logger.info(f"Encontrados {len(signed_dtes)} DTEs en estado 'signed' para reintentar envío al SII.")
            from core.dte.dte_logic import DTELogic
            for sdte in signed_dtes:
                try:
                    logger.info(f"Reintentando envío de DTE Tipo {sdte['tipo_dte']} Folio {sdte['folio']}...")
                    logic = DTELogic(sdte["organization_id"])
                    await logic.retry_send_to_sii(sdte["id"])
                    logger.info(f"DTE Tipo {sdte['tipo_dte']} Folio {sdte['folio']} reenviado con éxito.")
                except Exception as rex:
                    logger.error(f"Fallo reintento para DTE {sdte['id']}: {rex}")
    except Exception as e_signed:
        logger.error(f"Error al buscar DTEs 'signed' para reintento: {e_signed}")

    # Buscar DTEs que tienen track_id pero su estado en SII no es el final
    # EPR = Envio Procesado (Aceptado)
    # RCH / RPR = Rechazado
    # Consideramos status "signed" o "pending" como pendientes
    response = supabase.table("dte_issued")\
        .select("id, company_id, tipo_dte, track_id, status, sii_status, organization_id, dte_companies(rut)")\
        .not_is("track_id", "null")\
        .in_("sii_status", ["pending", "REC", "", None])\
        .execute()

    dtes_to_check = response.data

    if not dtes_to_check:
        logger.info("No hay DTEs pendientes de revisión de Track ID.")
        return

    logger.info(f"Encontrados {len(dtes_to_check)} DTEs pendientes.")

    # Cache para clientes y tokens de SII por (organization_id, company_id, environment)
    sii_sessions = {}

    # Procesar cada DTE
    for dte in dtes_to_check:
        dte_id = dte["id"]
        track_id = dte["track_id"]
        rut_empresa = dte["dte_companies"]["rut"]
        org_id = dte["organization_id"]
        company_id = dte["company_id"]

        # Determinar ambiente (certification o production) consultando los folios de la empresa
        try:
            caf_res = supabase.table("dte_caf_folios")\
                .select("environment")\
                .eq("company_id", company_id)\
                .eq("tipo_dte", dte["tipo_dte"])\
                .limit(1)\
                .execute()
            env = caf_res.data[0]["environment"] if (caf_res.data and len(caf_res.data) > 0) else "certification"
        except Exception as e_caf:
            logger.warning(f"No se pudo determinar ambiente para DTE {dte_id}, usando 'certification': {e_caf}")
            env = "certification"

        tipo_dte = int(dte["tipo_dte"])
        is_boleta = tipo_dte in [39, 41]
        session_key = (org_id, company_id, env, "boleta" if is_boleta else "dte")

        if session_key not in sii_sessions:
            logger.info(f"Inicializando sesión SII para Org {org_id}, Comp {company_id} en ambiente {env}...")
            try:
                from core.dte.dte_logic import DTELogic
                logic = DTELogic(org_id)
                pfx_bytes, cert_password = logic._get_certificate()

                # Descargar certificado a archivo temporal para DTESigner
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pfx") as tmp:
                    tmp.write(pfx_bytes)
                    tmp_pfx_path = tmp.name

                try:
                    signer = DTESigner()
                    signer.load_certificate(tmp_pfx_path, cert_password)

                    sii_client = SIIClient(environment=env)
                    if is_boleta:
                        seed = await sii_client.get_boleta_seed()
                        signed_seed = signer.sign_seed(seed)
                        token = await sii_client.get_boleta_token(signed_seed)
                    else:
                        seed = await sii_client.get_seed()
                        signed_seed = signer.sign_seed(seed)
                        token = await sii_client.get_token(signed_seed)

                    sii_sessions[session_key] = (sii_client, token)
                finally:
                    if os.path.exists(tmp_pfx_path):
                        os.remove(tmp_pfx_path)
            except Exception as e_auth:
                logger.error(f"Fallo al autenticar sesión para Org {org_id}, Comp {company_id} en SII: {e_auth}")
                continue

        sii_client, token = sii_sessions[session_key]
        logger.info(f"Consultando Track ID {track_id} para RUT {rut_empresa} ({env})")

        try:
            if is_boleta:
                status_res = await sii_client.query_boleta_track_id(token, rut_empresa, track_id)
            else:
                status_res = await sii_client.query_track_id(token, rut_empresa, track_id)
            estado_sii = status_res.get("estado")
            glosa = status_res.get("glosa")

            update_data = {
                "sii_status": estado_sii,
                "sii_message": glosa,
                "sii_checked_at": __import__("datetime").datetime.datetime.now(__import__("datetime").timezone.utc).isoformat(),
                "sii_response_payload": sanitize_sii_payload(status_res.get("response") or status_res),
                "sii_raw_response": prepare_sii_raw_response(status_res.get("raw_response") or status_res.get("raw_xml")),
            }

            # Si el estado es final, actualizamos también el status global
            if estado_sii in ["ACE", "ACEPTADO", "OK", "0"]:
                update_data["status"] = "accepted"
                update_data["sii_submission_status"] = "accepted"
            elif estado_sii in ["RCH", "RECHAZADO", "RPR", "RFR"]:
                update_data["status"] = "rejected"
                update_data["sii_submission_status"] = "rejected"
            else:
                update_data["sii_submission_status"] = "received"

            supabase.table("dte_issued").update(update_data).eq("id", dte_id).execute()

            # Centralización automática e inteligente si es aceptado
            if update_data.get("status") == "accepted":
                try:
                    from core.dte.dte_centralizer import centralize_dte_accounting
                    await centralize_dte_accounting(dte_id, org_id)
                except Exception as cent_err:
                    logger.error(f"Advertencia: No se pudo centralizar contablemente el DTE {dte_id} en el worker de Track ID: {cent_err}")
            logger.info(f"DTE {dte_id} actualizado a estado SII: {estado_sii} - {glosa}")

        except Exception as query_e:
            logger.error(f"Error consultando Track ID {track_id}: {query_e}")

async def run_worker():
    while True:
        try:
            await process_pending_dtes()
        except Exception as e:
            logger.error(f"Worker Error: {e}")

        # Esperar 60 segundos antes de la próxima revisión
        await asyncio.sleep(60)

if __name__ == "__main__":
    logger.info("Iniciando DTE Track ID Worker...")
    asyncio.run(run_worker())
