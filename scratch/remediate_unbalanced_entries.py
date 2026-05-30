import argparse
import os
from pathlib import Path

from dotenv import load_dotenv

from apply_migration_19 import _connect


ROOT = Path(__file__).resolve().parents[1]


def get_bridge_account(cur, organization_id: str) -> str:
    cur.execute(
        """
        select id
        from public.chart_of_accounts
        where organization_id = %s
          and (
            codigo in ('999999', '99999')
            or lower(nombre) like '%%puente cuadratura%%'
          )
        order by codigo desc
        limit 1
        """,
        (organization_id,),
    )
    row = cur.fetchone()
    if row:
        return row[0]

    cur.execute(
        """
        insert into public.chart_of_accounts (
          organization_id,
          codigo,
          nombre,
          descripcion,
          nivel,
          tipo,
          naturaleza,
          acepta_movimiento,
          activo
        )
        values (
          %s,
          '999999',
          'Cuenta Puente Cuadratura',
          'Auto-generada para remediacion de asientos descuadrados',
          5,
          'patrimonio',
          'acreedora',
          true,
          true
        )
        returning id
        """,
        (organization_id,),
    )
    return cur.fetchone()[0]


def fetch_unbalanced_entries(cur):
    cur.execute(
        """
        with sums as (
          select
            je.id as entry_id,
            je.organization_id,
            je.fecha,
            coalesce(sum(case when jel.tipo='debe' then jel.monto else 0 end),0) as total_debe,
            coalesce(sum(case when jel.tipo='haber' then jel.monto else 0 end),0) as total_haber
          from public.journal_entries je
          join public.journal_entry_lines jel on jel.entry_id = je.id
          group by je.id, je.organization_id, je.fecha
        )
        select
          s.entry_id,
          s.organization_id,
          s.fecha,
          s.total_debe,
          s.total_haber,
          (s.total_debe - s.total_haber) as diff,
          ap.status as period_status
        from sums s
        left join public.accounting_periods ap
          on ap.organization_id = s.organization_id
         and ap.ano = extract(year from s.fecha)::int
         and ap.mes = extract(month from s.fecha)::int
        where s.total_debe <> s.total_haber
        order by s.organization_id, s.fecha, s.entry_id
        """
    )
    return cur.fetchall()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Aplica correcciones")
    args = parser.parse_args()

    load_dotenv(ROOT / ".env")
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL no esta configurada en .env")

    conn = _connect(db_url)
    conn.autocommit = False

    fixed = 0
    skipped_closed = 0
    skipped_error = 0
    total = 0

    try:
        with conn.cursor() as cur:
            rows = fetch_unbalanced_entries(cur)
        total = len(rows)

        print(f"UNBALANCED_FOUND={total}")
        if total == 0:
            return

        for entry_id, org_id, fecha, debe, haber, diff, period_status in rows:
            if period_status in ("closed", "locked"):
                skipped_closed += 1
                print(
                    f"SKIP entry={entry_id} org={org_id} fecha={fecha} diff={diff} period={period_status}"
                )
                continue

            try:
                with conn.cursor() as cur:
                    bridge_account_id = get_bridge_account(cur, org_id)

                    if diff > 0:
                        line_tipo = "haber"
                        monto = diff
                    else:
                        line_tipo = "debe"
                        monto = -diff

                    if args.apply:
                        cur.execute(
                            """
                            insert into public.journal_entry_lines (
                              entry_id, tipo, monto, account_id, organization_id, is_reconciled
                            )
                            values (%s, %s, %s, %s, %s, false)
                            """,
                            (entry_id, line_tipo, int(monto), bridge_account_id, org_id),
                        )
                        conn.commit()
                        fixed += 1
                        print(
                            f"FIXED entry={entry_id} org={org_id} fecha={fecha} diff={diff} with_tipo={line_tipo} monto={int(monto)}"
                        )
                    else:
                        conn.rollback()
                        print(
                            f"DRYRUN entry={entry_id} org={org_id} fecha={fecha} diff={diff} with_tipo={line_tipo} monto={int(monto)}"
                        )
            except Exception as e:
                conn.rollback()
                skipped_error += 1
                print(f"ERROR entry={entry_id} org={org_id} diff={diff} err={e}")

        print(f"FIXED_TOTAL={fixed}")
        print(f"SKIPPED_CLOSED_OR_LOCKED={skipped_closed}")
        print(f"SKIPPED_ERRORS={skipped_error}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
