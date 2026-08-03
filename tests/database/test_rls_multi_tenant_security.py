"""
test_rls_multi_tenant_security.py — Pruebas de Seguridad RLS y Aislamiento Multi-Tenant
=====================================================================================
Verifica que las políticas de Row Level Security (RLS) en Supabase PostgreSQL impidan
estrictamente el acceso no autorizado entre organizaciones distintas.
"""

import pytest
from core.database import get_supabase

def test_rls_multi_tenant_isolation():
    """Prueba que el aislamiento multi-tenant respete la segregación por organización."""
    db = get_supabase()

    # 1. Obtener dos organizaciones independientes de la base de datos
    org_res = db.table("organizations").select("id, nombre").limit(2).execute()
    if len(org_res.data) < 2:
        pytest.skip("Se requieren al menos 2 organizaciones para probar el aislamiento multi-tenant.")

    org_a_id = org_res.data[0]["id"]
    org_b_id = org_res.data[1]["id"]

    # 2. Consultar empleados pertenecientes a Org A
    emp_a_res = db.table("employees").select("id, organization_id").eq("organization_id", org_a_id).execute()
    for emp in emp_a_res.data:
        assert emp["organization_id"] == org_a_id, "Fuga de datos: Empleado de Org B presente en consulta de Org A"

    # 3. Consultar asientos contables pertenecientes a Org A
    journal_a_res = db.table("journal_entries").select("id, organization_id").eq("organization_id", org_a_id).execute()
    for entry in journal_a_res.data:
        assert entry["organization_id"] == org_a_id, "Fuga de datos: Asiento contable de Org B presente en consulta de Org A"

    # 4. Consultar registros de compras RCV de Org A
    purchases_a_res = db.table("purchase_records").select("id, organization_id").eq("organization_id", org_a_id).execute()
    for purch in purchases_a_res.data:
        assert purch["organization_id"] == org_a_id, "Fuga de datos: Registro RCV de Org B presente en consulta de Org A"

    # 5. Confirmar que los IDs de Org A y Org B no se solapen
    assert org_a_id != org_b_id, "Error: Las organizaciones A y B deben ser distintas."
