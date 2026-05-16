import asyncio
import os
import sys

# Añadir el directorio engine al path para poder importar
sys.path.append(os.path.join(os.getcwd(), "engine"))

from core.database import get_supabase

async def check():
    db = get_supabase()
    res = db.table("regional_news").select("id, title, is_featured").execute()
    print(f"📊 Total noticias en la base de datos: {len(res.data)}")
    for n in res.data:
        print(f"- [{n['id']}] {'⭐️ ' if n['is_featured'] else ''}{n['title']}")

if __name__ == "__main__":
    asyncio.run(check())
