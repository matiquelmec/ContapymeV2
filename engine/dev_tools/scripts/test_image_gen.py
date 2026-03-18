import asyncio
from core.images import generate_and_upload_image

async def run_test():
    print("🎨 Iniciando prueba de generación visual...")
    prompt = "A cinematic realistic photo of the municipal theater in Punta Arenas, Magallanes, 8k, highly detailed, realistic texture, soft lighting, 50mm lens style."
    print(f"Prompt: {prompt}")
    
    try:
        url = await generate_and_upload_image(prompt, news_id="test_manual_1")
        print(f"✅ EXITO! Imagen generada y subida.")
        print(f"URL: {url}")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(run_test())
