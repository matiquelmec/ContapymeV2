import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

from apply_sql_migration import _connect


ROOT = Path(__file__).resolve().parents[1]


EXPECTED = {
    "employees": [
        "centro_costo",
        "jornada_parcial",
        "tiene_semana_corrida",
        "extranjero",
        "fun_isapre",
        "credito_ccaf",
        "banco_transferencia",
        "tipo_cuenta",
        "cuenta_transferencia",
        "previred_movement_code",
        "tramo_asignacion",
        "es_zona_extrema",
        "zona_extrema",
    ],
    "organization_payroll_settings": [
        "tasa_mutual",
        "dias_vacaciones_anuales",
        "es_zona_extrema",
        "zona_extrema",
        "mutual_code",
        "caja_compensacion_code",
    ],
    "liquidations": [
        "credito_ccaf",
        "calculation_snapshot",
    ],
}


def main():
    load_dotenv(ROOT / ".env")
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL no esta configurada en .env")

    conn = _connect(db_url)
    try:
        with conn.cursor() as cur:
            for table, columns in EXPECTED.items():
                cur.execute(
                    """
                    select column_name
                    from information_schema.columns
                    where table_schema = 'public'
                      and table_name = %s
                      and column_name = any(%s)
                    order by column_name;
                    """,
                    (table, columns),
                )
                found = {row[0] for row in cur.fetchall()}
                missing = sorted(set(columns) - found)
                if missing:
                    raise RuntimeError(f"{table}: faltan columnas {missing}")
                print(f"{table}: OK ({len(found)} columnas verificadas)")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
