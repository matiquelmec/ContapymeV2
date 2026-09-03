"""
ContaPymePUQ - Script de Migración ETL de Remuneraciones Legadas
Migra empresas, trabajadores, liquidaciones y conceptos desde SistemaRemuneraciones (SQLite)
hacia el centro de datos Supabase PostgreSQL.
"""

import os
import sys
import sqlite3
import re
import uuid
from datetime import datetime

# Configurar stdout en UTF-8 para evitar errores de cp1252 en Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Añadir raíz y engine al sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(ROOT_DIR, "engine"))

from core.database import get_pg_connection

SQLITE_PATH = r"C:\Users\Matías Riquelme\Desktop\Nueva carpeta\SistemaRemuneraciones\database\remuneraciones.db"

def norm_rut(r: str) -> str:
    if not r:
        return ""
    clean = re.sub(r'[^0-9kK]', '', str(r)).upper()
    if len(clean) > 1:
        return f"{clean[:-1]}-{clean[-1]}"
    return clean

def norm_contract_type(ct: str) -> str:
    if not ct:
        return "indefinido"
    c = str(ct).lower().replace(" ", "_").replace("-", "_")
    if "fijo" in c:
        return "plazo_fijo"
    if "obra" in c or "faena" in c:
        return "obra_faena"
    if "honorario" in c:
        return "honorarios"
    return "indefinido"

def norm_liquidation_status(st: str) -> str:
    if not st:
        return "borrador"
    s = str(st).lower().strip()
    if "finaliz" in s:
        return "finalizada"
    if "aprob" in s:
        return "aprobada"
    if "pagad" in s:
        return "pagada"
    if "anul" in s:
        return "anulada"
    if "firm" in s:
        return "firmado"
    return "borrador"

