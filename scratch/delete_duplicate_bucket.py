import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'engine'))

try:
    from core.database import get_supabase
    db = get_supabase()
    
    print("Intentando eliminar el bucket duplicado vacío 'news-images'...")
    res = db.storage.delete_bucket('news-images')
    print("¡Bucket 'news-images' eliminado exitosamente!")
    
except Exception as e:
    print(f"Error al eliminar el bucket: {e}")
