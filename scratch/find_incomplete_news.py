import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'engine'))

try:
    from core.database import get_supabase
    db = get_supabase()
    
    res = db.table('regional_news').select('id, title, category, content, summary').execute()
    
    incomplete_count = 0
    print("=== NOTICIAS INCOMPLETAS O TRUNCADAS ===")
    for item in res.data:
        title = item['title']
        content = item['content'] or ""
        summary = item['summary'] or ""
        
        # Criterios de truncamiento
        is_truncated = (
            content.endswith("...") or 
            content.endswith("…") or 
            summary.endswith("...") or 
            summary.endswith("…") or 
            len(content) < 300
        )
        
        if is_truncated:
            incomplete_count += 1
            print(f"ID: {item['id']}")
            print(f"Título: {title}")
            print(f"Categoría: {item['category']}")
            print(f"Content (Largo {len(content)}): {content[-100:] if len(content) > 100 else content}")
            print(f"Summary (Largo {len(summary)}): {summary[-100:] if len(summary) > 100 else summary}")
            print("-" * 60)
            
    print(f"Total incompletas detectadas: {incomplete_count}")
except Exception as e:
    print(f"Error: {e}")