def run_migration():
    print("==========================================================")
    print("INICIANDO MIGRACION: SistemaRemuneraciones -> Supabase")
    print("==========================================================")
    
    if not os.path.exists(SQLITE_PATH):
        raise FileNotFoundError(f"No se encontro la base de datos SQLite en: {SQLITE_PATH}")

    conn_lite = sqlite3.connect(SQLITE_PATH)
    cur_lite = conn_lite.cursor()

    conn_pg = get_pg_connection()
    conn_pg.autocommit = False
    cur_pg = conn_pg.cursor()

    try:
        # ----------------------------------------------------
        # 1. MIGRACIÓN DE ORGANIZACIONES (EMPRESAS)
        # ----------------------------------------------------
        print("\n[1/4] Sincronizando Organizaciones / Empresas...")
        cur_pg.execute("SELECT id, rut_empresa, nombre FROM public.organizations;")
        pg_orgs = {norm_rut(r[1]): r[0] for r in cur_pg.fetchall()}

        cur_lite.execute("SELECT id, rut, razon_social, giro, direccion, comuna, ciudad, region FROM empresas;")
        lite_companies = cur_lite.fetchall()

        org_mapping = {} # lite_empresa_id -> pg_org_uuid
        created_orgs = 0

        for c in lite_companies:
            lid, rut, razon, giro, dir_, com, ciu, reg = c
            nr = norm_rut(rut)
            if nr in pg_orgs:
                org_mapping[lid] = pg_orgs[nr]
            else:
                new_org_id = str(uuid.uuid4())
                cur_pg.execute("""
                    INSERT INTO public.organizations (id, rut_empresa, nombre, giro, direccion, comuna, region, regimen_tributario)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (rut_empresa) DO UPDATE SET nombre = EXCLUDED.nombre
                    RETURNING id;
                """, (
                    new_org_id,
                    nr,
                    razon.strip(),
                    (giro or "Giro Comercial").strip(),
                    (dir_ or "Punta Arenas").strip(),
                    (com or "Punta Arenas").strip(),
                    (reg or "Magallanes y de la Antártica Chilena").strip(),
                    "pro_pyme"
                ))
                actual_id = cur_pg.fetchone()[0]
                org_mapping[lid] = actual_id
                pg_orgs[nr] = actual_id
                created_orgs += 1
                print(f"  + Organizacion creada: {nr} - {razon.strip()}")

        conn_pg.commit()
        print(f"  [OK] Organizaciones listas: {len(lite_companies)} mapeadas ({created_orgs} creadas).")

        # ----------------------------------------------------
        # 2. MIGRACIÓN DE COLABORADORES (TRABAJADORES)
        # ----------------------------------------------------
        print("\n[2/4] Sincronizando Colaboradores / Trabajadores...")
        cur_pg.execute("SELECT id, organization_id, rut FROM public.employees;")
        pg_employees = {(norm_rut(r[2]), r[1]): r[0] for r in cur_pg.fetchall()}

        cur_lite.execute("""
            SELECT id, empresa_id, rut, nombres, apellido_paterno, apellido_materno,
                   fecha_nacimiento, fecha_ingreso, fecha_termino, tipo_contrato,
                   cargo, afp, salud, plan_salud_uf, sueldo_base, email, telefono
            FROM trabajadores;
        """)
        lite_workers = cur_lite.fetchall()

        emp_mapping = {} # lite_trabajador_id -> pg_employee_uuid
        created_workers = 0

        for w in lite_workers:
            wid, eid, rut, nom, app, apm, fnac, fing, fterm, tcont, cargo, afp, salud, psuf, sbase, email, tel = w
            nr = norm_rut(rut)
            target_org_id = org_mapping.get(eid)

            if not target_org_id:
                print(f"  [WARN] Trabajador {nr} tiene empresa_id {eid} no mapeada. Omitiendo.")
                continue

            emp_key = (nr, target_org_id)
            if emp_key in pg_employees:
                emp_mapping[wid] = pg_employees[emp_key]
            else:
                new_emp_id = str(uuid.uuid4())
                contract_type_clean = norm_contract_type(tcont)
                cur_pg.execute("""
                    INSERT INTO public.employees (
                        id, organization_id, rut, nombres, apellido_paterno, apellido_materno,
                        fecha_ingreso, fecha_termino, tipo_contrato, cargo, sueldo_base,
                        afp, prevision_salud, plan_salud_uf, email, phone, birth_date, activo
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id;
                """, (
                    new_emp_id,
                    target_org_id,
                    nr,
                    nom.strip(),
                    app.strip(),
                    (apm or "").strip(),
                    fing or "2024-01-01",
                    fterm,
                    contract_type_clean,
                    (cargo or "Colaborador").strip(),
                    int(sbase or 500000),
                    afp or "MODELO",
                    salud or "FONASA",
                    float(psuf or 0.0),
                    email or "",
                    tel or "",
                    fnac,
                    True if not fterm else False
                ))
                actual_id = cur_pg.fetchone()[0]
                emp_mapping[wid] = actual_id
                pg_employees[emp_key] = actual_id
                created_workers += 1
                print(f"  + Trabajador creado: {nr} - {nom} {app}")

        conn_pg.commit()
        print(f"  [OK] Colaboradores listos: {len(lite_workers)} mapeados ({created_workers} creados).")

        # ----------------------------------------------------
        # 3. MIGRACIÓN DE LIQUIDACIONES HISTÓRICAS
        # ----------------------------------------------------
        print("\n[3/4] Sincronizando Liquidaciones Historicas...")
        cur_pg.execute("SELECT employee_id, to_char(periodo, 'YYYY-MM') FROM public.liquidations;")
        existing_liqs = {(r[0], r[1]) for r in cur_pg.fetchall()}

        cur_lite.execute("""
            SELECT id, trabajador_id, periodo, dias_trabajados, total_haberes_imponibles,
                   total_haberes_no_imponibles, total_haberes, total_descuentos_legales,
                   total_descuentos_otros, total_descuentos, liquido_a_pagar, estado
            FROM liquidaciones;
        """)
        lite_liquidations = cur_lite.fetchall()

        created_liqs = 0
        liq_mapping = {} # lite_liq_id -> pg_liq_uuid

        for l in lite_liquidations:
            lid, wid, periodo_raw, dias, h_imp, h_no_imp, thab, d_leg, d_otr, tdesc, tliq, estado = l
            pg_emp_id = emp_mapping.get(wid)

            if not pg_emp_id:
                continue

            period_str = str(periodo_raw)[:7] # YYYY-MM
            period_date = f"{period_str}-01"

            if (pg_emp_id, period_str) in existing_liqs:
                continue

            # Buscar la organización del empleado
            cur_pg.execute("SELECT organization_id, sueldo_base, rut FROM public.employees WHERE id = %s;", (pg_emp_id,))
            emp_info = cur_pg.fetchone()
            if not emp_info:
                continue
            org_id, sueldo_base, emp_rut = emp_info

            new_liq_id = str(uuid.uuid4())
            clean_rut_suffix = emp_rut.replace("-", "")[-4:]
            folio_code = f"LIQ-{period_str.replace('-', '')}-{clean_rut_suffix}-{lid}"
            status_clean = norm_liquidation_status(estado)

            cur_pg.execute("""
                INSERT INTO public.liquidations (
                    id, organization_id, employee_id, periodo, sueldo_base,
                    total_haberes_brutos, total_descuentos, sueldo_liquido,
                    status, folio_number, dias_trabajados, generated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (
                new_liq_id,
                org_id,
                pg_emp_id,
                period_date,
                int(sueldo_base or 500000),
                int(round(thab or 0)),
                int(round(tdesc or 0)),
                int(round(tliq or 0)),
                status_clean,
                folio_code,
                int(dias or 30),
                datetime.utcnow()
            ))

            actual_liq_id = cur_pg.fetchone()[0]
            liq_mapping[lid] = actual_liq_id
            existing_liqs.add((pg_emp_id, period_str))
            created_liqs += 1

        conn_pg.commit()
        print(f"  [OK] Liquidaciones listas: {created_liqs} nuevas liquidaciones migradas a Supabase.")

        # ----------------------------------------------------
        # 4. MIGRACIÓN DE CONCEPTOS PERSONALIZADOS (HABERES & DESCUENTOS)
        # ----------------------------------------------------
        print("\n[4/4] Sincronizando Haberes y Descuentos Detallados...")
        cur_lite.execute("""
            SELECT lh.liquidacion_id, th.nombre, lh.monto, th.es_imponible
            FROM liquidacion_haberes lh
            JOIN tipos_haberes th ON lh.tipo_haber_id = th.id;
        """)
        lite_haberes = cur_lite.fetchall()

        custom_items_count = 0
        for hab in lite_haberes:
            lite_lid, nom, monto, es_imp = hab
            pg_lid = liq_mapping.get(lite_lid)
            if not pg_lid:
                continue

            cur_pg.execute("SELECT organization_id, employee_id, periodo FROM public.liquidations WHERE id = %s;", (pg_lid,))
            l_row = cur_pg.fetchone()
            if not l_row:
                continue
            o_id, e_id, per = l_row

            cur_pg.execute("""
                INSERT INTO public.payroll_custom_items (
                    organization_id, employee_id, periodo, tipo, nombre, monto, es_imponible
                )
                VALUES (%s, %s, %s, 'haber', %s, %s, %s);
            """, (
                o_id, e_id, per, nom.strip(), int(round(monto or 0)), bool(es_imp)
            ))
            custom_items_count += 1

        conn_pg.commit()
        print(f"  [OK] Conceptos detallados listos: {custom_items_count} items insertados en payroll_custom_items.")

        print("\n==========================================================")
        print("MIGRACION COMPLETADA CON EXITO")
        print("==========================================================")

    except Exception as e:
        conn_pg.rollback()
        print(f"\n[ERROR] DURANTE LA MIGRACION: {e}")
        raise
    finally:
        conn_lite.close()
        conn_pg.close()

if __name__ == "__main__":
    run_migration()
