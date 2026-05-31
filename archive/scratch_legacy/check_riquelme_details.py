import sys
import os
import asyncio
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from dotenv import load_dotenv
from supabase import create_client
from engine.core.dte.sii_client import SIIClient
from engine.core.dte.dte_signer import DTESigner

load_dotenv()

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(supabase_url, supabase_key)

async def check():
    # Obtener las boletas de producción 18 y 19
    res = supabase.table("dte_issued").select("*").eq("tipo_dte", 39).in_("folio", [18, 19]).execute()
    print("BOLETAS:")
    for dte in res.data:
        print(f"\nFolio: {dte['folio']}, Status: {dte['status']}, TrackID: {dte['track_id']}")
        if not dte['track_id']:
            print("  No tiene TrackID asignado.")
            continue
            
        # Intentar consultar el TrackID en el SII
        # Necesitamos un token. Para obtener el token necesitamos firmar la semilla.
        # Descargamos el certificado de la empresa dte_companies
        comp_res = supabase.table("dte_companies").select("*").eq("id", dte["company_id"]).execute()
        comp = comp_res.data[0]
        
        cert_path = comp["cert_path"]
        enc_pass = comp["cert_password_encrypted"]
        
        pfx_bytes = supabase.storage.from_("dte_certificates").download(cert_path)
        
        rpc_res = supabase.rpc(
            "decrypt_cert_password", 
            {"encrypted_password": enc_pass, "org_id": dte["organization_id"]}
        ).execute()
        
        cert_password = rpc_res.data
        
        # Guardar temporalmente el PFX
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pfx") as tmp:
            tmp.write(pfx_bytes)
            tmp_path = tmp.name
            
        try:
            signer = DTESigner()
            signer.load_certificate(tmp_path, cert_password)
            
            # El ambiente es production
            sii_client = SIIClient(environment="production")
            
            # Ojo: la consulta del trackid se hace al ws_track SOAP con getEstUp
            # Pero para boletas el SII provee otra consulta de trackid?
            # En sii_client.py:
            #   get_boleta_seed / get_boleta_token / send_boleta
            # La API REST de boletas usa una consulta REST para el track id:
            #   https://api.sii.cl/recursos/v1/boleta.electronica.envio.estado
            # Veamos si sii_client tiene implementada la consulta REST del trackid de boletas
            
            # Vamos a obtener token de boleta
            seed = await sii_client.get_boleta_seed()
            signed_seed = signer.sign_seed(seed)
            token = await sii_client.get_boleta_token(signed_seed)
            
            # Consultar usando la API REST de boletas
            url = f"{sii_client.boleta_auth}/boleta.electronica.envio/{dte['track_id']}"
            async with sii_client._get_client() as client:
                headers = {
                    "accept": "application/json",
                    "Cookie": f"TOKEN={token}"
                }
                resp = await client.get(url, headers=headers)
                print(f"  Consulta REST API de Boleta (TrackID {dte['track_id']}):")
                print(f"  HTTP Status: {resp.status_code}")
                print(f"  Respuesta: {resp.text}")
                
        except Exception as e:
            print(f"  Error consultando TrackID: {e}")
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

asyncio.run(check())
