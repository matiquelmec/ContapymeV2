import os
import sys
from pathlib import Path
import psycopg2
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

from urllib.parse import quote, unquote, urlparse

def _supabase_pooler_url(db_url: str) -> str | None:
    parsed = urlparse(db_url)
    host = parsed.hostname or ""
    if not host.endswith(".supabase.co") or not host.startswith("db."):
        return None

    project_ref = host.removeprefix("db.").removesuffix(".supabase.co")
    username = parsed.username or "postgres"
    password = quote(unquote(parsed.password or ""), safe="")
    database = (parsed.path or "/postgres").lstrip("/") or "postgres"
    query = parsed.query or "sslmode=require"
    return (
        f"postgresql://{username}.{project_ref}:{password}"
        f"@aws-1-us-east-2.pooler.supabase.com:6543/{database}?{query}"
    )

def _connect(db_url: str):
    try:
        return psycopg2.connect(db_url)
    except psycopg2.OperationalError as direct_error:
        pooler_url = _supabase_pooler_url(db_url)
        if not pooler_url:
            raise

        print("Conexion directa fallida; intentando pooler de Supabase...")
        try:
            return psycopg2.connect(pooler_url)
        except psycopg2.OperationalError:
            raise direct_error

def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL no encontrada.")
        return

    conn = _connect(db_url)
    try:
        conn.autocommit = True
        with conn.cursor() as cur:
            # 1. Mostrar extensiones
            cur.execute("SELECT extname, extversion FROM pg_extension;")
            exts = cur.fetchall()
            print("=== Extensiones instaladas ===")
            for ext in exts:
                print(f"- {ext[0]} (v{ext[1]})")
            
            # 2. Mostrar search_path
            cur.execute("SHOW search_path;")
            sp = cur.fetchone()
            print(f"\n=== search_path ===\n{sp[0]}")
            
            # 3. Buscar dónde está pgp_sym_decrypt
            cur.execute("""
                SELECT n.nspname as schema_name, p.proname as function_name
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE p.proname = 'pgp_sym_decrypt';
            """)
            funcs = cur.fetchall()
            if funcs:
                print("\n=== Ubicacion de pgp_sym_decrypt ===")
                for f in funcs:
                    print(f"- Esquema: {f[0]}, Funcion: {f[1]}")
            else:
                print("\n=== pgp_sym_decrypt NO encontrada en ninguna parte ===")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
