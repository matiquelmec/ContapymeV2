import os
from pathlib import Path

from dotenv import load_dotenv

from apply_migration_19 import _connect


ROOT = Path(__file__).resolve().parents[1]


def main():
    load_dotenv(ROOT / ".env")
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL no esta configurada en .env")

    conn = _connect(db_url)
    try:
        with conn.cursor() as cur:
            checks = [
                (
                    "dte_issued",
                    """
                    select count(*) from (
                      select company_id, tipo_dte, folio
                      from public.dte_issued
                      group by company_id, tipo_dte, folio
                      having count(*) > 1
                    ) d
                    """,
                ),
                (
                    "sales_records",
                    """
                    select count(*) from (
                      select organization_id, tipo_documento, folio, rut_receptor
                      from public.sales_records
                      group by organization_id, tipo_documento, folio, rut_receptor
                      having count(*) > 1
                    ) d
                    """,
                ),
                (
                    "purchase_records",
                    """
                    select count(*) from (
                      select organization_id, tipo_documento, folio, rut_emisor
                      from public.purchase_records
                      group by organization_id, tipo_documento, folio, rut_emisor
                      having count(*) > 1
                    ) d
                    """,
                ),
                (
                    "accounting_periods",
                    """
                    select count(*) from (
                      select organization_id, ano, mes
                      from public.accounting_periods
                      group by organization_id, ano, mes
                      having count(*) > 1
                    ) d
                    """,
                ),
                (
                    "liquidations",
                    """
                    select count(*) from (
                      select organization_id, employee_id, periodo
                      from public.liquidations
                      group by organization_id, employee_id, periodo
                      having count(*) > 1
                    ) d
                    """,
                ),
            ]

            for name, sql in checks:
                cur.execute(sql)
                count = cur.fetchone()[0]
                print(f"DUPES::{name}={count}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
