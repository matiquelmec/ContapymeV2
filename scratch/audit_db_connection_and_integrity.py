import os
from pathlib import Path

from dotenv import load_dotenv

from apply_migration_19 import _connect


ROOT = Path(__file__).resolve().parents[1]


CRITICAL_TABLES = [
    "organizations",
    "chart_of_accounts",
    "journal_entries",
    "journal_entry_lines",
    "accounting_periods",
    "treasury_payments",
    "treasury_payment_documents",
    "vacation_requests",
    "vacation_ledger",
    "dte_issued",
]


CRITICAL_FKS = [
    ("journal_entry_lines", "journal_entry_lines_entry_id_fkey"),
    ("journal_entry_lines", "journal_entry_lines_account_id_fkey"),
    ("journal_entries", "journal_entries_organization_id_fkey"),
    ("treasury_payment_documents", "treasury_payment_documents_payment_id_fkey"),
    ("treasury_payments", "treasury_payments_payment_method_id_fkey"),
    ("vacation_ledger", "vacation_ledger_employee_id_fkey"),
]


def main():
    load_dotenv(ROOT / ".env")
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL no esta configurada en .env")

    conn = _connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("select current_database(), current_user, now()")
            db_name, db_user, db_now = cur.fetchone()
            print(f"CONNECTED=OK db={db_name} user={db_user} now={db_now}")

            # Tables existence
            cur.execute(
                """
                select table_name
                from information_schema.tables
                where table_schema='public'
                """
            )
            existing_tables = {row[0] for row in cur.fetchall()}
            missing_tables = [t for t in CRITICAL_TABLES if t not in existing_tables]
            print(f"CRITICAL_TABLES_MISSING={len(missing_tables)}")
            for t in missing_tables:
                print(f"MISSING_TABLE={t}")

            # FK existence
            cur.execute(
                """
                select c.relname as table_name, con.conname as constraint_name
                from pg_constraint con
                join pg_class c on c.oid = con.conrelid
                join pg_namespace n on n.oid = c.relnamespace
                where n.nspname='public' and con.contype='f'
                """
            )
            existing_fks = {(row[0], row[1]) for row in cur.fetchall()}
            missing_fks = [fk for fk in CRITICAL_FKS if fk not in existing_fks]
            print(f"CRITICAL_FKS_MISSING={len(missing_fks)}")
            for table_name, fk_name in missing_fks:
                print(f"MISSING_FK={table_name}.{fk_name}")

            # Integrity quick checks
            cur.execute(
                """
                select count(*)
                from public.journal_entry_lines jel
                left join public.journal_entries je on je.id = jel.entry_id
                where je.id is null
                """
            )
            orphan_journal_lines = cur.fetchone()[0]
            print(f"ORPHAN_JOURNAL_LINES={orphan_journal_lines}")

            cur.execute(
                """
                select count(*)
                from public.treasury_payment_documents tpd
                left join public.treasury_payments tp on tp.id = tpd.payment_id
                where tp.id is null
                """
            )
            orphan_payment_docs = cur.fetchone()[0]
            print(f"ORPHAN_TREASURY_PAYMENT_DOCS={orphan_payment_docs}")

            cur.execute(
                """
                with sums as (
                  select
                    je.id,
                    coalesce(sum(case when jel.tipo='debe' then jel.monto else 0 end),0) as debe,
                    coalesce(sum(case when jel.tipo='haber' then jel.monto else 0 end),0) as haber
                  from public.journal_entries je
                  join public.journal_entry_lines jel on jel.entry_id = je.id
                  group by je.id
                )
                select count(*) from sums where debe <> haber
                """
            )
            unbalanced_entries = cur.fetchone()[0]
            print(f"UNBALANCED_ENTRIES={unbalanced_entries}")

            cur.execute(
                """
                with applied as (
                  select organization_id, document_type, document_id, sum(monto_aplicado)::bigint as total_aplicado
                  from public.treasury_payment_documents
                  group by organization_id, document_type, document_id
                ), doc_totals as (
                  select organization_id, 'purchase_record'::text as document_type, id as document_id, monto_total
                  from public.purchase_records
                  union all
                  select organization_id, 'sales_record'::text, id, monto_total
                  from public.sales_records
                  union all
                  select organization_id, 'dte_issued'::text, id, monto_total
                  from public.dte_issued
                )
                select count(*)
                from applied a
                join doc_totals d
                  on d.organization_id = a.organization_id
                 and d.document_type = a.document_type
                 and d.document_id = a.document_id
                where a.total_aplicado > d.monto_total
                """
            )
            over_docs = cur.fetchone()[0]
            print(f"OVER_APPLIED_DOCS={over_docs}")

            cur.execute(
                """
                with payment_applied as (
                  select payment_id, sum(monto_aplicado)::bigint as total_aplicado
                  from public.treasury_payment_documents
                  group by payment_id
                )
                select count(*)
                from payment_applied pa
                join public.treasury_payments tp on tp.id = pa.payment_id
                where pa.total_aplicado > tp.monto
                """
            )
            over_payments = cur.fetchone()[0]
            print(f"OVER_APPLIED_PAYMENTS={over_payments}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
