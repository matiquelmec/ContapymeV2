import asyncio
import os
import sys

# Anadir el directorio engine al path para poder importar
sys.path.append(os.path.join(os.getcwd(), "engine"))

from workers.news_worker import _fetch_and_process_news

async def main():
    print("Iniciando actualizacion manual de noticias (sin borrar existentes)...")
    try:
        result = await _fetch_and_process_news()
        print(f"Ciclo completado. Resultado: {result}")
    except Exception as e:
        print(f"Error al ejecutar el worker: {e}")

if __name__ == "__main__":
    asyncio.run(main())
