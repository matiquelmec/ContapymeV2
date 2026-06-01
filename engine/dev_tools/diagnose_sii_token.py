"""
Diagnóstico del canje de token SII (estado 10 'Error Interno').

Carga el certificado real de la empresa (o el maestro), valida su vigencia y
ejecuta el flujo completo semilla -> firma -> token para BOLETA (REST) y
FACTURA (SOAP), probando DOS formatos de firma de semilla:

  * LEGACY  : firma sin prefijo, ISO-8859-1, sin tag <Certificate> extra
              (el formato anterior al 2026-05-29, que venía funcionando).
  * ACTUAL  : firma con prefijo ds:, UTF-8, con tag <Certificate xmlns="">
              (el formato introducido el 2026-05-29).

Así determinamos empíricamente cuál acepta el SII en vez de adivinar.

Uso:
    engine/.venv/Scripts/python.exe engine/dev_tools/diagnose_sii_token.py <organization_id>

Requiere el .env del engine (Supabase + DTE_MASTER_CERT_PASSWORD) y conecta al SII.
"""
import asyncio
import os
import sys
import tempfile
from datetime import datetime, timezone

from lxml import etree

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ENGINE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ENGINE_DIR)

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(ENGINE_DIR, ".env"))
except Exception:
    pass

from core.dte.dte_logic import DTELogic
from core.dte.sii_client import SIIClient


def _sign_seed_current(signer, seed: str) -> str:
    """Formato ACTUAL (post 2026-05-29): ds: + utf-8 + <Certificate> legacy."""
    return signer.sign_seed(seed)


def _sign_seed_legacy(signer, seed: str) -> str:
    """Formato LEGACY (pre 2026-05-29): sin prefijo, ISO-8859-1, sin tag extra."""
    xml_string = f"<getToken><item><Semilla>{seed}</Semilla></item></getToken>"
    parser = etree.XMLParser(remove_blank_text=True)
    root = etree.fromstring(xml_string.encode("ISO-8859-1"), parser)
    return signer._sign_node(
        root,
        ".",
        "",
        pretty_print=False,
        output_encoding="ISO-8859-1",
        include_legacy_certificate_tag=False,
        use_ds_prefix=False,
    )


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
    print(f"  Valido:  {not_before:%d-%m-%Y} -> {not_after:%d-%m-%Y}")
    if now > not_after:
        print(f"  *** CERTIFICADO VENCIDO hace {(now - not_after).days} días ***")
    elif now < not_before:
        print(f"  *** CERTIFICADO AÚN NO VIGENTE ***")
    else:
        dias = (not_after - now).days
        print(f"  Vigente (quedan {dias} dias)" + ("  (!) por vencer" if dias < 30 else ""))


async def _probe(env: str, logic: DTELogic):
    print(f"\n=== AMBIENTE: {env.upper()} ===")
    client = SIIClient(environment=env)

    variants = {"LEGACY (pre 05-29)": _sign_seed_legacy, "ACTUAL (post 05-29)": _sign_seed_current}

    # Factura (SOAP)
    for label, signfn in variants.items():
        try:
            seed = await client.get_seed()
            signed = signfn(logic.signer, seed)
            token = await client.get_token(signed)
            print(f"  [FACTURA SOAP | firma {label}]  >>> OK <<< token: {token[:24]}...")
        except Exception as e:
            print(f"  [FACTURA SOAP | firma {label}]  FALLO: {e}")

    # Boleta (REST)
    for label, signfn in variants.items():
        try:
            seed = await client.get_boleta_seed()
            signed = signfn(logic.signer, seed)
            token = await client.get_boleta_token(signed)
            print(f"  [BOLETA REST  | firma {label}]  >>> OK <<< token: {token[:24]}...")
        except Exception as e:
            print(f"  [BOLETA REST  | firma {label}]  FALLO: {e}")


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
        logic.signer.load_certificate(path, pwd)
    finally:
        if os.path.exists(path):
            os.remove(path)
    _print_cert_info(logic.signer.certificate)

    for env in ("certification", "production"):
        await _probe(env, logic)

    print("\nInterpretación:")
    print("  - Si LEGACY funciona y ACTUAL falla -> la causa es el cambio de firma del 2026-05-29.")
    print("  - Si ambas firmas fallan en todo -> mirar certificado/habilitación en el SII.")
    print("  - Compara el ambiente que funciona con el 'environment' de tus CAF activos.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python engine/dev_tools/diagnose_sii_token.py <organization_id>")
        raise SystemExit(2)
    asyncio.run(main(sys.argv[1]))
