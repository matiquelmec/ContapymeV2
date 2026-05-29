import httpx
from lxml import etree
import logging
from typing import Dict, Any, Optional
import asyncio

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
            self.ws_send = "https://maullin.sii.cl/cgi_dte/UPL/DTEUpload"
            self.ws_query = "https://maullin.sii.cl/DTEWS/QueryEstDte.jws"
            self.ws_track = "https://maullin.sii.cl/DTEWS/QueryEstUp.jws"
        else:
            self.ws_auth = "https://palena.sii.cl/DTEWS"
            self.ws_send = "https://palena.sii.cl/cgi_dte/UPL/DTEUpload"
            self.ws_query = "https://palena.sii.cl/DTEWS/QueryEstDte.jws"
            self.ws_track = "https://palena.sii.cl/DTEWS/QueryEstUp.jws"

    def _get_client(self, timeout: float = 60.0) -> httpx.AsyncClient:
        """
        Crea un AsyncClient configurado para tolerar los protocolos SSL/TLS antiguos del SII.
        """
        import ssl
        # Forzar protocolo TLSv1.2 estricto para asegurar compatibilidad de negociación con el SII
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        ctx.minimum_version = ssl.TLSVersion.TLSv1_2
        ctx.maximum_version = ssl.TLSVersion.TLSv1_2
        # Ciphers compatibles que el proxy del SII acepta sin desconectar el socket
        ctx.set_ciphers('DEFAULT:!DH:!aNULL:!eNULL:!LOW:!EXP:!MD5:!3DES:!RC4:!SEED')
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE  # En ambiente SII de producción/certificación a menudo hay problemas de certificados intermedios
        
        transport = httpx.AsyncHTTPTransport(verify=ctx)
        return httpx.AsyncClient(transport=transport, timeout=timeout, follow_redirects=True)

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
                        "SOAPAction": "",
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
                        # Usar xpath con local-name para buscar ignorando namespaces
                        estado_nodes = inner_xml.xpath("//*[local-name()='ESTADO']")
                        if not estado_nodes:
                            raise Exception("No se encontró el nodo ESTADO en la respuesta de semilla.")
                        estado = estado_nodes[0].text
                        
                        if estado != "00":
                            raise Exception(f"Estado de semilla inválido: {estado}")
                            
                        semilla_nodes = inner_xml.xpath("//*[local-name()='SEMILLA']")
                        if not semilla_nodes or not semilla_nodes[0].text:
                            raise Exception("No se encontró el nodo SEMILLA en la respuesta de semilla.")
                            
                        return semilla_nodes[0].text
                        
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
        from xml.sax.saxutils import escape
        escaped_seed_xml = escape(signed_seed_xml)
        
        url = f"{self.ws_auth}/GetTokenFromSeed.jws"
        soap_body = f"""<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
    <SOAP-ENV:Body>
        <ns1:getToken xmlns:ns1="http://DefaultNamespace">
            <pszXml>{escaped_seed_xml}</pszXml>
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
                        "SOAPAction": "",
                        "User-Agent": "Mozilla/4.0 (compatible; PROG 1.0; Windows NT 5.0; YComp 5.0.2.4)"
                    }
                    resp = await client.post(url, content=soap_body, headers=headers)
                    if resp.status_code != 200:
                        raise Exception(f"Fallo al obtener Token: HTTP {resp.status_code}")
                        
                    root = etree.fromstring(resp.content)
                    return_nodes = root.xpath("//*[local-name()='getTokenReturn']")
                    if not return_nodes or not return_nodes[0].text:
                        raise Exception("No se encontró el nodo getTokenReturn en la respuesta del SII.")
                        
                    return_node = return_nodes[0]
                    inner_xml = etree.fromstring(return_node.text.encode('utf-8'))
                    
                    estado_nodes = inner_xml.xpath("//*[local-name()='ESTADO']")
                    if not estado_nodes or not estado_nodes[0].text:
                        raise Exception("No se encontró el nodo ESTADO en la respuesta del token.")
                    estado = estado_nodes[0].text
                    
                    if estado != "00":
                        raise Exception(f"Error al canjear Token: {estado}")
                        
                    token_nodes = inner_xml.xpath("//*[local-name()='TOKEN']")
                    if not token_nodes or not token_nodes[0].text:
                        raise Exception("No se encontró el nodo TOKEN en la respuesta del token.")
                    return token_nodes[0].text
            except Exception as e:
                logger.warning(f"Intento {attempt + 1} fallido al obtener token: {str(e)}")
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(delay)
                delay *= 2

    async def send_dte(self, token: str, dte_xml: str, rut_emisor: str, rut_empresa: str) -> Dict[str, Any]:
        """
        Paso 4: Envía el archivo DTE firmado mediante POST multipart al SII.
        Retorna el Track ID. Incluye reintentos con backoff exponencial.
        Maneja STATUS 0 (éxito), STATUS 7 (encoding), STATUS 99 (ya enviado).
        """
        import re

        # Seleccionar endpoint según si es Boleta (EnvioBOLETA) o Factura estándar (EnvioDTE)
        is_boleta = "<EnvioBOLETA" in dte_xml
        if self.environment == "certification":
            # En certificación el SII usa el mismo servidor maullin para todo
            url_send = "https://maullin.sii.cl/cgi_dte/UPL/DTEUpload"
        else:
            # En producción sí están separados
            url_send = "https://boletasg.sii.cl/cgi_dte/UPL/DTEUpload" if is_boleta else "https://palena.sii.cl/cgi_dte/UPL/DTEUpload"

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

        # Codificar el XML a ISO-8859-1 (requerido por el SII)
        try:
            xml_bytes = dte_xml.encode('iso-8859-1')
        except UnicodeEncodeError:
            # Limpiar caracteres no-ISO-8859-1 reemplazándolos por su equivalente ASCII
            xml_bytes = dte_xml.encode('iso-8859-1', errors='replace')
            logger.warning("Se reemplazaron caracteres no compatibles con ISO-8859-1 en el XML del DTE.")

        data = {
            "rutSender": emisor_rut_body,
            "dvSender": emisor_dv,
            "rutCompany": empresa_rut_body,
            "dvCompany": empresa_dv
        }
        files = {
            "archivo": ("envio.xml", xml_bytes, "text/xml")
        }

        max_retries = 5
        delay = 3
        for attempt in range(max_retries):
            try:
                async with self._get_client(timeout=90.0) as client:
                    resp = await client.post(url_send, data=data, files=files, headers=headers)
                    
                    if resp.status_code != 200:
                        raise Exception(f"Error al enviar DTE: HTTP {resp.status_code}")

                    # Parsear la respuesta XML del SII
                    root = etree.fromstring(resp.content)
                    status_node = root.find(".//STATUS")
                    status = status_node.text if status_node is not None else None

                    if status is None:
                        raise Exception(f"Respuesta sin STATUS del SII: {resp.text}")

                    # STATUS 0: Envío exitoso, extraer TrackID
                    if status == "0":
                        track_id_node = root.find(".//TRACKID")
                        track_id = track_id_node.text if track_id_node is not None else None
                        if not track_id:
                            raise Exception("SII aceptó el envío pero no retornó TrackID.")
                        logger.info(f"DTE enviado exitosamente al SII. TrackID: {track_id}")
                        return {"success": True, "track_id": track_id}

                    # STATUS 99: Documento ya fue enviado previamente, extraer TrackID del mensaje
                    if status == "99":
                        error_node = root.find(".//ERROR")
                        error_text = error_node.text if error_node is not None else ""
                        logger.info(f"SII STATUS 99: {error_text}")
                        # Extraer TrackID del mensaje: "...con Trackid 249904842..."
                        match = re.search(r'Trackid\s+(\d+)', error_text, re.IGNORECASE)
                        if match:
                            existing_track_id = match.group(1)
                            logger.info(f"DTE ya fue enviado previamente. TrackID existente: {existing_track_id}")
                            return {"success": True, "track_id": existing_track_id, "already_sent": True}
                        # Si no se puede extraer el TrackID, es un error fatal (no reintentar)
                        raise Exception(f"SII STATUS 99 sin TrackID extraíble: {error_text}")

                    # STATUS 7: Error de Character Set - error fatal, no reintentar
                    if status == "7":
                        error_node = root.find(".//ERROR")
                        error_text = error_node.text if error_node is not None else "Invalid Character Set"
                        raise Exception(f"SII Error de Encoding (STATUS 7): {error_text}")

                    # Cualquier otro STATUS: error del SII
                    error_node = root.find(".//ERROR")
                    error_text = error_node.text if error_node is not None else f"Status desconocido: {status}"
                    raise Exception(f"SII rechazó el envío (STATUS {status}): {error_text}")

            except Exception as e:
                error_msg = str(e)
                logger.warning(f"Intento {attempt + 1} fallido al enviar DTE: {error_msg}")

                # No reintentar errores fatales (encoding o ya enviado sin TrackID)
                if "STATUS 7" in error_msg or "STATUS 99" in error_msg:
                    raise

                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(delay)
                delay *= 2

    async def query_track_id(self, token: str, rut_empresa: str, track_id: str) -> Dict[str, Any]:
        """
        Consulta el estado de un envío (Track ID) en el SII.
        Retorna el estado de aceptación (EPR, Aceptado, Rechazado, etc).
        Incluye reintentos con backoff exponencial.
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

        max_retries = 3
        delay = 2
        for attempt in range(max_retries):
            try:
                async with self._get_client() as client:
                    headers = {
                        "Content-Type": "text/xml",
                        "SOAPAction": ""
                    }
                    resp = await client.post(self.ws_track, content=soap_body, headers=headers)
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
            except Exception as e:
                logger.warning(f"Intento {attempt + 1} fallido al consultar Track ID: {str(e)}")
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(delay)
                delay *= 2
