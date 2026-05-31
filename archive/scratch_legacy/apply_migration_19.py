import os
from pathlib import Path
from urllib.parse import quote, unquote, urlparse

import psycopg2
from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase" / "migrations" / "19_migration_treasury_module.sql"


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
    load_dotenv(ROOT / ".env")
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL no esta configurada en .env")

    print("Aplicando migracion 19: modulo de tesoreria...")
    sql = MIGRATION.read_text(encoding="utf-8")

    conn = _connect(db_url)
    try:
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(sql)
            cur.execute("NOTIFY pgrst, 'reload schema';")
        print("Migracion 19 aplicada correctamente.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
