import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

from apply_migration_19 import _connect


ROOT = Path(__file__).resolve().parents[1]


def run():
    load_dotenv(ROOT / ".env")
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL no esta configurada en .env")

    conn = _connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                select count(*)
                from (
                  select je.id
                  from public.journal_entries je
                  join public.journal_entry_lines jel on jel.entry_id = je.id
                  group by je.id
                  having coalesce(sum(case when jel.tipo='debe' then jel.monto else 0 end),0)
                       <> coalesce(sum(case when jel.tipo='haber' then jel.monto else 0 end),0)
                ) t
                """
            )
            unbalanced = cur.fetchone()[0]

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

            print(f"UNBALANCED_ENTRIES={unbalanced}")
            print(f"OVER_APPLIED_DOCS={over_docs}")
            print(f"OVER_APPLIED_PAYMENTS={over_payments}")
    finally:
        conn.close()


if __name__ == "__main__":
    run()
