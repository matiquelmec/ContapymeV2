import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'engine'))

try:
    from core.database import get_supabase
    db = get_supabase()
    
    res = db.table('regional_news').select('id, title, summary, content').execute()
    
    count = 0
    print("Buscando noticias con posibles caracteres HTML o entidades codificadas:")
    for item in res.data:
        title = item['title']
        summary = item['summary'] or ""
        content = item['content'] or ""
        
        # Detectar patrones sospechosos de HTML o entidades
        indicators = []
        if "<" in summary or ">" in summary or "href" in summary or "target=" in summary:
            indicators.append("summary_HTML")
        if "<" in content or ">" in content or "href" in content or "target=" in content:
            indicators.append("content_HTML")
        if "&lt;" in summary or "&gt;" in summary or "&amp;" in summary:
            indicators.append("summary_entities")
        if "&lt;" in content or "&gt;" in content or "&amp;" in content:
            indicators.append("content_entities")
            
        if indicators:
            safe_title = title.encode('ascii', 'ignore').decode('ascii')
            print(f"ID: {item['id']} | Titulo: {safe_title[:50]}...")
            print(f"  Indicadores: {indicators}")
            print(f"  Summary corto: {repr(summary[:100])}")
            print("-" * 50)
            count += 1
            
    print(f"Total de noticias sospechosas encontradas: {count}")
    
except Exception as e:
    print(f"Error: {e}")
