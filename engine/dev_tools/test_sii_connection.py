import asyncio
import os
import sys

# Agregar la ruta del engine
sys.path.append("C:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/engine")

from core.dte.sii_client import SIIClient

async def test_sii_seed():
    print("Iniciando prueba de conexión SOAP con el SII...")
    
    # 1. Probar en ambiente de certificación
    print("\n[Ambiente: CERTIFICACIÓN]")
    try:
        client_cert = SIIClient(environment="certification")
        seed = await client_cert.get_seed()
        print(f"[OK] Exito en Certificacion! Semilla obtenida: {seed}")
    except Exception as e:
        print(f"[ERROR] Fallo en Certificacion: {str(e)}")
        
    # 2. Probar en ambiente de producción
    print("\n[Ambiente: PRODUCCIÓN]")
    try:
        client_prod = SIIClient(environment="production")
        seed = await client_prod.get_seed()
        print(f"[OK] Exito en Produccion! Semilla obtenida: {seed}")
    except Exception as e:
        print(f"[ERROR] Fallo en Produccion: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_sii_seed())
