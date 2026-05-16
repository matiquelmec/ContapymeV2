import datetime
from typing import Dict, List, Any

class DTEXMLBuilder:
    """
    Construye el XML para Documentos Tributarios Electrónicos (DTE) 
    siguiendo el esquema del SII (Servicio de Impuestos Internos de Chile).
    """
    
    def __init__(self, company_data: Dict[str, Any]):
        self.company = company_data
        
    def build_dte_xml(self, dte_data: Dict[str, Any], items: List[Dict[str, Any]]) -> str:
        """
        Construye el XML base para un DTE.
        """
        tipo_dte = dte_data.get("tipo_dte")
        folio = dte_data.get("folio")
        fecha = dte_data.get("fecha_emision", datetime.date.today().isoformat())
        
        # Estructura básica simplificada (Para ser extendida con el esquema completo del SII)
        # NOTA: El SII requiere un formato muy específico y namespaces.
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
        {self._build_items_xml(items)}
    </Documento>
</DTE>"""
        return xml

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
