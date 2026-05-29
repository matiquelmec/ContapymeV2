import datetime
from typing import Dict, List, Any

class DTEXMLBuilder:
    """
    Construye el XML para Documentos Tributarios Electrónicos (DTE) 
    siguiendo el esquema del SII (Servicio de Impuestos Internos de Chile).
    """
    
    def __init__(self, company_data: Dict[str, Any]):
        self.company = company_data

    @staticmethod
    def clean_xml_text(val: Any) -> str:
        """
        Limpia el texto reemplazando acentos, eñes y caracteres especiales,
        dejando únicamente caracteres ASCII compatibles para evitar el error CHR-00001 del SII.
        """
        if val is None:
            return ""
        text = str(val)
        replacements = {
            'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
            'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
            'ñ': 'n', 'Ñ': 'N', 'ü': 'u', 'Ü': 'U',
            '´': '', '`': '', '’': "'", '‘': "'",
            'í': 'i', 'ó': 'o' # Caso de reemplazo directo de caracteres latinos
        }
        for orig, rep in replacements.items():
            text = text.replace(orig, rep)
        # Filtrar caracteres que no sean ASCII básicos imprimibles
        text = "".join(c if ord(c) < 128 else " " for c in text)
        # Reemplazar múltiples espacios y limpiar extremos
        return " ".join(text.split())
        
    def build_dte_xml(self, dte_data: Dict[str, Any], items: List[Dict[str, Any]], ted_xml: str = "", referencias: List[Dict[str, Any]] = None) -> str:
        """
        Construye el XML base para un DTE, incluyendo el TED y referencias opcionales.
        """
        tipo_dte = dte_data.get("tipo_dte")
        folio = dte_data.get("folio")
        fecha = dte_data.get("fecha_emision") or datetime.date.today().isoformat()
        
        # Construir referencias
        referencias_xml = ""
        if referencias:
            for i, ref in enumerate(referencias, 1):
                razon = ref.get("razon", "Corrige Documento")
                razon_recortada = self.clean_xml_text(razon)[:90]
                referencias_xml += f"""
        <Referencia>
            <NroLinRef>{i}</NroLinRef>
            <TpoDocRef>{ref['tipo_doc']}</TpoDocRef>
            <FolioRef>{ref['folio']}</FolioRef>
            <FchRef>{ref['fecha']}</FchRef>
            <CodRef>{ref['cod_ref']}</CodRef>
            <Razon>{razon_recortada}</Razon>
        </Referencia>"""

        tmst_firma = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
        tmst_firma_xml = f"\n        <TmstFirma>{tmst_firma}</TmstFirma>"

        schema_file = "DTE_v10.xsd"
        xml = f"""<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE version="1.0" xmlns="http://www.sii.cl/SiiDte" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sii.cl/SiiDte {schema_file}">
    <Documento ID="DTE_{tipo_dte}_{folio}">
        <Encabezado>
            <IdDoc>
                <TipoDTE>{tipo_dte}</TipoDTE>
                <Folio>{folio}</Folio>
                <FchEmis>{fecha}</FchEmis>{f"\n                <IndServicio>3</IndServicio>" if str(tipo_dte) in ['39', '41'] else ""}
            </IdDoc>
            <Emisor>
                <RUTEmisor>{self.company['rut']}</RUTEmisor>
                {f"<RznSocEmisor>{self.clean_xml_text(self.company['razon_social'])}</RznSocEmisor>" if str(tipo_dte) in ['39', '41'] else f"<RznSoc>{self.clean_xml_text(self.company['razon_social'])}</RznSoc>"}
                {f"<GiroEmisor>{self.clean_xml_text(self.company['giro'])}</GiroEmisor>" if str(tipo_dte) in ['39', '41'] else f"<GiroEmis>{self.clean_xml_text(self.company['giro'])}</GiroEmis>"}
                {"" if str(tipo_dte) in ['39', '41'] else f"<Acteco>{self.company['acteco']}</Acteco>"}
                <DirOrigen>{self.clean_xml_text(self.company['direccion'])}</DirOrigen>
                <CmnaOrigen>{self.clean_xml_text(self.company['comuna'])}</CmnaOrigen>
                <CiudadOrigen>{self.clean_xml_text(self.company['ciudad'])}</CiudadOrigen>
            </Emisor>
            <Receptor>
                <RUTRecep>{dte_data['receptor_rut']}</RUTRecep>
                <RznSocRecep>{self.clean_xml_text(dte_data['receptor_razon_social'])}</RznSocRecep>
                {"" if str(tipo_dte) in ['39', '41'] else f"<GiroRecep>{self.clean_xml_text(dte_data.get('receptor_giro', 'PARTICULAR'))}</GiroRecep>"}
                <DirRecep>{self.clean_xml_text(dte_data.get('receptor_direccion', 'CIUDAD'))}</DirRecep>
                <CmnaRecep>{self.clean_xml_text(dte_data.get('receptor_comuna', 'CIUDAD'))}</CmnaRecep>
                <CiudadRecep>{self.clean_xml_text(dte_data.get('receptor_ciudad', 'CIUDAD'))}</CiudadRecep>
            </Receptor>
            <Totales>
                {"" if str(tipo_dte) in ['39', '41'] else f"<MntNeto>{dte_data['monto_neto']}</MntNeto>"}
                {"" if str(tipo_dte) in ['39', '41'] else f"<TasaIVA>{dte_data['tasa_iva']}</TasaIVA>"}
                {"" if str(tipo_dte) in ['39', '41'] else f"<IVA>{dte_data['monto_iva']}</IVA>"}
                <MntTotal>{dte_data['monto_total']}</MntTotal>
            </Totales>
        </Encabezado>
        {self._build_items_xml(items)}{referencias_xml}{ted_xml}{tmst_firma_xml}
    </Documento>
</DTE>"""
        return xml

    def build_ted_xml(self, dte_data: Dict[str, Any], item_name: str, caf_xml: str, signature_b64: str, tstamp: str = None) -> str:
        """
        Construye el bloque XML del Timbre Electrónico DTE (TED).
        """
        if not tstamp:
            tstamp = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
            
        rut_emisor = self.company['rut']
        tipo_dte = dte_data['tipo_dte']
        folio = dte_data['folio']
        fecha_emision = dte_data['fecha_emision']
        rut_receptor = dte_data['receptor_rut']
        razon_social_receptor = self.clean_xml_text(dte_data['receptor_razon_social'])[:40]
        monto_total = dte_data['monto_total']
        item_name_40 = self.clean_xml_text(item_name)[:40]
        
        # Limpiar el XML del CAF (extraer únicamente el nodo <CAF> omitiendo envoltorios de llaves privadas)
        from lxml import etree
        caf_xml_clean = caf_xml.strip()
        try:
            parser = etree.XMLParser(remove_blank_text=True)
            root = etree.fromstring(caf_xml.encode('utf-8'), parser)
            caf_node = root.find(".//CAF")
            if caf_node is not None:
                caf_xml_clean = etree.tostring(caf_node, encoding='ISO-8859-1', xml_declaration=False).decode('ISO-8859-1')
        except Exception as parse_err:
            print(f"Advertencia: No se pudo extraer el nodo CAF con lxml: {parse_err}. Usando fallback.")
            if caf_xml_clean.startswith("<?xml"):
                decl_end = caf_xml_clean.find("?>")
                if decl_end != -1:
                    caf_xml_clean = caf_xml_clean[decl_end + 2:].strip()

        # Construir el bloque DD
        # NOTA: La sangría debe ser limpia para evitar que rompa la estructura
        dd_xml = f"""<DD>
<RE>{rut_emisor}</RE>
<TD>{tipo_dte}</TD>
<F>{folio}</F>
<FE>{fecha_emision}</FE>
<RR>{rut_receptor}</RR>
<RSR>{razon_social_receptor}</RSR>
<MNT>{monto_total}</MNT>
<IT1>{item_name_40}</IT1>
{caf_xml_clean}
<TSTED>{tstamp}</TSTED>
</DD>"""

        # Retornar el bloque completo TED
        ted_xml = f"""
        <TED version="1.0">
            {dd_xml}
            <FRMT algoritmo="SHA1withRSA">{signature_b64}</FRMT>
        </TED>"""
        return ted_xml

    def build_envio_dte(self, signed_dte_xml: str, dte_data: Dict[str, Any]) -> str:
        """
        Envuelve uno o más DTEs firmados en un EnvioDTE o EnvioBOLETA para ser enviado al SII.
        """
        fecha_resolucion = self.company.get('resolucion_fecha') or '2014-08-22'
        nro_resolucion = self.company.get('resolucion_numero') or 0
        
        envio_id = f"SetDoc_{dte_data.get('folio', 1)}"
        
        if isinstance(signed_dte_xml, str) and signed_dte_xml.strip().startswith("<?xml"):
            decl_end = signed_dte_xml.find("?>")
            if decl_end != -1:
                signed_dte_xml = signed_dte_xml[decl_end + 2:].strip()
                
        tipo_dte = int(dte_data.get('tipo_dte', 33))
        is_boleta = tipo_dte in [39, 41]
        
        root_tag = "EnvioBOLETA" if is_boleta else "EnvioDTE"
        schema_xsd = "EnvioBOLETA_v11.xsd" if is_boleta else "EnvioDTE_v10.xsd"
        
        envio_xml = f"""<?xml version="1.0" encoding="ISO-8859-1"?>
<{root_tag} xmlns="http://www.sii.cl/SiiDte" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sii.cl/SiiDte {schema_xsd}" version="1.0">
    <SetDTE ID="{envio_id}">
        <Caratula version="1.0">
            <RutEmisor>{self.company['rut']}</RutEmisor>
            <RutEnvia>{self.company['rut']}</RutEnvia>
            <RutReceptor>{dte_data['receptor_rut']}</RutReceptor>
            <FchResol>{fecha_resolucion}</FchResol>
            <NroResol>{nro_resolucion}</NroResol>
            <TmstFirmaEnv>{datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')}</TmstFirmaEnv>
            <SubTotDTE>
                <TpoDTE>{tipo_dte}</TpoDTE>
                <NroDTE>1</NroDTE>
            </SubTotDTE>
        </Caratula>
        {signed_dte_xml}
    </SetDTE>
</{root_tag}>"""
        return envio_xml

    def _build_items_xml(self, items: List[Dict[str, Any]]) -> str:
        items_xml = ""
        for i, item in enumerate(items, 1):
            items_xml += f"""
        <Detalle>
            <NroLinDet>{i}</NroLinDet>
            <NmbItem>{self.clean_xml_text(item['product_name'])}</NmbItem>
            <QtyItem>{item['quantity']}</QtyItem>
            <PrcItem>{item['unit_price']}</PrcItem>
            <MontoItem>{item['total_amount']}</MontoItem>
        </Detalle>"""
        return items_xml
