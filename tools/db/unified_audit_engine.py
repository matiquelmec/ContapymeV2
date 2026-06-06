#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
💎 CONTAPYMEPUQ — MOTOR DE AUDITORÍA UNIFICADO Y ROBUSTO (v9.0)
============================================================
Este script realiza un diagnóstico exhaustivo de la base de datos Supabase
de forma eficiente, cubriendo:
1. Conectividad e integridad física de tablas y llaves foráneas.
2. Estado de blindaje multi-tenant mediante Row Level Security (RLS).
3. Consistencia contable y financiera (asientos descuadrados, huérfanos).
4. Verificación criptográfica del Ledger SHA-256 (inmutabilidad de DTEs).
5. Estado y vigencia de triggers de inmutabilidad.
"""

import os
import sys
import hashlib
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]

# Definición de configuraciones a auditar
CRITICAL_TABLES = [
    "organizations",
    "dte_companies",
    "dte_issued",
    "certified_reports",
    "chart_of_accounts",
    "journal_entries",
    "journal_entry_lines",
    "accounting_periods",
    "treasury_payments",
    "treasury_payment_documents",
    "organization_members",
]

CRITICAL_FKS = [
    ("journal_entry_lines", "journal_entry_lines_entry_id_fkey"),
    ("journal_entry_lines", "journal_entry_lines_account_id_fkey"),
    ("journal_entries", "journal_entries_organization_id_fkey"),
    ("treasury_payment_documents", "treasury_payment_documents_payment_id_fkey"),
    ("treasury_payments", "treasury_payments_payment_method_id_fkey"),
    ("certified_reports", "certified_reports_organization_id_fkey"),
]

def _connect(db_url: str):
    import psycopg2
    return psycopg2.connect(db_url)

def calculate_dte_hash(row) -> str:
    # row: (organization_id, company_id, tipo_dte, folio, monto_total, receptor_rut, previous_hash)
    fields = [str(val) for val in row]
    data_string = "|".join(fields)
    return hashlib.sha256(data_string.encode('utf-8')).hexdigest()

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass
    if hasattr(sys.stderr, 'reconfigure'):
        try:
            sys.stderr.reconfigure(encoding='utf-8')
        except Exception:
            pass

    load_dotenv(ROOT / ".env")
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ ERROR: DATABASE_URL no está configurada en el archivo .env")
        sys.exit(1)

    print("======================================================================")
    print("💎 INICIANDO AUDITORÍA PROFESIONAL DE INTEGRIDAD Y ROBUSTEZ CONTAPYMEPUQ")
    print("======================================================================")

    conn = None
    try:
        conn = _connect(db_url)
        cur = conn.cursor()

        # ─── 1. PRUEBA DE CONEXIÓN FISICA ───────────────────────────────────
        cur.execute("SELECT current_database(), current_user, version()")
        db_name, db_user, db_version = cur.fetchone()
        print(f"✅ CONEXIÓN ESTABLECIDA:")
        print(f"   - Base de Datos: {db_name}")
        print(f"   - Usuario:       {db_user}")
        print(f"   - Versión PG:    {db_version[:60]}...")
        print("----------------------------------------------------------------------")

        # ─── 2. INTEGRIDAD FISICA (TABLAS Y RELACIONES) ──────────────────────
        print("🔍 AUDITANDO INTEGRIDAD FISICA DEL ESQUEMA MAESTRO...")
        cur.execute(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema='public'
            """
        )
        existing_tables = {row[0] for row in cur.fetchall()}
        missing_tables = [t for t in CRITICAL_TABLES if t not in existing_tables]
        
        if missing_tables:
            print(f"   ❌ ALERTA: Faltan {len(missing_tables)} tablas críticas:")
            for t in missing_tables:
                print(f"      - {t}")
        else:
            print("   ✅ Todas las tablas críticas están presentes en el esquema.")

        # Llaves foráneas
        cur.execute(
            """
            SELECT c.relname as table_name, con.conname as constraint_name
            FROM pg_constraint con
            JOIN pg_class c ON c.oid = con.conrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname='public' AND con.contype='f'
            """
        )
        existing_fks = {(row[0], row[1]) for row in cur.fetchall()}
        missing_fks = [fk for fk in CRITICAL_FKS if fk not in existing_fks]

        if missing_fks:
            print(f"   ❌ ALERTA: Faltan {len(missing_fks)} llaves foráneas (FK) críticas:")
            for t, fk in missing_fks:
                print(f"      - {t}.{fk}")
        else:
            print("   ✅ La integridad referencial (FKs) está 100% configurada.")
        print("----------------------------------------------------------------------")

        # ─── 3. SEGURIDAD MULTI-TENANT (RLS) ────────────────────────────────
        print("🔒 AUDITANDO POLÍTICAS DE AISLAMIENTO MULTI-TENANT (RLS)...")
        # Verificar qué tablas críticas tienen RLS activado
        cur.execute(
            """
            SELECT tablename, rowsecurity
            FROM pg_tables
            WHERE schemaname = 'public'
            """
        )
        rls_status = {row[0]: row[1] for row in cur.fetchall()}
        
        unsafe_tables = []
        for t in CRITICAL_TABLES:
            is_active = rls_status.get(t, False)
            if not is_active:
                unsafe_tables.append(t)
                
        if unsafe_tables:
            print(f"   ⚠️ ALERTA DE SEGURIDAD: Hay {len(unsafe_tables)} tablas críticas sin RLS:")
            for t in unsafe_tables:
                print(f"      - {t} (Vulnerable a fugas de tenant)")
        else:
            print("   ✅ Row Level Security (RLS) activo y blindando todas las tablas críticas.")
        print("----------------------------------------------------------------------")

        # ─── 4. CONSISTENCIA CONTABLE Y FINANCIERA ──────────────────────────
        print("📊 AUDITANDO COHERENCIA DE SALDOS Y TRANSACCIONES...")
        
        # Asientos contables descuadrados
        cur.execute(
            """
            WITH sums AS (
              SELECT
                je.id,
                coalesce(sum(case when jel.tipo='debe' then jel.monto else 0 end),0) as debe,
                coalesce(sum(case when jel.tipo='haber' then jel.monto else 0 end),0) as haber
              FROM public.journal_entries je
              JOIN public.journal_entry_lines jel ON jel.entry_id = je.id
              GROUP BY je.id
            )
            SELECT count(*) FROM sums WHERE debe <> haber
            """
        )
        unbalanced = cur.fetchone()[0]
        
        # Registros huérfanos de líneas de diario
        cur.execute(
            """
            SELECT count(*)
            FROM public.journal_entry_lines jel
            LEFT JOIN public.journal_entries je ON je.id = jel.entry_id
            WHERE je.id IS NULL
            """
        )
        orphan_lines = cur.fetchone()[0]

        # Pagos sobre-aplicados
        cur.execute(
            """
            WITH applied AS (
              SELECT organization_id, document_type, document_id, sum(monto_aplicado)::bigint as total_aplicado
              FROM public.treasury_payment_documents
              GROUP BY organization_id, document_type, document_id
            ), doc_totals AS (
              SELECT organization_id, 'purchase_record'::text as document_type, id as document_id, monto_total
              FROM public.purchase_records
              UNION ALL
              SELECT organization_id, 'sales_record'::text, id, monto_total
              FROM public.sales_records
              UNION ALL
              SELECT organization_id, 'dte_issued'::text, id, monto_total
              FROM public.dte_issued
            )
            SELECT count(*)
            FROM applied a
            JOIN doc_totals d
              ON d.organization_id = a.organization_id
             AND d.document_type = a.document_type
             AND d.document_id = a.document_id
            WHERE a.total_aplicado > d.monto_total
            """
        )
        over_applied = cur.fetchone()[0]

        if unbalanced > 0 or orphan_lines > 0 or over_applied > 0:
            print("   ⚠️ INCONSISTENCIAS FINANCIERAS ENCONTRADAS:")
            print(f"      - Asientos descuadrados:   {unbalanced}")
            print(f"      - Líneas de diario huérfanas: {orphan_lines}")
            print(f"      - Pagos sobre-aplicados:    {over_applied}")
        else:
            print("   ✅ Cuadratura contable y pagos coherentes (0 descuadres).")
        print("----------------------------------------------------------------------")

        # ─── 5. VERIFICACIÓN CRIPTOGRÁFICA DEL LEDGER (DTE) ─────────────────
        print("⛓️ AUDITANDO CADENA DE INTEGRIDAD CRIPTOGRÁFICA (SHA-256)...")
        # Obtenemos todos los DTEs emitidos ordenados por organización, compañía, tipo y folio
        cur.execute(
            """
            SELECT id, organization_id, company_id, tipo_dte, folio, monto_total, receptor_rut, previous_hash, integrity_hash
            FROM public.dte_issued
            ORDER BY organization_id, company_id, tipo_dte, folio ASC
            """
        )
        all_dtes = cur.fetchall()

        if not all_dtes:
            print("   ℹ️ No hay registros en dte_issued para verificar.")
        else:
            # Agrupar por organización, compañía y tipo_dte para reconstruir y validar las cadenas
            chains = {}
            for row in all_dtes:
                key = (row[1], row[2], row[3]) # (org_id, company_id, tipo_dte)
                if key not in chains:
                    chains[key] = []
                chains[key].append(row)

            tampered_count = 0
            chain_breaks = 0
            
            for key, dte_list in chains.items():
                expected_prev = "ORIGIN"
                for row in dte_list:
                    # tuple keys:
                    # 0: id, 1: organization_id, 2: company_id, 3: tipo_dte, 4: folio, 5: monto_total, 6: receptor_rut, 7: previous_hash, 8: integrity_hash
                    # Reconstruir registro para el hash
                    rec = (row[1], row[2], row[3], row[4], row[5], row[6], row[7])
                    calc_hash = calculate_dte_hash(rec)
                    
                    # 1. Verificar integridad del contenido
                    if row[8] != calc_hash:
                        print(f"   ❌ ALTERACIÓN DETECTADA: El hash del DTE Folio {row[4]} no coincide con sus datos.")
                        print(f"      - Hash BD: {row[8]}")
                        print(f"      - Hash Computado: {calc_hash}")
                        tampered_count += 1
                        
                    # 2. Verificar enlace de la cadena
                    if row[7] != expected_prev:
                        print(f"   ❌ RUPTURA DE ENLACE: DTE Folio {row[4]} apunta a un hash anterior incorrecto.")
                        print(f"      - PrevHash BD: {row[7][:16]}...")
                        print(f"      - Esperado:     {expected_prev[:16]}...")
                        chain_breaks += 1
                        
                    expected_prev = row[8]

            if tampered_count == 0 and chain_breaks == 0:
                print(f"   ✅ Ledger Criptográfico verificado. {len(all_dtes)} DTEs validados con 0 alteraciones.")
            else:
                print(f"   ❌ LEDGER CORRUPTO: {tampered_count} alteraciones y {chain_breaks} rupturas detectadas.")
        print("----------------------------------------------------------------------")

        # ─── 6. TRIGGERS DE INMUTABILIDAD ───────────────────────────────────
        print("🛡️ VERIFICANDO TRIGGERS DE INMUTABILIDAD ACTIVO...")
        cur.execute(
            """
            SELECT trigger_name, event_object_table, action_timing
            FROM information_schema.triggers
            WHERE event_object_schema = 'public' 
              AND event_object_table IN ('dte_issued', 'certified_reports')
              AND trigger_name IN ('trg_prevent_dte_alteration', 'trg_prevent_certified_reports_alteration')
            """
        )
        triggers = cur.fetchall()
        
        expected_triggers = {
            'trg_prevent_dte_alteration': 'dte_issued',
            'trg_prevent_certified_reports_alteration': 'certified_reports'
        }
        
        found_triggers = {row[0]: row[1] for row in triggers}
        
        for t_name, table in expected_triggers.items():
            if t_name in found_triggers:
                print(f"   ✅ Trigger de Inmutabilidad '{t_name}' en la tabla '{table}' está ACTIVO.")
            else:
                print(f"   ❌ ERROR: El trigger de inmutabilidad '{t_name}' en la tabla '{table}' NO EXISTE.")
                
        print("======================================================================")
        print("🎉 AUDITORÍA COMPLETA FINALIZADA")
        print("======================================================================")

    except Exception as e:
        print(f"❌ Ocurrió un error inesperado durante el diagnóstico: {e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
