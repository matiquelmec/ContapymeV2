import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'engine'))

try:
    from core.database import get_supabase
    db = get_supabase()
    
    buckets = db.storage.list_buckets()
    print("=== BUCKETS DE STORAGE ===")
    for b in buckets:
        print(f"Bucket Name: {b.name}")
        print(f"  Public: {b.public}")
        print(f"  File Size Limit: {b.file_size_limit}")
        print(f"  Allowed MIME Types: {b.allowed_mime_types}")
        print("-" * 40)
except Exception as e:
    print(f"Error: {e}")
