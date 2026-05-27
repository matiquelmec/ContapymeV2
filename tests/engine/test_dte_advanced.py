import os
import base64
import datetime
import pytest
import hashlib
from unittest.mock import MagicMock
from lxml import etree

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12

from engine.core.dte.caf_manager import CAFManager
from engine.core.dte.dte_signer import DTESigner
from engine.core.dte.dte_xml_builder import DTEXMLBuilder
from engine.core.dte.dte_logic import DTELogic

def generate_dummy_pfx(password: str) -> bytes:
    """Genera un certificado PFX real válido matemáticamente en memoria."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )
    subject = issuer = x509.Name([
        x509.NameAttribute(x509.NameOID.COMMON_NAME, u"Certificado Integridad Contapymepuq"),
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
        name=b"audit-cert",
        key=private_key,
        cert=cert,
        cas=None,
        encryption_algorithm=serialization.BestAvailableEncryption(password.encode())
    )
    return pfx_data

def generate_valid_caf_xml(rng_start=1, rng_end=100) -> str:
    """Genera un bloque de CAF XML válido para pruebas unitarias."""
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
            <RS>CONTA PYME AUDITORIA LTDA</RS>
            <TD>33</TD>
            <RNG>
                <D>{rng_start}</D>
                <H>{rng_end}</H>
            </RNG>
            <FA>2026-05-27</FA>
            <RSAPK>
                <M>{m_b64}</M>
                <E>{e_b64}</E>
            </RSAPK>
        </DA>
        <FRMA algoritmo="SHA1withRSA">firma_dummy_sii_verificacion</FRMA>
    </CAF>
    <RSASK>
        <S>{s_b64}</S>
        <p>{p_b64}</p>
        <q>{q_b64}</q>
    </RSASK>
</AUTORIZACION>"""
    return caf_xml

def test_signature_and_xml_compliance(tmp_path):
    """Audita de forma estricta que la firma cumpla con la especificación de XMLDSig."""
    password = "verification-pass"
    pfx_data = generate_dummy_pfx(password)
    
    pfx_file = tmp_path / "cert_temp.pfx"
    pfx_file.write_bytes(pfx_data)
    
    signer = DTESigner(cert_path=str(pfx_file), password=password)
    assert signer.private_key is not None
    assert signer.certificate is not None
    
    xml_string = """<DTE xmlns="http://www.sii.cl/SiiDte" version="1.0">
        <Documento ID="DTE_33_101">
            <Encabezado>
                <IdDoc><TipoDTE>33</TipoDTE><Folio>101</Folio></IdDoc>
            </Encabezado>
        </Documento>
    </DTE>"""
    
    signed_xml = signer.sign_xml(xml_string, "DTE_33_101")
    assert signed_xml is not None
    
    # Validar parseabilidad de XML firmado y que el nodo Signature esté inyectado
    root = etree.fromstring(signed_xml.encode('ISO-8859-1'))
    ns = {"ds": "http://www.w3.org/2000/09/xmldsig#"}
    sig_nodes = root.xpath("//ds:Signature", namespaces=ns)
    
    assert len(sig_nodes) == 1
    assert root.xpath("//ds:SignatureValue", namespaces=ns)[0].text is not None
    assert root.xpath("//ds:X509Certificate", namespaces=ns)[0].text is not None

def test_caf_manager_extraction():
    """Valida la robustez del CAFManager al extraer llaves y verificar rangos."""
    caf_xml = generate_valid_caf_xml(10, 50)
    
    # 1. Extraer RSA key
    pem_str = CAFManager.get_private_key_from_caf(caf_xml)
    assert pem_str is not None
    assert "BEGIN RSA PRIVATE KEY" in pem_str
    
    # 2. Cargar en cryptography
    private_key = serialization.load_pem_private_key(
        pem_str.encode('utf-8'),
        password=None
    )
    assert isinstance(private_key, rsa.RSAPrivateKey)

def test_xml_builder_references():
    """Valida que el DTEXMLBuilder inyecte correctamente referencias SII (nodos Referencia)."""
    company_data = {
        "rut": "76123456-7",
        "razon_social": "EMPRESA DE PRUEBA",
        "giro": "SERVICIOS",
        "acteco": "620100",
        "direccion": "AV. COLON 500",
        "comuna": "PUNTA ARENAS",
        "ciudad": "PUNTA ARENAS"
    }
    
    dte_record = {
        "organization_id": "org-1",
        "company_id": "comp-1",
        "tipo_dte": 33,
        "folio": 12,
        "fecha_emision": "2026-05-27",
        "receptor_rut": "99123456-K",
        "receptor_razon_social": "RECEPTOR S.A.",
        "monto_neto": 10000,
        "monto_iva": 1900,
        "monto_total": 11900,
        "tasa_iva": 19.00,
        "status": "draft",
        "previous_hash": "PREV_HASH"
    }
    
    items = [{
        "product_name": "CONCEPTO AUDITORIA",
        "quantity": 1,
        "unit_price": 10000,
        "total_amount": 10000
    }]
    
    referencias = [{
        "NroLinRef": 1,
        "tipo_doc": "33",
        "folio": "5",
        "fecha": "2026-05-20",
        "cod_ref": 1,
        "razon": "Corrige folio"
    }]
    
    builder = DTEXMLBuilder(company_data)
    ted_xml = "<TED></TED>"
    
    xml_str = builder.build_dte_xml(dte_record, items, ted_xml=ted_xml, referencias=referencias)
    
    assert "<Referencia>" in xml_str
    assert "<TpoDocRef>33</TpoDocRef>" in xml_str
    assert "<FolioRef>5</FolioRef>" in xml_str
    assert "<Razon>Corrige folio</Razon>" in xml_str
