import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'engine'))

try:
    from core.database import get_supabase
    db = get_supabase()
    
    print("=== ARCHIVOS EN 'news_images' (guion bajo) ===")
    try:
        files_under = db.storage.from_("news_images").list()
        for f in files_under:
            print(f"Name: {f['name']} | Size: {f.get('metadata', {}).get('size', 0)} bytes")
    except Exception as e:
        print(f"Error listando news_images: {e}")
        
    print("\n=== ARCHIVOS EN 'news-images' (guion medio) ===")
    try:
        files_dash = db.storage.from_("news-images").list()
        for f in files_dash:
            print(f"Name: {f['name']} | Size: {f.get('metadata', {}).get('size', 0)} bytes")
    except Exception as e:
        print(f"Error listando news-images: {e}")
except Exception as e:
    print(f"Error general: {e}")
