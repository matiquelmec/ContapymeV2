import asyncio
import os
import logging
from typing import Dict, Any

from core.dte.sii_client import SIIClient
from core.dte.dte_signer import DTESigner
from database import get_supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def process_pending_dtes():
    """
    Worker que busca DTEs con Track ID pero sin estado final en el SII,
    consulta su estado y actualiza la base de datos.
    """
    supabase = get_supabase()
    
    # Buscar DTEs que tienen track_id pero su estado en SII no es el final
    # EPR = Envio Procesado (Aceptado)
    # RCH / RPR = Rechazado
    # Consideramos status "signed" o "pending" como pendientes
    response = supabase.table("dte_issued")\
        .select("id, company_id, track_id, status, sii_status, organization_id, dte_companies(rut)")\
        .not_is("track_id", "null")\
        .in_("sii_status", ["pending", "REC", "", None])\
        .execute()
        
    dtes_to_check = response.data
    
    if not dtes_to_check:
        logger.info("No hay DTEs pendientes de revisión de Track ID.")
        return

    logger.info(f"Encontrados {len(dtes_to_check)} DTEs pendientes. Inicializando Master Cert...")
    
    # Obtener certificado maestro
    master_pass = os.environ.get("DTE_MASTER_CERT_PASSWORD")
    if not master_pass:
        logger.error("DTE_MASTER_CERT_PASSWORD no configurado en entorno.")
        return
        
    try:
        # Descargar master cert a un archivo temporal para DTESigner
        import tempfile
        res = supabase.storage.from_("dte_certificates").download("system/master_cert.pfx")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pfx") as tmp:
            tmp.write(res)
            tmp_pfx_path = tmp.name
            
        signer = DTESigner()
        signer.load_certificate(tmp_pfx_path, master_pass)
        
        sii_client = SIIClient(environment="certification") # O production según la variable
        seed = await sii_client.get_seed()
        signed_seed = signer.sign_seed(seed)
        token = await sii_client.get_token(signed_seed)
        
    except Exception as e:
        logger.error(f"Fallo al autenticar Master Cert en el SII: {e}")
        return
    finally:
        if 'tmp_pfx_path' in locals() and os.path.exists(tmp_pfx_path):
            os.remove(tmp_pfx_path)
            
    # Procesar cada DTE
    for dte in dtes_to_check:
        dte_id = dte["id"]
        track_id = dte["track_id"]
        rut_empresa = dte["dte_companies"]["rut"]
        
        logger.info(f"Consultando Track ID {track_id} para RUT {rut_empresa}")
        
        try:
            status_res = await sii_client.query_track_id(token, rut_empresa, track_id)
            estado_sii = status_res.get("estado")
            glosa = status_res.get("glosa")
            
            update_data = {
                "sii_status": estado_sii,
                "sii_message": glosa
            }
            
            # Si el estado es final, actualizamos también el status global
            if estado_sii in ["EPR", "ACEPTADO"]:
                update_data["status"] = "accepted"
            elif estado_sii in ["RCH", "RECHAZADO", "RPR"]:
                update_data["status"] = "rejected"
                
            supabase.table("dte_issued").update(update_data).eq("id", dte_id).execute()
            
            # Centralización automática e inteligente si es aceptado
            if update_data.get("status") == "accepted":
                try:
                    from core.dte.dte_centralizer import centralize_dte_accounting
                    await centralize_dte_accounting(dte_id, dte["organization_id"])
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
