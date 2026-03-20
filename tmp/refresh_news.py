import asyncio
import os
import sys

# Añadir el directorio engine al path para poder importar
sys.path.append(os.path.join(os.getcwd(), "engine"))

from core.database import get_supabase
from workers.news_worker import _fetch_and_process_news

async def refresh():
    print("🚀 [News Fixer] Iniciando limpieza de noticias...", flush=True)
    db = get_supabase()
    
    # 1. Limpiar la tabla (Borrar noticias sucias existentes)
    try:
        # Borrar todas las noticias
        res = db.table("regional_news").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"🧹 Limpieza completada. Noticias eliminadas.", flush=True)
    except Exception as e:
        print(f"⚠️ Error limpiando tabla: {e}", flush=True)

    # 2. Trigger de captura y redacción con el NUEVO Estándar IA
    print("🤖 Capturando y REDACTANDO nuevas noticias con el estándar de alta calidad...", flush=True)
    try:
        stats = await _fetch_and_process_news()
        print(f"✅ Ciclo completado. Noticias procesadas: {stats.get('total', 0)}", flush=True)
    except Exception as e:
        print(f"❌ Error en el procesamiento: {e}", flush=True)

if __name__ == "__main__":
    asyncio.run(refresh())
