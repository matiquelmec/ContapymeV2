import os
import sys

sys.path.append(r"c:\Users\Matías Riquelme\Desktop\Contapymepuq\engine")

from core.database import get_supabase

def cleanup():
    db = get_supabase()

    # Find all journal entries that match "Centralización Remuneraciones"
    res = db.table("journal_entries").select("id, glosa, organization_id, fecha").ilike("glosa", "Centralización Remuneraciones%").execute()
    entries = res.data or []

    print(f"Total centralizaciones encontradas: {len(entries)}")

    # Group by (organization_id, glosa, fecha)
    from collections import defaultdict

    grouped = defaultdict(list)
    for e in entries:
        # Algunos tienen "Centralización Remuneraciones Periodo 2026-03" y otros con "2026-03-01" 
        # Pero vamos a agrupar por el prefijo mes YYYY-MM
        # El user dice que vio 15 veces el monto
        key = (e["organization_id"], e["glosa"][:39])  # Agrupa por nombre base
        grouped[key].append(e["id"])

    deleted_count = 0
    for key, ids in grouped.items():
        if len(ids) > 1:
            ids_to_delete = ids[:-1]  # Mantiene solo 1
            print(f"Borrando {len(ids_to_delete)} duplicados de {key[1]}")
            for eid in ids_to_delete:
                db.table("journal_entry_lines").delete().eq("entry_id", eid).execute()
                db.table("journal_entries").delete().eq("id", eid).execute()
                deleted_count += 1

    print(f"Total eliminados: {deleted_count}")

if __name__ == "__main__":
    cleanup()
