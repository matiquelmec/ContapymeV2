import httpx
import xml.etree.ElementTree as ET
import asyncio

NEWS_SOURCES = [
    {"name": "La Prensa Austral", "url": "https://laprensaaustral.cl/feed/"},
    {"name": "El Pingüino", "url": "https://elpinguino.com/rss"},
    {"name": "Ovejero Noticias", "url": "https://www.ovejeronoticias.cl/feed/"},
]

async def audit():
    print("🔍 [Auditoría RSS] Escaneando fuentes...")
    async with httpx.AsyncClient() as client:
        for source in NEWS_SOURCES:
            try:
                resp = await client.get(source["url"], follow_redirects=True, timeout=10)
                if resp.status_code == 200:
                    root = ET.fromstring(resp.text)
                    items = root.findall('.//item')
                    print(f"✅ {source['name']}: {len(items)} noticias encontradas.")
                    for i, item in enumerate(items[:3]):
                        title = item.find('title').text
                        print(f"   [{i+1}] {title[:60]}...")
                else:
                    print(f"❌ {source['name']}: Error {resp.status_code}")
            except Exception as e:
                print(f"❌ {source['name']}: Error parsing: {e}")

if __name__ == "__main__":
    asyncio.run(audit())
