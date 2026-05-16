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
        """Extrae la llave privada (RSAPK) del CAF para firmar el timbre."""
        try:
            tree = ET.fromstring(xml_content)
            rsapk = tree.find(".//RSAPK")
            if rsapk is not None:
                return ET.tostring(rsapk, encoding='unicode')
            return None
        except:
            return None
