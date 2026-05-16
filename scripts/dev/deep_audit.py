import asyncio
import os
import sys

# Añadir el directorio engine al path para poder importar
sys.path.append(os.path.join(os.getcwd(), "engine"))

from core.database import get_supabase
from workers.news_worker import _fetch_and_process_news

async def run_audit():
    print("🚀 [Audit] Starting deep news audit...")
    # Set env to see everything
    os.environ["SKIP_IMAGE_GEN"] = "true"
    
    # We want to see WHY it's skipping
    import logging
    logging.basicConfig(level=logging.INFO)
    
    stats = await _fetch_and_process_news()
    print(f"🏁 Statistics: {stats}")

if __name__ == "__main__":
    asyncio.run(run_audit())
