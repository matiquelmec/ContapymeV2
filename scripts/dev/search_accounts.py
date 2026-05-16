import sys, json
sys.path.append('engine')
from core.database import get_supabase

db = get_supabase()
res = db.table("chart_of_accounts").select("*").limit(200).execute()
print(json.dumps([{"code": a["codigo"], "name": a["nombre"]} for a in res.data if "ueld" in a["nombre"] or "emuner" in a["nombre"] or "Impuesto" in a["nombre"] or "Leyes" in a["nombre"] or "AFP" in a["nombre"] or "AFC" in a["nombre"] or "Isapre" in a["nombre"] or "Fonasa" in a["nombre"]]))
