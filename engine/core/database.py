"""
Contapyme V2 — Conector Supabase para el Motor Python
Usa service_role key para operaciones administrativas (bypasa RLS).
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """
    Singleton: devuelve el cliente Supabase reutilizable.
    Usa service_role para que el Engine pueda escribir en cualquier tabla
    sin restricciones de RLS (ya que opera en el servidor de confianza).
    """
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidas en .env"
            )

        _supabase_client = create_client(url, key)

    return _supabase_client
