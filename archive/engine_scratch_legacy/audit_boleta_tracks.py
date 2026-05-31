import asyncio
import os
import sys
import json
import logging
from dotenv import load_dotenv

# Cargar variables de entorno del archivo .env antes de cualquier importación
load_dotenv()

# Configurar logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("audit_sii_tracks")

# Agregar el directorio engine al path para poder importar
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.core.dte.sii_client import SIIClient
from engine.core.dte.dte_signer import DTESigner
from engine.core.database import get_supabase
from engine.core.dte.dte_logic import DTELogic

async def audit_tracks():
    # Usaremos el org_id real de la boleta folio 19
    org_id = "be168b8e-8906-49e5-86e1-6a75919024ba"
    supabase = get_supabase()
    companies = supabase.table("dte_companies").select("*").eq("organization_id", org_id).execute()
    if not companies.data:
        logger.error(f"No se encontró la empresa con org_id {org_id}")
        return
    
    company = companies.data[0]
    rut_empresa = company["rut"]
    logger.info(f"Auditando para Empresa RUT: {rut_empresa} (Org: {org_id})")

    # Instanciar lógica para obtener certificado
    logic = DTELogic(org_id)
    
    # Obtener certificado digital
    try:
        pfx_bytes, cert_password = logic._get_certificate()
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pfx") as tmp:
            tmp.write(pfx_bytes)
            tmp_pfx_path = tmp.name
        
        signer = DTESigner()
        signer.load_certificate(tmp_pfx_path, cert_password)
        logger.info("Certificado digital cargado correctamente.")
    except Exception as e:
        logger.error(f"Error cargando el certificado digital: {e}")
        return

    try:
        # 1. Obtener token de boletas (producción)
        sii_client = SIIClient(environment="production")
        logger.info("Obteniendo semilla de boleta...")
        seed = await sii_client.get_boleta_seed()
        logger.info(f"Semilla obtenida: {seed}")
        
        logger.info("Firmando semilla...")
        signed_seed = signer.sign_seed(seed)
        
        logger.info("Canjeando token de boleta...")
        token = await sii_client.get_boleta_token(signed_seed)
        logger.info(f"Token obtenido exitosamente.")

        # Consultar los DTEs con estado 'sent' y tipo 39/41
        dtes = supabase.table("dte_issued")\
            .select("id, folio, tipo_dte, track_id, status, error_log")\
            .eq("organization_id", org_id)\
            .in_("tipo_dte", [39, 41])\
            .order("folio", desc=True)\
            .limit(5)\
            .execute()

        if not dtes.data:
            logger.info("No se encontraron boletas en la base de datos.")
            return

        for dte in dtes.data:
            track_id = dte.get("track_id")
            folio = dte.get("folio")
            if not track_id:
                logger.info(f"Folio {folio} no tiene Track ID (status: {dte['status']})")
                continue

            logger.info(f"Consultando estado del Track ID: {track_id} para el Folio: {folio}")
            
            # Formato correcto: /boleta.electronica.envio/{rut}-{dv}-{trackid}
            # rut_empresa ej: "77411206-5" -> split
            rut_body, dv = rut_empresa.split('-')
            
            url = f"{sii_client.boleta_auth}/boleta.electronica.envio/{rut_body}-{dv}-{track_id}"
            headers = {
                "accept": "application/json",
                "User-Agent": "Mozilla/4.0 (compatible; PROG 1.0; Windows NT)",
                "Cookie": f"TOKEN={token}"
            }
            
            async with sii_client._get_client() as client:
                resp = await client.get(url, headers=headers)
                logger.info(f"Respuesta SII para Track {track_id} (HTTP {resp.status_code}):")
                try:
                    payload = resp.json()
                    logger.info(json.dumps(payload, indent=2, ensure_ascii=False))
                except Exception:
                    logger.info(resp.text)
                    
    finally:
        if 'tmp_pfx_path' in locals() and os.path.exists(tmp_pfx_path):
            os.remove(tmp_pfx_path)

if __name__ == "__main__":
    asyncio.run(audit_tracks())
