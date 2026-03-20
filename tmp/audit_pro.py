import httpx
import xml.etree.ElementTree as ET
import asyncio

STEALTH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
    "Accept-Language": "es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://www.google.com/",
    "Connection": "keep-alive"
}

NEWS_SOURCES = [
    {"name": "La Prensa Austral", "url": "https://laprensaaustral.cl/feed/"},
    {"name": "El Pingüino", "url": "https://elpinguino.com/rss"},
    {"name": "Ovejero Noticias", "url": "https://www.ovejeronoticias.cl/feed/"},
    {"name": "Google News Magallanes", "url": "https://news.google.com/rss/search?q=Punta+Arenas+Magallanes&hl=es-419&gl=CL&ceid=CL:es-419"},
]

async def audit():
    print("🔍 [Auditoría Pro] Escaneando con camuflaje Stealth...")
    async with httpx.AsyncClient(headers=STEALTH_HEADERS, follow_redirects=True, timeout=15) as client:
        for source in NEWS_SOURCES:
            try:
                resp = await client.get(source["url"])
                if resp.status_code == 200:
                    root = ET.fromstring(resp.text)
                    items = root.findall('.//item')
                    print(f"✅ {source['name']}: {len(items)} noticias encontradas.")
                else:
                    print(f"❌ {source['name']}: Error {resp.status_code}")
            except Exception as e:
                print(f"❌ {source['name']}: Error: {e}")

if __name__ == "__main__":
    asyncio.run(audit())
