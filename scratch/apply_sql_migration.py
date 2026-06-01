import os
import sys
from pathlib import Path
from urllib.parse import urlparse, urlunparse

import psycopg2
from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parents[1]


def _pooler_url(db_url: str) -> str | None:
    parsed = urlparse(db_url)
    host_parts = parsed.hostname.split(".") if parsed.hostname else []
    if len(host_parts) < 4 or host_parts[0] != "db" or host_parts[-2:] != ["supabase", "co"]:
        return None

    project_ref = host_parts[1]
    username = parsed.username or "postgres"
    password = parsed.password or ""
    database = parsed.path.lstrip("/") or "postgres"
    netloc = f"{username}.{project_ref}:{password}@aws-1-us-east-2.pooler.supabase.com:6543"
    query = parsed.query or "sslmode=require"
    if "sslmode=" not in query:
        query = f"{query}&sslmode=require" if query else "sslmode=require"
    return urlunparse(("postgresql", netloc, f"/{database}", "", query, ""))


def _connect(db_url: str):
    try:
        return psycopg2.connect(db_url, connect_timeout=10)
    except psycopg2.OperationalError:
        pooler = _pooler_url(db_url)
        if not pooler:
            raise
        return psycopg2.connect(pooler, connect_timeout=10)


def main():
    if len(sys.argv) != 2:
        raise RuntimeError("Uso: python scratch/apply_sql_migration.py supabase/migrations/<archivo>.sql")

    migration = (ROOT / sys.argv[1]).resolve()
    if not migration.is_file() or ROOT not in migration.parents:
        raise RuntimeError(f"Migracion invalida: {migration}")

    load_dotenv(ROOT / ".env")
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL no esta configurada en .env")

    sql = migration.read_text(encoding="utf-8")
    print(f"Aplicando migracion: {migration.relative_to(ROOT)}")

    conn = _connect(db_url)
    try:
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(sql)
            cur.execute("NOTIFY pgrst, 'reload schema';")
        print("Migracion aplicada correctamente.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
