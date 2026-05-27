import xml.etree.ElementTree as ET
from typing import Dict, Any, Optional

class CAFManager:
    """
    Gestiona la carga y validación de archivos CAF (Código de Autorización de Folios).
    """
    
    @staticmethod
    def parse_caf_xml(xml_content: str) -> Dict[str, Any]:
        """Extrae la información esencial de un XML de CAF."""
        try:
            # Eliminar posibles espacios en blanco al inicio
            xml_content = xml_content.strip()
            tree = ET.fromstring(xml_content)
            
            # El CAF está dentro de <AUTORIZACION><CAF><DA>
            da = tree.find(".//DA")
            if da is None:
                raise Exception("Formato de CAF inválido: No se encontró el nodo <DA>")
            
            info = {
                "rut_emisor": da.find("RE").text if da.find("RE") is not None else None,
                "tipo_dte": int(da.find("TD").text) if da.find("TD") is not None else None,
                "range_start": int(da.find("RNG/D").text) if da.find("RNG/D") is not None else None,
                "range_end": int(da.find("RNG/H").text) if da.find("RNG/H") is not None else None,
                "authorized_at": da.find("FA").text if da.find("FA") is not None else None
            }
            return info
        except Exception as e:
            raise Exception(f"Error parseando CAF: {str(e)}")

    @staticmethod
    def get_private_key_from_caf(xml_content: str) -> Optional[str]:
        """
        Extrae la llave privada (RSASK) del CAF y la reconstruye en formato PEM.
        Soporta tanto PEM plano (estándar oficial del SII) como formato de subnodos de pruebas.
        """
        import base64
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization

        try:
            # Eliminar posibles espacios en blanco al inicio
            xml_content = xml_content.strip()
            tree = ET.fromstring(xml_content.encode('utf-8'))
            
            # Buscar el nodo RSASK (llave privada)
            rsask_node = tree.find(".//RSASK")
            if rsask_node is None:
                return None
                
            # Caso 1: El nodo contiene directamente el bloque PEM plano (estándar del SII y de SistemaOC)
            if rsask_node.text and "-----BEGIN RSA PRIVATE KEY-----" in rsask_node.text:
                return rsask_node.text.strip()
                
            # Caso 2: El nodo contiene subnodos <S>, <p>, <q> (ambiente de desarrollo / mocks antiguos)
            rsapk_node = tree.find(".//RSAPK")
            if rsapk_node is None:
                return None
                
            s_val = rsask_node.find("S").text.strip() if rsask_node.find("S") is not None else None
            p_val = rsask_node.find("p").text.strip() if rsask_node.find("p") is not None else None
            q_val = rsask_node.find("q").text.strip() if rsask_node.find("q") is not None else None
            m_val = rsapk_node.find("M").text.strip() if rsapk_node.find("M") is not None else None
            e_val = rsapk_node.find("E").text.strip() if rsapk_node.find("E") is not None else None
            
            if not all([s_val, p_val, q_val, m_val, e_val]):
                return None
                
            # Función auxiliar para convertir Base64 a entero
            def b64_to_int(b64_str: str) -> int:
                clean_str = b64_str.replace('\n', '').replace('\r', '').strip()
                missing_padding = len(clean_str) % 4
                if missing_padding:
                    clean_str += '=' * (4 - missing_padding)
                decoded_bytes = base64.b64decode(clean_str)
                return int.from_bytes(decoded_bytes, byteorder='big')
                
            d = b64_to_int(s_val)
            p = b64_to_int(p_val)
            q = b64_to_int(q_val)
            n = b64_to_int(m_val)
            e = b64_to_int(e_val)
            
            # Calcular parámetros faltantes para RSAPrivateNumbers
            dmp1 = d % (p - 1)
            dmq1 = d % (q - 1)
            iqmp = pow(q, -1, p)
            
            # Construir clave privada RSA
            public_numbers = rsa.RSAPublicNumbers(e, n)
            private_numbers = rsa.RSAPrivateNumbers(
                p=p,
                q=q,
                d=d,
                dmp1=dmp1,
                dmq1=dmq1,
                iqmp=iqmp,
                public_numbers=public_numbers
            )
            private_key = private_key = private_numbers.private_key()
            
            # Exportar a formato PEM
            pem_bytes = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption()
            )
            return pem_bytes.decode('utf-8')
        except Exception as e:
            print(f"Error extrayendo clave privada del CAF: {str(e)}")
            return None
