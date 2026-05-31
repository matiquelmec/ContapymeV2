import sys
import os
from dotenv import load_dotenv

load_dotenv()

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.core.database import get_supabase
from engine.core.dte.dte_logic import DTELogic
from engine.core.dte.dte_signer import DTESigner
from lxml import etree
import base64
import hashlib
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.backends import default_backend

def verify_signatures():
    org_id = "be168b8e-8906-49e5-86e1-6a75919024ba"
    supabase = get_supabase()
    
    # Obtener el XML guardado para Folio 19
    res = supabase.table("dte_issued").select("*").eq("folio", 19).single().execute()
    dte = res.data
    xml_signed = dte["xml_content"]
    
    logic = DTELogic(org_id)
    pfx_bytes, cert_password = logic._get_certificate()
    
    private_key, certificate, additional_certs = pkcs12.load_key_and_certificates(
        pfx_bytes, 
        cert_password.encode() if cert_password else None,
        default_backend()
    )
    
    public_key = certificate.public_key()
    
    # Cargar certificado en el firmador para poder firmar el sobre
    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pfx") as tmp:
        tmp.write(pfx_bytes)
        tmp_pfx_path = tmp.name
    try:
        logic.signer.load_certificate(tmp_pfx_path, cert_password)
        # Reconstruir EnvioBOLETA
        envio_xml = logic.xml_builder.build_envio_dte(xml_signed, dte)
        envio_signed = logic.signer.sign_envio(envio_xml, f"SetDoc_19")
    finally:
        if os.path.exists(tmp_pfx_path):
            os.remove(tmp_pfx_path)
    
    print("--- VERIFICACIÓN LOCAL DE FIRMAS ---")
    
    # Parsear envio_signed
    parser = etree.XMLParser(remove_blank_text=True)
    root = etree.fromstring(envio_signed.encode('ISO-8859-1'), parser)
    
    # Buscar firmas
    ns = {"ds": "http://www.w3.org/2000/09/xmldsig#", "sii": "http://www.sii.cl/SiiDte"}
    sigs = root.xpath("//ds:Signature", namespaces=ns)
    print(f"Total de firmas encontradas en el EnvioBOLETA: {len(sigs)}")
    
    for idx, sig in enumerate(sigs):
        parent = sig.getparent()
        print(f"\n[Firma #{idx+1}] Nodo padre: {parent.tag}")
        
        # Validar Reference Digest
        ref = sig.find("ds:SignedInfo/ds:Reference", namespaces=ns)
        uri = ref.get("URI")
        digest_val_b64 = ref.find("ds:DigestMethod/../ds:DigestValue", namespaces=ns).text
        print(f"  URI de referencia: {uri}")
        print(f"  DigestValue en XML: {digest_val_b64}")
        
        # Buscar el nodo referido
        if uri.startswith("#"):
            target_id = uri[1:]
            target_node = root.xpath(f"//*[@ID='{target_id}']") or root.xpath(f"//*[@id='{target_id}']")
            if not target_node:
                print(f"  ERROR: No se encontró el nodo con ID {target_id}")
                continue
            node_to_verify = target_node[0]
        else:
            node_to_verify = root
            
        # Calcular Digest
        c14n_node = etree.tostring(node_to_verify, method="c14n", exclusive=False, with_comments=False)
        calculated_digest = base64.b64encode(hashlib.sha1(c14n_node).digest()).decode()
        print(f"  DigestValue calculado: {calculated_digest}")
        
        if calculated_digest == digest_val_b64:
            print("  ✅ Digest coincide.")
        else:
            print("  ❌ ERROR: Digest NO COINCIDE!")
            
        # Verificar firma de SignedInfo
        signed_info_node = sig.find("ds:SignedInfo", namespaces=ns)
        c14n_signed_info = etree.tostring(signed_info_node, method="c14n", exclusive=False, with_comments=False)
        
        sig_value_b64 = sig.find("ds:SignatureValue", namespaces=ns).text.strip().replace("\n", "").replace(" ", "")
        sig_bytes = base64.b64decode(sig_value_b64)
        
        try:
            public_key.verify(
                sig_bytes,
                c14n_signed_info,
                padding.PKCS1v15(),
                hashes.SHA1()
            )
            print("  ✅ Firma criptográfica de SignedInfo es VÁLIDA.")
        except Exception as e:
            print(f"  ❌ ERROR: Firma criptográfica de SignedInfo es INVÁLIDA: {e}")

if __name__ == "__main__":
    verify_signatures()
