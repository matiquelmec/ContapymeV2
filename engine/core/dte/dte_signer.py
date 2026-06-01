import os
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
        self._assert_certificate_validity()

    def _assert_certificate_validity(self):
        """Valida que el certificado esté vigente.

        Un certificado vencido/aún-no-válido es la causa #1 de que el SII
        responda 'estado 10 Error Interno' al canjear el token, sin indicar
        el motivo real. Aquí lo convertimos en un error claro y accionable.
        """
        from datetime import datetime, timezone
        cert = self.certificate
        try:
            # cryptography >= 42 (tz-aware)
            not_after = cert.not_valid_after_utc
            not_before = cert.not_valid_before_utc
            now = datetime.now(timezone.utc)
        except AttributeError:
            # Versiones antiguas (naive UTC)
            not_after = cert.not_valid_after
            not_before = cert.not_valid_before
            now = datetime.utcnow()

        if now > not_after:
            raise Exception(
                f"Certificado digital VENCIDO el {not_after:%d-%m-%Y}. "
                f"El SII rechazará la autenticación (estado 10). "
                f"Renueve el certificado en su proveedor (e-CertChile, Acepta, etc.) y vuelva a cargarlo en Configuración de Empresa > Facturación."
            )
        if now < not_before:
            raise Exception(
                f"El certificado digital aún no es válido (vigente desde {not_before:%d-%m-%Y}). Verifique la fecha del sistema o el certificado cargado."
            )

    def sign_xml(self, xml_string: str, reference_id: str) -> str:
        """Firma el documento XML (DTE)."""
        parser = etree.XMLParser(remove_blank_text=True)
        root = etree.fromstring(xml_string.encode('ISO-8859-1'), parser)
        return self._sign_node(root, ".//{http://www.sii.cl/SiiDte}Documento", reference_id, pretty_print=False)
        
    def sign_seed(self, seed: str) -> str:
        """Firma la semilla (getToken) para token SOAP/REST del SII."""
        xml_string = f"<getToken><item><Semilla>{seed}</Semilla></item></getToken>"
        parser = etree.XMLParser(remove_blank_text=True)
        root = etree.fromstring(xml_string.encode("utf-8"), parser)
        return self._sign_node(
            root,
            ".",
            "",
            pretty_print=False,
            output_encoding="utf-8",
            include_legacy_certificate_tag=True,
            use_ds_prefix=True,
        )
        
    def sign_envio(self, envio_xml: str, set_dte_id: str) -> str:
        """Firma el EnvioDTE (SetDTE)"""
        parser = etree.XMLParser(remove_blank_text=True)
        root = etree.fromstring(envio_xml.encode('ISO-8859-1'), parser)
        return self._sign_node(root, ".//{http://www.sii.cl/SiiDte}SetDTE", set_dte_id, pretty_print=False)

    def _sign_node(
        self,
        root: etree._Element,
        node_xpath: str,
        reference_id: str,
        pretty_print: bool = False,
        output_encoding: str = "ISO-8859-1",
        include_legacy_certificate_tag: bool = False,
        use_ds_prefix: bool = False,
    ) -> str:
        if not self.private_key or not self.certificate:
            raise Exception("Certificado no cargado.")
            
        if node_xpath == ".":
            node_to_sign = root
        else:
            node_to_sign = root.find(node_xpath)
            
        if node_to_sign is None:
            raise Exception(f"No se encontró el nodo {node_xpath} para firmar.")
            
        c14n_doc = etree.tostring(node_to_sign, method="c14n", exclusive=False, with_comments=False)
        digest_value = base64.b64encode(hashlib.sha1(c14n_doc).digest()).decode()
        
        uri_str = f' URI="#{reference_id}"' if reference_id else ' URI=""'
        
        if use_ds_prefix:
            signed_info = f"""<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" />
    <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1" />
    <ds:Reference{uri_str}>
        <ds:Transforms>
            <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />
        </ds:Transforms>
        <ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1" />
        <ds:DigestValue>{digest_value}</ds:DigestValue>
    </ds:Reference>
</ds:SignedInfo>"""
        else:
            signed_info = f"""<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
    <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" />
    <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1" />
    <Reference{uri_str}>
        <Transforms>
            <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />
        </Transforms>
        <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1" />
        <DigestValue>{digest_value}</DigestValue>
    </Reference>
</SignedInfo>"""
        
        cert_b64 = base64.b64encode(
            self.certificate.public_bytes(serialization.Encoding.DER)
        ).decode()
        
        # Compatibilidad legacy SII boleta token: getCertificado busca <Certificate> sin namespace.
        extra_cert_tag = f"<Certificate xmlns=\"\">{cert_b64}</Certificate>" if include_legacy_certificate_tag else ""
        keyinfo_cert_tag = f"<Certificate xmlns=\"\">{cert_b64}</Certificate>" if include_legacy_certificate_tag else ""

        if use_ds_prefix:
            signature_xml = f"""<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    {signed_info}
    <ds:SignatureValue></ds:SignatureValue>
    <ds:KeyInfo>
        {keyinfo_cert_tag}
        <ds:KeyValue>
            <ds:RSAKeyValue>
                <ds:Modulus>{self._get_modulus_b64()}</ds:Modulus>
                <ds:Exponent>{self._get_exponent_b64()}</ds:Exponent>
            </ds:RSAKeyValue>
        </ds:KeyValue>
        <ds:X509Data>
            <ds:X509Certificate>{cert_b64}</ds:X509Certificate>
            {extra_cert_tag}
        </ds:X509Data>
    </ds:KeyInfo>
</ds:Signature>"""
        else:
            signature_xml = f"""<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    {signed_info}
    <SignatureValue></SignatureValue>
    <KeyInfo>
        {keyinfo_cert_tag}
        <KeyValue>
            <RSAKeyValue>
                <Modulus>{self._get_modulus_b64()}</Modulus>
                <Exponent>{self._get_exponent_b64()}</Exponent>
            </RSAKeyValue>
        </KeyValue>
        <X509Data>
            <X509Certificate>{cert_b64}</X509Certificate>
            {extra_cert_tag}
        </X509Data>
    </KeyInfo>
</Signature>"""
        
        signature_elem = etree.fromstring(signature_xml)
        root.append(signature_elem)

        signed_info_elem = signature_elem.find("{http://www.w3.org/2000/09/xmldsig#}SignedInfo")
        signature_value_elem = signature_elem.find("{http://www.w3.org/2000/09/xmldsig#}SignatureValue")
        c14n_signed_info = etree.tostring(signed_info_elem, method="c14n", exclusive=False, with_comments=False)

        signature = self.private_key.sign(
            c14n_signed_info,
            padding.PKCS1v15(),
            hashes.SHA1()
        )
        signature_value_elem.text = base64.b64encode(signature).decode()
        
        xml_str = etree.tostring(
            root,
            encoding=output_encoding,
            xml_declaration=True,
            pretty_print=pretty_print,
        ).decode(output_encoding)
        if xml_str.startswith("<?xml version='1.0'"):
            decl_old = f"<?xml version='1.0' encoding='{output_encoding}'?>"
            decl_new = f'<?xml version="1.0" encoding="{output_encoding}"?>'
            xml_str = xml_str.replace(decl_old, decl_new, 1)
        return xml_str

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

    def sign_ted(self, dd_xml_str: str, rsask_pem: str) -> str:
        """
        Firma el bloque <DD> del Timbre Electrónico DTE (TED) usando la clave privada del CAF.
        """
        from cryptography.hazmat.primitives.serialization import load_pem_private_key
        from cryptography.hazmat.backends import default_backend
        
        try:
            private_key = load_pem_private_key(
                rsask_pem.encode('utf-8'), 
                password=None, 
                backend=default_backend()
            )
            
            signature = private_key.sign(
                dd_xml_str.encode('ISO-8859-1'),
                padding.PKCS1v15(),
                hashes.SHA1()
            )
            return base64.b64encode(signature).decode('utf-8')
        except Exception as e:
            raise Exception(f"Error firmando el TED con la clave privada del CAF: {str(e)}")
