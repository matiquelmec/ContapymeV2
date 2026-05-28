import pytest
from api.routers.accounting import get_supabase
from postgrest.exceptions import APIError

def test_accounting_periods_integrity():
    db = get_supabase()
    
    # 1. Obtener una organización de prueba
    org_res = db.table("organizations").select("id").limit(1).execute()
    assert org_res.data, "Debe existir al menos una organización en la DB para correr la prueba."
    org_id = org_res.data[0]["id"]
    
    # Definir año y mes de prueba
    test_year = 2029
    test_month = 6
    test_date = f"{test_year}-06-15"
    
    # 2. Asegurarse de limpiar periodos y asientos previos para esta fecha de prueba
    # Primero eliminar líneas asociadas a asientos de esa fecha
    old_entries = db.table("journal_entries") \
        .select("id") \
        .eq("organization_id", org_id) \
        .eq("fecha", test_date) \
        .execute()
    
    for entry in old_entries.data:
        db.table("journal_entry_lines").delete().eq("entry_id", entry["id"]).execute()
        db.table("journal_entries").delete().eq("id", entry["id"]).execute()
        
    # Eliminar periodo de prueba si existe
    db.table("accounting_periods") \
        .delete() \
        .eq("organization_id", org_id) \
        .eq("ano", test_year) \
        .eq("mes", test_month) \
        .execute()
        
    # Obtener cuentas contables para las transacciones
    coa_res = db.table("chart_of_accounts").select("id").eq("organization_id", org_id).limit(2).execute()
    assert len(coa_res.data) >= 2, "Se necesitan al menos 2 cuentas contables para las pruebas."
    acc_debe = coa_res.data[0]["id"]
    acc_haber = coa_res.data[1]["id"]
    
    lines = [
        {"account_id": acc_debe, "tipo": "debe", "monto": 25000},
        {"account_id": acc_haber, "tipo": "haber", "monto": 25000}
    ]
    
    # 3. Crear un asiento cuando el periodo no está registrado (debe considerarse abierto implícitamente)
    rpc_res = db.rpc("create_journal_entry_with_lines", {
        "p_organization_id": org_id,
        "p_fecha": test_date,
        "p_glosa": "Asiento Periodo Abierto Implicito",
        "p_lines": lines
    }).execute()
    
    entry_id = rpc_res.data
    assert entry_id is not None, "Debería permitir crear un asiento cuando el periodo no está configurado."
    
    # 4. Registrar el periodo como 'closed' (cerrado)
    period_res = db.table("accounting_periods").insert({
        "organization_id": org_id,
        "ano": test_year,
        "mes": test_month,
        "status": "closed"
    }).execute()
    assert len(period_res.data) == 1
    
    # 5. Intentar crear un NUEVO asiento en el periodo cerrado (debe fallar)
    with pytest.raises(APIError) as exc_info:
        db.rpc("create_journal_entry_with_lines", {
            "p_organization_id": org_id,
            "p_fecha": test_date,
            "p_glosa": "Asiento en Periodo Cerrado",
            "p_lines": lines
        }).execute()
    assert "no admite modificaciones" in str(exc_info.value)
    
    # 6. Intentar ACTUALIZAR la glosa del asiento existente en el periodo cerrado (debe fallar)
    with pytest.raises(APIError) as exc_info:
        db.table("journal_entries").update({"glosa": "Glosa Modificada Cerrado"}).eq("id", entry_id).execute()
    assert "no admite modificaciones" in str(exc_info.value)
    
    # 7. Intentar ACTUALIZAR una línea del asiento existente en el periodo cerrado (debe fallar)
    # Obtener el id de una línea
    line_res = db.table("journal_entry_lines").select("id").eq("entry_id", entry_id).limit(1).execute()
    line_id = line_res.data[0]["id"]
    
    with pytest.raises(APIError) as exc_info:
        db.table("journal_entry_lines").update({"monto": 99999}).eq("id", line_id).execute()
    assert "no admite modificaciones en sus lineas" in str(exc_info.value)
    
    # 8. Intentar ELIMINAR una línea del asiento existente (debe fallar)
    with pytest.raises(APIError) as exc_info:
        db.table("journal_entry_lines").delete().eq("id", line_id).execute()
    assert "no admite modificaciones en sus lineas" in str(exc_info.value)
    
    # 9. Intentar ELIMINAR el asiento completo (debe fallar)
    with pytest.raises(APIError) as exc_info:
        db.table("journal_entries").delete().eq("id", entry_id).execute()
    assert "no admite modificaciones" in str(exc_info.value)
    
    # 10. Cambiar el estado del periodo a 'open' y validar que se pueden hacer modificaciones
    db.table("accounting_periods") \
        .update({"status": "open"}) \
        .eq("organization_id", org_id) \
        .eq("ano", test_year) \
        .eq("mes", test_month) \
        .execute()
        
    # Ahora la actualización del asiento debe funcionar
    update_res = db.table("journal_entries").update({"glosa": "Glosa Modificada Abierto"}).eq("id", entry_id).execute()
    assert len(update_res.data) == 1
    
    # 11. Limpieza final de la prueba
    db.table("journal_entry_lines").delete().eq("entry_id", entry_id).execute()
    db.table("journal_entries").delete().eq("id", entry_id).execute()
    db.table("accounting_periods") \
        .delete() \
        .eq("organization_id", org_id) \
        .eq("ano", test_year) \
        .eq("mes", test_month) \
        .execute()
