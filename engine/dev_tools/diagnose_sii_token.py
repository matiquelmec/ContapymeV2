"""
Diagnóstico del canje de token SII (estado 10 'Error Interno').

Carga el certificado real de la empresa (o el maestro), valida su vigencia y
ejecuta el flujo completo semilla -> firma -> token tanto para BOLETA (REST)
como para FACTURA (SOAP), imprimiendo la respuesta cruda del SII.

Uso:
    engine/.venv/Scripts/python.exe engine/dev_tools/diagnose_sii_token.py <organization_id>

Requiere el .env del engine (Supabase + DTE_MASTER_CERT_PASSWORD) y conecta al SII.
"""
import asyncio
import os
import sys
import tempfile
from datetime import datetime, timezone

ENGINE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ENGINE_DIR)

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(ENGINE_DIR, ".env"))
except Exception:
    pass

from core.dte.dte_logic import DTELogic
from core.dte.sii_client import SIIClient


def _print_cert_info(cert):
    try:
        not_after = cert.not_valid_after_utc
        not_before = cert.not_valid_before_utc
        now = datetime.now(timezone.utc)
    except AttributeError:
        not_after = cert.not_valid_after
        not_before = cert.not_valid_before
        now = datetime.utcnow()

    print(f"  Sujeto:  {cert.subject.rfc4514_string()}")
    print(f"  Emisor:  {cert.issuer.rfc4514_string()}")
    print(f"  Válido:  {not_before:%d-%m-%Y} → {not_after:%d-%m-%Y}")
    if now > not_after:
        print(f"  *** CERTIFICADO VENCIDO hace {(now - not_after).days} días — ESTA ES LA CAUSA MÁS PROBABLE DEL ESTADO 10 ***")
    elif now < not_before:
        print(f"  *** CERTIFICADO AÚN NO VIGENTE ***")
    else:
        dias = (not_after - now).days
        print(f"  Vigente (quedan {dias} días)" + ("  ⚠ por vencer" if dias < 30 else ""))


async def _probe(env: str, logic: DTELogic):
    print(f"\n=== AMBIENTE: {env.upper()} ===")
    client = SIIClient(environment=env)

    # Boleta (REST)
    try:
        seed = await client.get_boleta_seed()
        signed = logic.signer.sign_seed(seed)
        token = await client.get_boleta_token(signed)
        print(f"  [BOLETA REST]  OK — token: {token[:24]}…")
    except Exception as e:
        print(f"  [BOLETA REST]  FALLO: {e}")

    # Factura (SOAP)
    try:
        seed = await client.get_seed()
        signed = logic.signer.sign_seed(seed)
        token = await client.get_token(signed)
        print(f"  [FACTURA SOAP] OK — token: {token[:24]}…")
    except Exception as e:
        print(f"  [FACTURA SOAP] FALLO: {e}")


async def main(org_id: str):
    print(f"Organización: {org_id}")
    logic = DTELogic(org_id)
    print(f"Emisor: {logic.company_data.get('razon_social') or logic.company_data.get('rut')}")

    print("\n--- CERTIFICADO ---")
    pfx_bytes, pwd = logic._get_certificate()
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pfx") as tmp:
        tmp.write(pfx_bytes)
        path = tmp.name
    try:
        # load_certificate ya valida vigencia y lanzará si está vencido.
        logic.signer.load_certificate(path, pwd)
    finally:
        if os.path.exists(path):
            os.remove(path)
    _print_cert_info(logic.signer.certificate)

    for env in ("certification", "production"):
        await _probe(env, logic)

    print("\nListo. Compara qué ambiente/ruta funcionó con el 'environment' de tus CAF activos.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python engine/dev_tools/diagnose_sii_token.py <organization_id>")
        raise SystemExit(2)
    asyncio.run(main(sys.argv[1]))
