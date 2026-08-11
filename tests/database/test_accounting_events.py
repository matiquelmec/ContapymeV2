import pytest
from core.accounting_events import get_or_create_accounting_event, reverse_accounting_event
from api.routers.accounting import get_supabase

# Esta prueba correrá contra la base de datos real configurada
def test_accounting_events_lifecycle():
    db = get_supabase()
    
    # 1. Usar una organización de prueba
    org_res = db.table("organizations").select("id").limit(1).execute()
    assert org_res.data, "Debe existir al menos una organización en la DB para correr la prueba."
    org_id = org_res.data[0]["id"]
    
    event_type = "TEST_EVENT"
    source_id = "test-12345"
    
    # 2. Asegurarse de que no haya un evento activo previo
    db.table("accounting_events") \
        .delete() \
        .eq("organization_id", org_id) \
        .eq("event_type", event_type) \
        .eq("source_id", source_id) \
        .execute()
        
    # 3. Crear el evento
    event_id = get_or_create_accounting_event(db, org_id, event_type, source_id, notes="Evento de prueba unitaria")
    assert event_id is not None
    
    # 4. Verificar unicidad (el segundo llamado debe retornar el mismo ID)
    event_id_2 = get_or_create_accounting_event(db, org_id, event_type, source_id)
    assert event_id == event_id_2
    
    # 5. Crear un asiento ficticio asociado al evento
    # Para crear el asiento necesitamos cuentas reales. Obtenemos dos cuentas reales.
    coa_res = db.table("chart_of_accounts").select("id").eq("organization_id", org_id).eq("acepta_movimiento", True).limit(2).execute()
    assert len(coa_res.data) >= 2, "Se necesitan al menos 2 cuentas contables para crear el asiento de prueba"
    
    acc_debe = coa_res.data[0]["id"]
    acc_haber = coa_res.data[1]["id"]
    
    lines = [
        {"account_id": acc_debe, "tipo": "debe", "monto": 15000},
        {"account_id": acc_haber, "tipo": "haber", "monto": 15000}
    ]
    
    rpc_res = db.rpc("create_journal_entry_with_lines", {
        "p_organization_id": org_id,
        "p_fecha": "2026-05-28",
        "p_glosa": "Asiento de Prueba Unitario para Eventos",
        "p_lines": lines
    }).execute()
    
    entry_id = rpc_res.data
    assert entry_id is not None
    
    # Vincular al evento
    db.table("journal_entries").update({"event_id": event_id}).eq("id", entry_id).execute()
    
    # 6. Revertir el evento
    rev_res = reverse_accounting_event(db, event_id, notes="Reversión de prueba")
    assert rev_res["success"] is True
    assert len(rev_res["reversal_entries_created"]) == 1
    
    # 7. Verificar que el estado del evento original ahora sea 'reversed' y tenga reversed_by_event_id
    event_check = db.table("accounting_events").select("*").eq("id", event_id).execute()
    assert event_check.data[0]["status"] == "reversed"
    assert event_check.data[0]["reversed_by_event_id"] is not None
    
    reversal_event_id = event_check.data[0]["reversed_by_event_id"]
    
    # Verificar que el evento de reversión tenga status 'reversed'
    rev_event_check = db.table("accounting_events").select("*").eq("id", reversal_event_id).execute()
    assert rev_event_check.data[0]["status"] == "reversed"
    assert rev_event_check.data[0]["event_type"] == event_type
    
    # Verificar que el contrasiento esté asociado al evento de reversión
    reversal_entry_id = rev_res["reversal_entries_created"][0]
    entry_check = db.table("journal_entries").select("event_id").eq("id", reversal_entry_id).execute()
    assert entry_check.data[0]["event_id"] == reversal_event_id
    
    # 8. Limpiar datos de la prueba
    # Borrar líneas del contrasiento
    db.table("journal_entry_lines").delete().eq("entry_id", reversal_entry_id).execute()
    db.table("journal_entries").delete().eq("id", reversal_entry_id).execute()
    
    # Borrar líneas del asiento original
    db.table("journal_entry_lines").delete().eq("entry_id", entry_id).execute()
    db.table("journal_entries").delete().eq("id", entry_id).execute()
    
    # Borrar eventos
    db.table("accounting_events").delete().eq("id", event_id).execute()
    db.table("accounting_events").delete().eq("id", reversal_event_id).execute()
