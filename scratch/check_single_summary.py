import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'engine'))

try:
    from core.database import get_supabase
    db = get_supabase()
    
    # Obtener el summary completo de una de ellas
    res = db.table('regional_news').select('id, title, summary').eq('id', 'f10be878-f7c0-4ea9-8833-0ee966ff06cb').execute()
    if res.data:
        print("SUMMARY COMPLETO:")
        print(repr(res.data[0]['summary']))
    else:
        print("No encontrada")
except Exception as e:
    print(f"Error: {e}")
