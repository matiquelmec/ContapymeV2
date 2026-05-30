import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scratch"))
from apply_migration_19 import _connect


def query_one(cur, sql: str) -> int:
    cur.execute(sql)
    return int(cur.fetchone()[0])


def main() -> int:
    load_dotenv(ROOT / ".env")
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL no esta configurada en .env")
        return 2

    failures = []

    conn = _connect(db_url)
    try:
        with conn.cursor() as cur:
            checks = {
                "unbalanced_entries": """
                    select count(*)
                    from (
                      select je.id
                      from public.journal_entries je
                      join public.journal_entry_lines jel on jel.entry_id = je.id
                      group by je.id
                      having coalesce(sum(case when jel.tipo='debe' then jel.monto else 0 end),0)
                           <> coalesce(sum(case when jel.tipo='haber' then jel.monto else 0 end),0)
                    ) t
                """,
                "over_applied_docs": """
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
                """,
                "over_applied_payments": """
                    with payment_applied as (
                      select payment_id, sum(monto_aplicado)::bigint as total_aplicado
                      from public.treasury_payment_documents
                      group by payment_id
                    )
                    select count(*)
                    from payment_applied pa
                    join public.treasury_payments tp on tp.id = pa.payment_id
                    where pa.total_aplicado > tp.monto
                """,
                "orphan_journal_lines": """
                    select count(*)
                    from public.journal_entry_lines jel
                    left join public.journal_entries je on je.id = jel.entry_id
                    where je.id is null
                """,
                "orphan_treasury_docs": """
                    select count(*)
                    from public.treasury_payment_documents tpd
                    left join public.treasury_payments tp on tp.id = tpd.payment_id
                    where tp.id is null
                """,
            }

            for name, sql in checks.items():
                value = query_one(cur, sql)
                print(f"CHECK::{name}={value}")
                if value != 0:
                    failures.append((name, value))

            expected_constraints = [
                ("dte_issued", "dte_issued_company_tipo_folio_unique"),
                ("sales_records", "sales_records_org_tipo_folio_unique"),
                ("purchase_records", "purchase_records_org_tipo_folio_unique"),
            ]
            for table_name, constraint_name in expected_constraints:
                cur.execute(
                    """
                    select count(*)
                    from pg_constraint c
                    join pg_class t on t.oid = c.conrelid
                    join pg_namespace n on n.oid = t.relnamespace
                    where n.nspname='public'
                      and t.relname=%s
                      and c.conname=%s
                    """,
                    (table_name, constraint_name),
                )
                exists = int(cur.fetchone()[0])
                print(f"CHECK::constraint:{constraint_name}={exists}")
                if exists != 1:
                    failures.append((f"constraint:{constraint_name}", exists))

            expected_indexes = [
                "idx_accounting_periods_org_ano_mes",
                "idx_liquidations_employee_periodo_unique",
                "idx_journal_entries_org_fecha",
                "idx_jel_org_account",
                "idx_dte_issued_org_fecha",
            ]
            for index_name in expected_indexes:
                cur.execute(
                    """
                    select count(*)
                    from pg_indexes
                    where schemaname='public' and indexname=%s
                    """,
                    (index_name,),
                )
                exists = int(cur.fetchone()[0])
                print(f"CHECK::index:{index_name}={exists}")
                if exists != 1:
                    failures.append((f"index:{index_name}", exists))
    finally:
        conn.close()

    if failures:
        print("POST_MIGRATION_CHECK=FAILED")
        for name, value in failures:
            print(f"FAIL::{name}={value}")
        return 1

    print("POST_MIGRATION_CHECK=OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
