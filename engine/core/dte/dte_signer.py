import base64
import hashlib
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from lxml import etree

class DTESigner:
    """
    Maneja la firma digital de documentos XML para el SII.
    Implementa XMLDSig (simplificado) y generación de TED (Timbre Electrónico DTE).
    """
    
    def __init__(self, cert_path: str = None, password: str = None):
        self.cert_path = cert_path
        self.password = password
        self.private_key = None
        self.certificate = None
        
        if cert_path and os.path.exists(cert_path):
            self.load_certificate(cert_path, password)

    def load_certificate(self, pfx_path: str, password: str):
        """Carga el certificado digital (.p12 o .pfx)."""
        import os
        from cryptography.hazmat.backends import default_backend
        from cryptography.hazmat.primitives.serialization import pkcs12
        
        with open(pfx_path, "rb") as f:
            pfx_data = f.read()
            
        private_key, certificate, additional_certs = pkcs12.load_key_and_certificates(
            pfx_data, 
            password.encode() if password else None,
            default_backend()
        )
        self.private_key = private_key
        self.certificate = certificate

    def sign_xml(self, xml_string: str, reference_id: str) -> str:
        """
        Firma el documento XML usando el estándar XMLDSig requerido por el SII.
        """
        if not self.private_key or not self.certificate:
            raise Exception("Certificado no cargado.")
            
        parser = etree.XMLParser(remove_blank_text=True)
        root = etree.fromstring(xml_string.encode('ISO-8859-1'), parser)
        
        # 1. Obtener el nodo a firmar (Documento)
        documento = root.find(".//{http://www.sii.cl/SiiDte}Documento")
        if documento is None:
            raise Exception("No se encontró el nodo Documento para firmar.")
            
        # 2. Calcular DigestValue del Documento (Canonicalized)
        # El SII usa C14N (sin comentarios)
        c14n_doc = etree.tostring(documento, method="c14n", exclusive=False, with_comments=False)
        digest_value = base64.b64encode(hashlib.sha1(c14n_doc).digest()).decode()
        
        # 3. Construir nodo SignedInfo
        # (Esto es una simplificación, en producción se debe ser muy estricto con los namespaces)
        signed_info = f"""<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
    <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" />
    <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1" />
    <Reference URI="#{reference_id}">
        <Transforms>
            <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />
        </Transforms>
        <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1" />
        <DigestValue>{digest_value}</DigestValue>
    </Reference>
</SignedInfo>"""
        
        # 4. Calcular SignatureValue del SignedInfo (Canonicalized)
        signed_info_elem = etree.fromstring(signed_info)
        c14n_signed_info = etree.tostring(signed_info_elem, method="c14n", exclusive=False, with_comments=False)
        
        signature = self.private_key.sign(
            c14n_signed_info,
            padding.PKCS1v15(),
            hashes.SHA1()
        )
        signature_value = base64.b64encode(signature).decode()
        
        # 5. Obtener X509Certificate (base64)
        cert_b64 = base64.b64encode(
            self.certificate.public_bytes(serialization.Encoding.DER)
        ).decode()
        
        # 6. Ensamblar nodo Signature completo
        signature_xml = f"""<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    {signed_info}
    <SignatureValue>{signature_value}</SignatureValue>
    <KeyInfo>
        <KeyValue>
            <RSAKeyValue>
                <Modulus>{self._get_modulus_b64()}</Modulus>
                <Exponent>{self._get_exponent_b64()}</Exponent>
            </RSAKeyValue>
        </KeyValue>
        <X509Data>
            <X509Certificate>{cert_b64}</X509Certificate>
        </X509Data>
    </KeyInfo>
</Signature>"""
        
        # Insertar Signature en el root (después de Documento)
        signature_elem = etree.fromstring(signature_xml)
        root.append(signature_elem)
        
        return etree.tostring(root, encoding='ISO-8859-1', xml_declaration=True).decode('ISO-8859-1')

    def _get_modulus_b64(self) -> str:
        public_key = self.private_key.public_key()
        numbers = public_key.public_numbers()
        modulus = numbers.n
        # Convertir int a bytes
        modulus_bytes = modulus.to_bytes((modulus.bit_length() + 7) // 8, byteorder='big')
        return base64.b64encode(modulus_bytes).decode()

    def _get_exponent_b64(self) -> str:
        public_key = self.private_key.public_key()
        numbers = public_key.public_numbers()
        exponent = numbers.e
        exponent_bytes = exponent.to_bytes((exponent.bit_length() + 7) // 8, byteorder='big')
        return base64.b64encode(exponent_bytes).decode()
