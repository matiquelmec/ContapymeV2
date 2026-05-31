import os
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

from apply_migration_19 import _connect


ROOT = Path(__file__).resolve().parents[1]


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

    print(f"Aplicando migracion: {migration.relative_to(ROOT)}")
    sql = migration.read_text(encoding="utf-8")

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
