import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

supabase: Client = create_client(url, key)

bucket_name = "tax_documents"

try:
    # Intenta obtener el bucket
    supabase.storage.get_bucket(bucket_name)
    print(f"[OK] El bucket '{bucket_name}' ya existe.")
except Exception:
    try:
        # Si no existe, lo crea. public=False es VITAL para documentos tributarios.
        supabase.storage.create_bucket(bucket_name, {"public": False})
        print(f"[OK] Bucket '{bucket_name}' creado exitosamente como PRIVADO.")
    except Exception as e:
        print(f"[ERROR] No se pudo crear el bucket: {str(e)}")
