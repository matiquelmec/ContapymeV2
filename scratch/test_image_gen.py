import asyncio
import httpx
import urllib.parse
import random
import sys

async def test_image_generation():
    prompt = "A hyperrealistic photograph of students in Punta Arenas helping people apply for electricity subsidies, natural lighting, shot on 35mm lens"
    art_style = "hyperrealistic photorealistic news photography, highly detailed, cinematic lighting, shot on 35mm lens, authentic documentary style"
    full_prompt = f"{prompt}, {art_style}"
    
    encoded_prompt = urllib.parse.quote(full_prompt)
    seed = random.randint(1, 999999)
    
    print(f"Prompt original: {full_prompt}")
    print(f"Prompt codificado: {encoded_prompt}\n")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Probar Pollinations
        gen_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=768&seed={seed}&model=flux&nologo=true"
        print(f"Probando MOTOR 1 (Pollinations): {gen_url}")
        try:
            response = await client.get(gen_url)
            print(f"Respuesta Pollinations: status={response.status_code}, content_length={len(response.content)}")
            if response.status_code == 200 and len(response.content) > 15000:
                print("✅ MOTOR 1 (Pollinations) FUNCIONA PERFECTAMENTE.")
            else:
                print("❌ MOTOR 1 (Pollinations) falló o devolvió imagen vacía.")
        except Exception as e:
            print(f"❌ MOTOR 1 (Pollinations) arrojó excepción: {e}")
            
        print("-" * 50)
        
        # 2. Probar Airforce
        af_url = f"https://api.airforce/v1/imagine2?prompt={encoded_prompt}&seed={seed}"
        print(f"Probando MOTOR 2 (Airforce): {af_url}")
        try:
            response = await client.get(af_url)
            print(f"Respuesta Airforce: status={response.status_code}, content_length={len(response.content)}")
            if response.status_code == 200 and len(response.content) > 10000:
                print("✅ MOTOR 2 (Airforce) FUNCIONA PERFECTAMENTE.")
            else:
                print("❌ MOTOR 2 (Airforce) falló.")
        except Exception as e:
            print(f"❌ MOTOR 2 (Airforce) arrojó excepción: {e}")

if __name__ == "__main__":
    asyncio.run(test_image_generation())
