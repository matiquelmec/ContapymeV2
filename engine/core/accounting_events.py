from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

def get_or_create_accounting_event(
    db, 
    organization_id: str, 
    event_type: str, 
    source_id: str, 
    notes: Optional[str] = None
) -> str:
    """
    Obtiene un evento contable activo existente o crea uno nuevo.
    Garantiza idempotencia basándose en el índice único parcial.
    """
    # 1. Intentar buscar un evento activo existente
    res = db.table("accounting_events") \
        .select("id") \
        .eq("organization_id", organization_id) \
        .eq("event_type", event_type) \
        .eq("source_id", source_id) \
        .eq("status", "active") \
        .execute()
    
    if res.data:
        return res.data[0]["id"]
    
    # 2. Si no existe, crearlo
    event_data = {
        "organization_id": organization_id,
        "event_type": event_type,
        "source_id": source_id,
        "status": "active",
        "notes": notes
    }
    insert_res = db.table("accounting_events").insert(event_data).execute()
    if not insert_res.data:
        raise RuntimeError(f"No se pudo crear el evento contable {event_type} - {source_id}")
    
    return insert_res.data[0]["id"]

def reverse_accounting_event(
    db, 
    event_id: str, 
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Revierte un evento contable marcándolo como 'reversed' y
    generando asientos de reversión (contrasientos) para todos los asientos asociados.
    """
    # 1. Obtener el evento
    event_res = db.table("accounting_events").select("*").eq("id", event_id).execute()
    if not event_res.data:
        return {"success": False, "error": f"Evento contable {event_id} no encontrado"}
    
    event = event_res.data[0]
    if event["status"] == "reversed":
        return {"success": True, "message": "El evento ya se encontraba revertido"}
    
    # 2. Buscar asientos asociados
    entries_res = db.table("journal_entries") \
        .select("*, lines:journal_entry_lines(*)") \
        .eq("event_id", event_id) \
        .execute()
    
    reversal_entries_created = []
    
    for entry in (entries_res.data or []):
        lines = entry.get("lines", [])
        if not lines:
            continue
        
        # Invertir las líneas: Debe pasa a Haber y viceversa
        reversal_lines = []
        for line in lines:
            reversal_lines.append({
                "account_id": line["account_id"],
                "tipo": "haber" if line["tipo"] == "debe" else "debe",
                "monto": line["monto"]
            })
            
        # Crear la glosa del contrasiento
        glosa_reversal = f"REVERSIÓN: {entry['glosa']}"
        if notes:
            glosa_reversal += f" ({notes})"
            
        # Llamar al RPC para insertar el asiento de reversión
        rpc_res = db.rpc("create_journal_entry_with_lines", {
            "p_organization_id": event["organization_id"],
            "p_fecha": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "p_glosa": glosa_reversal,
            "p_lines": reversal_lines
        }).execute()
        
        reversal_entry_id = rpc_res.data
        if reversal_entry_id:
            # Asociar también el contrasiento al evento de reversión
            db.table("journal_entries") \
                .update({"event_id": event_id}) \
                .eq("id", reversal_entry_id) \
                .execute()
            reversal_entries_created.append(reversal_entry_id)

    # 3. Actualizar el estado del evento
    db.table("accounting_events") \
        .update({
            "status": "reversed",
            "reversed_at": datetime.now(timezone.utc).isoformat(),
            "notes": f"Revertido. Contrasientos creados: {len(reversal_entries_created)}. " + (notes or "")
        }) \
        .eq("id", event_id) \
        .execute()
        
    return {
        "success": True, 
        "reversal_entries_created": reversal_entries_created,
        "message": f"Evento revertido con éxito. {len(reversal_entries_created)} contrasientos generados."
    }
