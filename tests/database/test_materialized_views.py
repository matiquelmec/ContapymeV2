import pytest
from api.routers.accounting import get_supabase

def test_materialized_view_balances():
    db = get_supabase()
    
    # 1. Obtener una organización de prueba
    org_res = db.table("organizations").select("id").limit(1).execute()
    assert org_res.data, "Debe existir al menos una organización en la DB para correr la prueba."
    org_id = org_res.data[0]["id"]
    
    # 2. Obtener cuentas contables
    coa_res = db.table("chart_of_accounts").select("id").eq("organization_id", org_id).eq("acepta_movimiento", True).limit(2).execute()
    assert len(coa_res.data) >= 2, "Se necesitan al menos 2 cuentas contables para las pruebas."
    acc_debe = coa_res.data[0]["id"]
    acc_haber = coa_res.data[1]["id"]
    
    # Limpiar balances de esta cuenta en la vista materializada requiere refrescar después de insertar
    # Pero primero guardemos los saldos actuales en la vista materializada para comparar
    pre_view_debe = 0
    pre_view_haber = 0
    
    view_res = db.table("mv_account_balances") \
        .select("total_debe, total_haber") \
        .eq("organization_id", org_id) \
        .eq("account_id", acc_debe) \
        .execute()
    if view_res.data:
        pre_view_debe = view_res.data[0]["total_debe"]
        pre_view_haber = view_res.data[0]["total_haber"]
        
    # 3. Crear un asiento de prueba
    test_date = "2029-07-20"
    lines = [
        {"account_id": acc_debe, "tipo": "debe", "monto": 80000},
        {"account_id": acc_haber, "tipo": "haber", "monto": 80000}
    ]
    
    rpc_res = db.rpc("create_journal_entry_with_lines", {
        "p_organization_id": org_id,
        "p_fecha": test_date,
        "p_glosa": "Asiento de Prueba para Vista Materializada",
        "p_lines": lines
    }).execute()
    
    entry_id = rpc_res.data
    assert entry_id is not None
    
    try:
        # Refrescar la vista materializada llamando a la RPC
        db.rpc("refresh_accounting_balances", {}).execute()
        
        # Consultar de nuevo y comprobar que se ha actualizado en 80000
        post_view_res = db.table("mv_account_balances") \
            .select("total_debe, total_haber") \
            .eq("organization_id", org_id) \
            .eq("account_id", acc_debe) \
            .execute()
            
        assert post_view_res.data
        assert post_view_res.data[0]["total_debe"] == pre_view_debe + 80000
        
    finally:
        # Limpiar
        db.table("journal_entry_lines").delete().eq("entry_id", entry_id).execute()
        db.table("journal_entries").delete().eq("id", entry_id).execute()
        # Refrescar para dejar la DB limpia
        db.rpc("refresh_accounting_balances", {}).execute()
