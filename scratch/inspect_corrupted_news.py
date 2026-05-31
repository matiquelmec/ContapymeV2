import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'engine'))

try:
    from core.database import get_supabase
    db = get_supabase()
    
    res = db.table('regional_news').select('id, title, summary, content').execute()
    
    count = 0
    for item in res.data:
        title = item['title']
        summary = item['summary'] or ""
        content = item['content'] or ""
        
        if "<a href=" in summary or "<a href=" in content or "<a" in summary or "<a" in content:
            safe_title = title.encode('ascii', 'ignore').decode('ascii')
            print(f"ID: {item['id']}")
            print(f"Titulo: {safe_title}")
            print(f"Summary (len {len(summary)}): {repr(summary[:120])}")
            print(f"Content (len {len(content)}): {repr(content[:120])}")
            print("=" * 60)
            count += 1
            if count >= 5:
                break
except Exception as e:
    print(f"Error: {e}")
