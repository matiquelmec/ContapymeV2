import datetime
from typing import Dict, List, Any

class DTEXMLBuilder:
    """
    Construye el XML para Documentos Tributarios Electrónicos (DTE) 
    siguiendo el esquema del SII (Servicio de Impuestos Internos de Chile).
    """
    
    def __init__(self, company_data: Dict[str, Any]):
        self.company = company_data
        
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
                razon_recortada = razon[:90]
                referencias_xml += f"""
        <Referencia>
            <NroLinRef>{i}</NroLinRef>
            <TpoDocRef>{ref['tipo_doc']}</TpoDocRef>
            <FolioRef>{ref['folio']}</FolioRef>
            <FchRef>{ref['fecha']}</FchRef>
            <CodRef>{ref['cod_ref']}</CodRef>
            <Razon>{razon_recortada}</Razon>
        </Referencia>"""

        xml = f"""<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE version="1.0" xmlns="http://www.sii.cl/SiiDte" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sii.cl/SiiDte DTE_v10.xsd">
    <Documento ID="DTE_{tipo_dte}_{folio}">
        <Encabezado>
            <IdDoc>
                <TipoDTE>{tipo_dte}</TipoDTE>
                <Folio>{folio}</Folio>
                <FchEmis>{fecha}</FchEmis>
            </IdDoc>
            <Emisor>
                <RUTEmisor>{self.company['rut']}</RUTEmisor>
                <RznSoc>{self.company['razon_social']}</RznSoc>
                <GiroEmis>{self.company['giro']}</GiroEmis>
                <Acteco>{self.company['acteco']}</Acteco>
                <DirOrigen>{self.company['direccion']}</DirOrigen>
                <CmnaOrigen>{self.company['comuna']}</CmnaOrigen>
                <CiudadOrigen>{self.company['ciudad']}</CiudadOrigen>
            </Emisor>
            <Receptor>
                <RUTRecep>{dte_data['receptor_rut']}</RUTRecep>
                <RznSocRecep>{dte_data['receptor_razon_social']}</RznSocRecep>
                <GiroRecep>{dte_data.get('receptor_giro', 'PARTICULAR')}</GiroRecep>
                <DirRecep>{dte_data.get('receptor_direccion', 'CIUDAD')}</DirRecep>
                <CmnaRecep>{dte_data.get('receptor_comuna', 'CIUDAD')}</CmnaRecep>
                <CiudadRecep>{dte_data.get('receptor_ciudad', 'CIUDAD')}</CiudadRecep>
            </Receptor>
            <Totales>
                <MntNeto>{dte_data['monto_neto']}</MntNeto>
                <TasaIVA>{dte_data['tasa_iva']}</TasaIVA>
                <IVA>{dte_data['monto_iva']}</IVA>
                <MntTotal>{dte_data['monto_total']}</MntTotal>
            </Totales>
        </Encabezado>
        {self._build_items_xml(items)}{referencias_xml}{ted_xml}
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
        razon_social_receptor = dte_data['receptor_razon_social'][:40]
        monto_total = dte_data['monto_total']
        item_name_40 = item_name[:40]
        
        # Limpiar el XML del CAF (quitar declaraciones XML si existen)
        caf_xml_clean = caf_xml.strip()
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
<TSTAMP>{tstamp}</TSTAMP>
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
        Envuelve uno o más DTEs firmados en un EnvioDTE para ser enviado al SII.
        """
        fecha_resolucion = self.company.get('resolucion_fecha') or '2014-08-22'
        nro_resolucion = self.company.get('resolucion_numero') or 0
        
        envio_id = f"SetDoc_{dte_data.get('folio', 1)}"
        
        if isinstance(signed_dte_xml, str) and signed_dte_xml.strip().startswith("<?xml"):
            decl_end = signed_dte_xml.find("?>")
            if decl_end != -1:
                signed_dte_xml = signed_dte_xml[decl_end + 2:].strip()
                
        envio_xml = f"""<?xml version="1.0" encoding="ISO-8859-1"?>
<EnvioDTE xmlns="http://www.sii.cl/SiiDte" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sii.cl/SiiDte EnvioDTE_v10.xsd" version="1.0">
    <SetDTE ID="{envio_id}">
        <Caratula version="1.0">
            <RutEmisor>{self.company['rut']}</RutEmisor>
            <RutEnvia>{self.company['rut']}</RutEnvia>
            <RutReceptor>{dte_data['receptor_rut']}</RutReceptor>
            <FchResol>{fecha_resolucion}</FchResol>
            <NroResol>{nro_resolucion}</NroResol>
            <TmstFirmaEnv>{datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')}</TmstFirmaEnv>
            <SubTotDTE>
                <TpoDTE>{dte_data['tipo_dte']}</TpoDTE>
                <NroDTE>1</NroDTE>
            </SubTotDTE>
        </Caratula>
        {signed_dte_xml}
    </SetDTE>
</EnvioDTE>"""
        return envio_xml

    def _build_items_xml(self, items: List[Dict[str, Any]]) -> str:
        items_xml = ""
        for i, item in enumerate(items, 1):
            items_xml += f"""
        <Detalle>
            <NroLinDet>{i}</NroLinDet>
            <NmbItem>{item['product_name']}</NmbItem>
            <QtyItem>{item['quantity']}</QtyItem>
            <PrcItem>{item['unit_price']}</PrcItem>
            <MontoItem>{item['total_amount']}</MontoItem>
        </Detalle>"""
        return items_xml
