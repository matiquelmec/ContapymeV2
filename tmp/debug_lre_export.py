import sys
import os
import asyncio
from pydantic import BaseModel

# Configurar entorno para importar módulos del engine
sys.path.append(os.path.abspath("engine"))

# Cargar variables de entorno
from dotenv import load_dotenv
load_dotenv(os.path.abspath("engine/.env"))

from core.database import get_supabase
from api.routers.lre import export_lre

async def test_export():
    print("--- Probando Exportación LRE ---")
    db = get_supabase()
    
    # 1. Obtener el último libro generado
    try:
        res = db.table("payroll_books").select("id").order("periodo", desc=True).limit(1).execute()
        if not res.data:
            print("No hay libros para probar.")
            return
        
        book_id = res.data[0]["id"]
        print(f"Probando con Book ID: {book_id}")
        
        # Simulamos la llamada al endpoint
        # export_lre(book_id, current_user={})
        # Como es una función async con Depends, la llamamos directo con mocks
        response = await export_lre(book_id, current_user={"id": "test-user"})
        print("Éxito: El archivo se generó correctamente.")
        print(f"Tamaño del contenido: {len(response.body)} bytes")
    except Exception as e:
        print(f"FALLO DETECTADO: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_export())
