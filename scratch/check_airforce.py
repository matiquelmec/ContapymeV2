import asyncio
import httpx
import urllib.parse
import random

async def check_airforce():
    prompt = "A hyperrealistic photograph of students in Punta Arenas, shot on 35mm lens"
    art_style = "hyperrealistic photorealistic news photography"
    full_prompt = f"{prompt}, {art_style}"
    
    encoded_prompt = urllib.parse.quote(full_prompt)
    seed = random.randint(1, 999999)
    
    af_url = f"https://api.airforce/v1/imagine2?prompt={encoded_prompt}&seed={seed}"
    print(f"Requesting Airforce API: {af_url}")
    
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        try:
            response = await client.get(af_url)
            print(f"Status Code: {response.status_code}")
            print(f"Headers: {dict(response.headers)}")
            print(f"Content Type: {response.headers.get('content-type')}")
            print(f"Content Length: {len(response.content)}")
            
            # Mostrar los primeros 200 caracteres de la respuesta
            preview = response.content[:200]
            print(f"Raw Content Preview: {preview}")
            
            # Intentar ver si es un JSON
            try:
                json_data = response.json()
                print("Parsed JSON:", json_data)
            except:
                print("Content is not JSON.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_airforce())
