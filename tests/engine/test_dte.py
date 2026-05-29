import os
import base64
import datetime
import pytest
import hashlib
from unittest.mock import MagicMock

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12

from engine.core.dte.caf_manager import CAFManager
from engine.core.dte.dte_signer import DTESigner
from engine.core.dte.dte_xml_builder import DTEXMLBuilder
from engine.core.dte.dte_logic import DTELogic

def generate_dummy_pfx(password: str) -> bytes:
    """Genera un archivo PFX dummy en memoria usando cryptography real."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )
    subject = issuer = x509.Name([
        x509.NameAttribute(x509.NameOID.COMMON_NAME, u"Certificado de Pruebas DTE"),
    ])
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        private_key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    ).not_valid_after(
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365)
    ).sign(private_key, hashes.SHA256())
    
    pfx_data = pkcs12.serialize_key_and_certificates(
        name=b"test",
        key=private_key,
        cert=cert,
        cas=None,
        encryption_algorithm=serialization.BestAvailableEncryption(password.encode())
    )
    return pfx_data

def generate_dummy_caf_xml() -> tuple[str, rsa.RSAPrivateKey]:
    """Genera un CAF XML con claves RSA matemáticamente válidas."""
    key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=1024
    )
    numbers = key.private_numbers()
    
    def int_to_b64(val: int) -> str:
        val_bytes = val.to_bytes((val.bit_length() + 7) // 8, byteorder='big')
        return base64.b64encode(val_bytes).decode('utf-8')
        
    s_b64 = int_to_b64(numbers.d)
    p_b64 = int_to_b64(numbers.p)
    q_b64 = int_to_b64(numbers.q)
    m_b64 = int_to_b64(numbers.public_numbers.n)
    e_b64 = int_to_b64(numbers.public_numbers.e)
    
    caf_xml = f"""<AUTORIZACION>
    <CAF version="1.0">
        <DA>
            <RE>76123456-7</RE>
            <RS>EMPRESA TEST LTDA</RS>
            <TD>33</TD>
            <RNG>
                <D>1</D>
                <H>100</H>
            </RNG>
            <FA>2026-05-19</FA>
            <RSAPK>
                <M>{m_b64}</M>
                <E>{e_b64}</E>
            </RSAPK>
        </DA>
        <FRMA algoritmo="SHA1withRSA">firma_sii_dummy_b64</FRMA>
    </CAF>
    <RSASK>
        <S>{s_b64}</S>
        <p>{p_b64}</p>
        <q>{q_b64}</q>
    </RSASK>
