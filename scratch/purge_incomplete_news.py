import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'engine'))

try:
    from core.database import get_supabase
    db = get_supabase()
    
    res = db.table('regional_news').select('id, title, content, summary').execute()
    
    deleted_count = 0
    print("=== INICIANDO PURGA DE NOTICIAS TRUNCADAS O INCOMPLETAS ===")
    for item in res.data:
        news_id = item['id']
        title = item['title']
        content = item['content'] or ""
        summary = item['summary'] or ""
        
        # Condición de noticia truncada o de calidad insuficiente
        is_truncated = (
            content.endswith("...") or 
            content.endswith("…") or 
            summary.endswith("...") or 
            summary.endswith("…") or 
            len(content) < 300
        )
        
        if is_truncated:
            print(f"Borrando: '{title}' (Largo contenido: {len(content)})")
            db.table('regional_news').delete().eq('id', news_id).execute()
            deleted_count += 1
            
    print(f"Purga completada. Se eliminaron {deleted_count} noticias incompletas/truncadas de la base de datos.")
except Exception as e:
    print(f"Error al purgar noticias: {e}")
