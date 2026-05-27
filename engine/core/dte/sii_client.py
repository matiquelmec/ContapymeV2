import httpx
from lxml import etree
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class SIIClient:
    """
    Cliente SOAP/REST Institucional para el Servicio de Impuestos Internos (SII).
    Maneja la autenticación mediante token (Seed) y el envío de documentos DTE.
    """
    
    def __init__(self, environment: str = "certification"):
        self.environment = environment
        
        # Endpoints según ambiente
        if environment == "certification":
            self.ws_auth = "https://maullin.sii.cl/DTEWS"
            self.ws_send = "https://maullin.sii.cl/cgi_dte/UPL/conectar.cgi"
            self.ws_query = "https://maullin.sii.cl/DTEWS/QueryEstDte.jws"
            self.ws_track = "https://maullin.sii.cl/DTEWS/QueryEstUp.jws"
        else:
            self.ws_auth = "https://palena.sii.cl/DTEWS"
            self.ws_send = "https://palena.sii.cl/cgi_dte/UPL/conectar.cgi"
            self.ws_query = "https://palena.sii.cl/DTEWS/QueryEstDte.jws"
            self.ws_track = "https://palena.sii.cl/DTEWS/QueryEstUp.jws"

    def _get_client(self) -> httpx.AsyncClient:
        """
        Crea un AsyncClient configurado para tolerar los protocolos SSL/TLS antiguos del SII.
        """
        import ssl
        ctx = ssl.create_default_context()
        # Permitir ciphers antiguas y TLS 1.0/1.1/1.2 si es necesario para compatibilidad SII
        ctx.set_ciphers('DEFAULT@SECLEVEL=1')
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE  # En ambiente SII de producción/certificación a menudo hay problemas de certificados intermedios
        
        return httpx.AsyncClient(verify=ctx, timeout=30.0)

    async def get_seed(self) -> str:
        """
        Paso 1: Obtiene la semilla desde CrSeed.jws con reintentos automáticos en caso de HTTP 500.
        """
        url = f"{self.ws_auth}/CrSeed.jws"
        soap_body = """<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
    <SOAP-ENV:Body>
        <ns1:getSeed xmlns:ns1="http://DefaultNamespace"></ns1:getSeed>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>"""
        
        import asyncio
        max_retries = 3
        delay = 1.0
        
        for attempt in range(max_retries):
            try:
                async with self._get_client() as client:
                    headers = {
                        "Content-Type": "text/xml",
                        "User-Agent": "Mozilla/4.0 (compatible; PROG 1.0; Windows NT 5.0; YComp 5.0.2.4)"
                    }
                    resp = await client.post(url, content=soap_body, headers=headers)
                    if resp.status_code != 200:
                        raise Exception(f"Fallo al obtener Semilla: HTTP {resp.status_code}")
                        
                    root = etree.fromstring(resp.content)
                    ns = {"ns1": "http://DefaultNamespace"}
                    return_node = root.find(".//ns1:getSeedReturn", namespaces=ns)
                    
                    if return_node is None and root.find(".//getSeedReturn") is not None:
                        return_node = root.find(".//getSeedReturn")
                        
                    if return_node is not None and return_node.text:
                        inner_xml = etree.fromstring(return_node.text.encode('utf-8'))
                        estado = inner_xml.find("ESTADO").text
                        if estado != "00":
                            raise Exception(f"Estado de semilla inválido: {estado}")
                        return inner_xml.find("SEMILLA").text
                        
                    raise Exception("No se encontró la semilla en la respuesta del SII.")
            except Exception as e:
                logger.warning(f"Intento {attempt + 1} fallido al obtener semilla: {str(e)}")
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(delay)
                delay *= 2

    async def get_token(self, signed_seed_xml: str) -> str:
        """
        Paso 3: Obtiene el token usando el XML de la semilla firmada (GetTokenFromSeed.jws) con reintentos.
        """
        url = f"{self.ws_auth}/GetTokenFromSeed.jws"
        soap_body = f"""<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
    <SOAP-ENV:Body>
        <ns1:getToken xmlns:ns1="http://DefaultNamespace">
            <pszXml>{signed_seed_xml}</pszXml>
        </ns1:getToken>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>"""

        import asyncio
        max_retries = 3
        delay = 1.0

        for attempt in range(max_retries):
            try:
                async with self._get_client() as client:
                    headers = {
                        "Content-Type": "text/xml",
                        "User-Agent": "Mozilla/4.0 (compatible; PROG 1.0; Windows NT 5.0; YComp 5.0.2.4)"
                    }
                    resp = await client.post(url, content=soap_body, headers=headers)
                    if resp.status_code != 200:
                        raise Exception(f"Fallo al obtener Token: HTTP {resp.status_code}")
                        
                    root = etree.fromstring(resp.content)
                    return_node = root.find(".//getTokenReturn")
                    
                    if return_node is not None and return_node.text:
                        inner_xml = etree.fromstring(return_node.text.encode('utf-8'))
                        estado = inner_xml.find(".//ESTADO").text
                        if estado != "00":
                            raise Exception(f"Error al canjear Token: {estado}")
                        return inner_xml.find(".//TOKEN").text
                        
                    raise Exception("No se encontró el token en la respuesta del SII.")
            except Exception as e:
                logger.warning(f"Intento {attempt + 1} fallido al obtener token: {str(e)}")
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(delay)
                delay *= 2

    async def send_dte(self, token: str, dte_xml: str, rut_emisor: str, rut_empresa: str) -> Dict[str, Any]:
        """
        Paso 4: Envía el archivo DTE firmado mediante POST multipart al SII.
        Retorna el Track ID.
        """
        # Formatear RUTs quitando guión (ej: 11111111-1 -> 111111111 y el DV)
        emisor_rut_body = rut_emisor.split('-')[0]
        emisor_dv = rut_emisor.split('-')[1]
        
        empresa_rut_body = rut_empresa.split('-')[0]
        empresa_dv = rut_empresa.split('-')[1]

        headers = {
            "Accept": "image/gif, image/x-xbitmap, image/jpeg, image/pjpeg, application/vnd.ms-powerpoint, application/ms-excel, application/msword, */*",
            "Accept-Language": "es-cl",
            "Accept-Encoding": "gzip, deflate",
            "User-Agent": "Mozilla/4.0 (compatible; PROG 1.0; Windows NT 5.0; YComp 5.0.2.4)",
            "Cookie": f"TOKEN={token}",
            "Connection": "Keep-Alive",
            "Cache-Control": "no-cache"
        }
        
        files = {
            "rutSender": (None, emisor_rut_body),
            "dvSender": (None, emisor_dv),
            "rutCompany": (None, empresa_rut_body),
            "dvCompany": (None, empresa_dv),
            "archivo": ("envio.xml", dte_xml.encode('iso-8859-1'), "text/xml")
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(self.ws_send, files=files, headers=headers)
            
            if resp.status_code != 200:
                raise Exception(f"Error al enviar DTE: HTTP {resp.status_code}")
                
            try:
                root = etree.fromstring(resp.content)
                status = root.find(".//STATUS").text
                track_id = root.find(".//TRACKID").text
                
                if status != "0":
                    raise Exception(f"SII Rechazó el envío. Status: {status}")
                    
                return {"success": True, "track_id": track_id}
            except Exception as e:
                # Fallback si no parsea el XML de respuesta
                raise Exception(f"Respuesta no reconocida del SII: {resp.text}")

    async def query_track_id(self, token: str, rut_empresa: str, track_id: str) -> Dict[str, Any]:
        """
        Consulta el estado de un envío (Track ID) en el SII.
        Retorna el estado de aceptación (EPR, Aceptado, Rechazado, etc).
        """
        rut_body = rut_empresa.split('-')[0]
        dv = rut_empresa.split('-')[1]
        
        soap_body = f"""<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
    <SOAP-ENV:Body>
        <ns1:getEstUp xmlns:ns1="http://DefaultNamespace">
            <RutCompania>{rut_body}</RutCompania>
            <DvCompania>{dv}</DvCompania>
            <TrackId>{track_id}</TrackId>
            <Token>{token}</Token>
        </ns1:getEstUp>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>"""

        async with httpx.AsyncClient() as client:
            resp = await client.post(self.ws_track, content=soap_body, headers={"Content-Type": "text/xml"})
            if resp.status_code != 200:
                raise Exception(f"Fallo al consultar Track ID: HTTP {resp.status_code}")
                
            root = etree.fromstring(resp.content)
            return_node = root.find(".//getEstUpReturn")
            
            if return_node is not None and return_node.text:
                inner_xml = etree.fromstring(return_node.text.encode('utf-8'))
                estado = inner_xml.find(".//ESTADO")
                glosa = inner_xml.find(".//GLOSA")
                
                estado_text = estado.text if estado is not None else "DESC"
                glosa_text = glosa.text if glosa is not None else ""
                
                return {
                    "success": True,
                    "estado": estado_text,
                    "glosa": glosa_text,
                    "raw_xml": return_node.text
                }
                
            raise Exception("No se encontró respuesta válida al consultar Track ID.")
