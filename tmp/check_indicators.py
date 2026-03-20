import asyncio
import os
import sys

sys.path.append(os.path.join(os.getcwd(), "engine"))

from core.database import get_supabase

async def check():
    db = get_supabase()
    res = db.table("economic_indicators").select("codigo, valor").execute()
    print(f"📊 Total indicadores: {len(res.data)}")
    for n in res.data:
        print(f"- {n['codigo']}: {n['valor']}")

if __name__ == "__main__":
    asyncio.run(check())
