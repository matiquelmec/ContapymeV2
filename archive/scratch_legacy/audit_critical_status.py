import os
from pathlib import Path

from dotenv import load_dotenv

from apply_migration_19 import _connect


ROOT = Path(__file__).resolve().parents[1]


def has_constraint(cur, table_name: str, constraint_name: str) -> bool:
    cur.execute(
        """
        select 1
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where n.nspname='public' and t.relname=%s and c.conname=%s
        limit 1
        """,
        (table_name, constraint_name),
    )
    return cur.fetchone() is not None


def has_index(cur, index_name: str) -> bool:
    cur.execute(
        """
        select 1
        from pg_indexes
        where schemaname='public' and indexname=%s
        limit 1
        """,
        (index_name,),
    )
    return cur.fetchone() is not None


def has_trigger(cur, table_name: str, trigger_name: str) -> bool:
    cur.execute(
        """
        select 1
        from information_schema.triggers
        where event_object_schema='public'
          and event_object_table=%s
          and trigger_name=%s
        limit 1
        """,
        (table_name, trigger_name),
    )
    return cur.fetchone() is not None


def main():
    load_dotenv(ROOT / ".env")
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL no esta configurada en .env")

    conn = _connect(db_url)
    try:
        with conn.cursor() as cur:
            checks = [
                ("constraint", "dte_issued", "dte_issued_company_tipo_folio_unique"),
                ("constraint", "sales_records", "sales_records_org_tipo_folio_unique"),
                ("constraint", "purchase_records", "purchase_records_org_tipo_folio_unique"),
                ("index", "", "idx_accounting_periods_org_ano_mes"),
                ("trigger", "journal_entry_lines", "trg_check_journal_entry_balance"),
                ("trigger", "vacation_requests", "trg_vacation_approved_overlap"),
                ("index", "", "idx_liquidations_employee_periodo_unique"),
                ("index", "", "idx_journal_entries_org_fecha"),
                ("index", "", "idx_jel_org_account"),
                ("index", "", "idx_dte_issued_org_fecha"),
            ]

            for kind, table, name in checks:
                if kind == "constraint":
                    ok = has_constraint(cur, table, name)
                elif kind == "trigger":
                    ok = has_trigger(cur, table, name)
                else:
                    ok = has_index(cur, name)
                print(f"{kind.upper()}::{name}={'OK' if ok else 'MISSING'}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
