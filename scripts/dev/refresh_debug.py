import asyncio
import os
import sys

# Añadir el directorio engine al path para poder importar
sys.path.append(os.path.join(os.getcwd(), "engine"))

from core.database import get_supabase
from workers.news_worker import _fetch_and_process_news

async def refresh():
    print("🚀 [News Fixer] START...")
    db = get_supabase()
    
    # 1. Limpiar la tabla
    print("🧹 Eliminando noticias antiguas...")
    try:
        res = db.table("regional_news").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"✅ Tabla regional_news limpia.")
    except Exception as e:
        print(f"⚠️ Error limpiando tabla: {e}")

    # 2. Forzar proceso
    print("🤖 Ejecutando _fetch_and_process_news()...")
    # Forzamos skip de imágenes para diagnósico rápido en esta sesión
    os.environ["SKIP_IMAGE_GEN"] = "true"
    
    try:
        stats = await _fetch_and_process_news()
        print(f"🏁 CICLO COMPLETADO. Estadísticas: {stats}")
        
        # 3. Verificar inmediatamente
        res = db.table("regional_news").select("id").execute()
        print(f"📊 Verificación Post-Ciclo: Hay {len(res.data)} noticias en DB.")
    except Exception as e:
        print(f"❌ ERROR CRÍTICO EN PROCESO: {e}")

if __name__ == "__main__":
    asyncio.run(refresh())