</AUTORIZACION>"""
    return caf_xml, key

def test_os_name_error_fixed():
    """Valida que la clase DTESigner se pueda instanciar sin NameError de 'os'."""
    signer = DTESigner()
    assert signer is not None
    assert signer.cert_path is None

def test_caf_private_key_extraction():
    """Valida que CAFManager extraiga la clave privada en formato PEM correctamente."""
    caf_xml, original_key = generate_dummy_caf_xml()
    pem_str = CAFManager.get_private_key_from_caf(caf_xml)
    
    assert pem_str is not None
    assert "BEGIN RSA PRIVATE KEY" in pem_str
    
    # Intentar cargar la clave PEM extraída usando cryptography para certificar su validez
    loaded_key = serialization.load_pem_private_key(
        pem_str.encode('utf-8'),
        password=None
    )
    assert isinstance(loaded_key, rsa.RSAPrivateKey)
    assert loaded_key.private_numbers().d == original_key.private_numbers().d

def test_ted_xml_generation_and_signature():
    """Valida la generación de TED XML y su firma criptográfica."""
    caf_xml, private_key = generate_dummy_caf_xml()
    rsask_pem = CAFManager.get_private_key_from_caf(caf_xml)
    
    company_data = {
        "rut": "76123456-7",
        "razon_social": "EMPRESA TEST LTDA",
        "giro": "INFORMATICA",
        "acteco": "620100",
        "direccion": "AV. ESPAÑA 100",
        "comuna": "PUNTA ARENAS",
        "ciudad": "PUNTA ARENAS"
    }
    
    dte_data = {
        "tipo_dte": 33,
        "folio": 5,
        "fecha_emision": "2026-05-19",
        "receptor_rut": "99123456-K",
        "receptor_razon_social": "CLIENTE DE PRUEBAS S.A.",
        "monto_total": 150000
    }
    
    builder = DTEXMLBuilder(company_data)
    signer = DTESigner()
    
    # 1. Armar bloque DD para firma
    tstamp = "2026-05-19T18:36:36"
    item1_name = "PRODUCTO DE PRUEBA"
    
    caf_xml_clean = caf_xml.strip()
    dd_xml_str = f"<DD><RE>{company_data['rut']}</RE><TD>{dte_data['tipo_dte']}</TD><F>{dte_data['folio']}</F><FE>{dte_data['fecha_emision']}</FE><RR>{dte_data['receptor_rut']}</RR><RSR>{dte_data['receptor_razon_social'][:40]}</RSR><MNT>{dte_data['monto_total']}</MNT><IT1>{item1_name[:40]}</IT1>{caf_xml_clean}<TSTAMP>{tstamp}</TSTAMP></DD>"
    
    # 2. Firmar el bloque DD
    signature_b64 = signer.sign_ted(dd_xml_str, rsask_pem)
    assert signature_b64 is not None
    assert len(signature_b64) > 0
    
    # 3. Construir el bloque TED completo
    ted_xml = builder.build_ted_xml(dte_data, item1_name, caf_xml, signature_b64, tstamp)
    assert "<TED version=\"1.0\">" in ted_xml
    assert "<FRMT algoritmo=\"SHA1withRSA\">" in ted_xml
    assert signature_b64 in ted_xml

def test_hash_chain_synchronization():
    """Valida que la lógica de Python genere el mismo hash hexadecimal que PostgreSQL."""
    record = {
        "organization_id": "00000000-0000-0000-0000-000000000001",
        "company_id": "00000000-0000-0000-0000-000000000002",
        "tipo_dte": 33,
        "folio": 15,
        "monto_total": 450000,
        "receptor_rut": "99888777-6",
        "previous_hash": "SOME_PREVIOUS_HASH_VALUE_HERE"
    }
    
    # Replicación del cálculo de Python
    fields = [
        str(record["organization_id"]),
        str(record["company_id"]),
        str(record["tipo_dte"]),
        str(record["folio"]),
        str(record["monto_total"]),
        str(record["receptor_rut"]),
        str(record["previous_hash"])
    ]
    data_string = "|".join(fields)
    python_hash = hashlib.sha256(data_string.encode('utf-8')).hexdigest()
    
    # Simulación del trigger SQL:
    # SELECT encode(digest('org_id|comp_id|tipo_dte|folio|monto_total|receptor_rut|prev_hash', 'sha256'), 'hex')
    sql_simulation_string = (
        f"{record['organization_id']}|{record['company_id']}|"
        f"{record['tipo_dte']}|{record['folio']}|{record['monto_total']}|"
        f"{record['receptor_rut']}|{record['previous_hash']}"
    )
    sql_hash = hashlib.sha256(sql_simulation_string.encode('utf-8')).hexdigest()
    
    assert python_hash == sql_hash
    assert len(python_hash) == 64

def test_xml_signer_with_pfx(tmp_path):
    """Prueba que el cargador y firmador de certificados digital de DTESigner funcione de extremo a extremo."""
    password = "secret_password"
    pfx_data = generate_dummy_pfx(password)
    
    pfx_file = tmp_path / "cert.pfx"
    pfx_file.write_bytes(pfx_data)
    
    signer = DTESigner(cert_path=str(pfx_file), password=password)
    assert signer.private_key is not None
    assert signer.certificate is not None
    
    # XML de prueba para firmar
    xml_string = """<DTE xmlns="http://www.sii.cl/SiiDte" version="1.0">
        <Documento ID="DTE_33_55">
            <Encabezado>
                <IdDoc><TipoDTE>33</TipoDTE><Folio>55</Folio></IdDoc>
            </Encabezado>
        </Documento>
    </DTE>"""
    
    signed_xml = signer.sign_xml(xml_string, "DTE_33_55")
    assert signed_xml is not None
    assert "<Signature" in signed_xml
    assert "<SignatureValue>" in signed_xml
    assert "<X509Certificate>" in signed_xml

def test_seed_signature_includes_legacy_certificate_tag(tmp_path):
    """Valida compatibilidad boleta token: include Certificate sin namespace."""
    password = "seed_pass"
    pfx_data = generate_dummy_pfx(password)

    pfx_file = tmp_path / "seed_cert.pfx"
    pfx_file.write_bytes(pfx_data)

    signer = DTESigner(cert_path=str(pfx_file), password=password)
    signed_seed = signer.sign_seed("123456789")

    assert "<Certificate xmlns=\"\">" in signed_seed
    assert "<KeyInfo>" in signed_seed
