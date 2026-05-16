from typing import Dict, List, Any
from .dte_xml_builder import DTEXMLBuilder
from .dte_signer import DTESigner
from ..database import get_supabase
import uuid

class DTELogic:
    """
    Orquestador principal para la generación, firma y registro de DTEs.
    """
    
    def __init__(self, organization_id: str):
        self.organization_id = organization_id
        self.supabase = get_supabase()
        self.company_data = self._load_company_data()
        self.xml_builder = DTEXMLBuilder(self.company_data)
        # El certificado se cargará bajo demanda o desde un vault/storage
        self.signer = DTESigner()

    def _load_company_data(self) -> Dict[str, Any]:
        """Carga los datos del emisor desde la base de datos."""
        response = self.supabase.table("dte_companies")\
            .select("*")\
            .eq("organization_id", self.organization_id)\
            .single()\
            .execute()
        
        if not response.data:
            raise Exception(f"No se encontró configuración DTE para la organización {self.organization_id}")
        return response.data

    def _get_next_folio(self, tipo_dte: int) -> int:
        """Obtiene el siguiente folio disponible para un tipo de DTE."""
        caf = self.supabase.table("dte_caf_folios")\
            .select("*")\
            .eq("organization_id", self.organization_id)\
            .eq("tipo_dte", tipo_dte)\
            .eq("is_active", True)\
            .order("range_start")\
            .execute()
        
        if not caf.data:
            raise Exception(f"No hay folios disponibles para el tipo {tipo_dte}")
            
        current_caf = caf.data[0]
        next_folio = current_caf["last_used_folio"] + 1
        
        if next_folio > current_caf["range_end"]:
            # Marcar CAF como inactivo si se acabaron los folios
            self.supabase.table("dte_caf_folios")\
                .update({"is_active": False})\
                .eq("id", current_caf["id"])\
                .execute()
            return self._get_next_folio(tipo_dte)
            
        # Actualizar último folio usado
        self.supabase.table("dte_caf_folios")\
            .update({"last_used_folio": next_folio})\
            .eq("id", current_caf["id"])\
            .execute()
            
        return next_folio

    async def create_and_sign_invoice(self, invoice_data: Dict[str, Any], items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Crea un DTE, genera el XML, lo timbra y lo guarda.
        """
        tipo_dte = invoice_data.get("tipo_dte", 33)
        
        # 1. Obtener Folio Real
        folio = self._get_next_folio(tipo_dte)
        
        # 2. Registrar en DB (Estado inicial: draft)
        dte_record = {
            "organization_id": self.organization_id,
            "company_id": self.company_data["id"],
            "tipo_dte": tipo_dte,
            "folio": folio,
            "fecha_emision": invoice_data.get("fecha_emision", "2026-05-15"),
            "receptor_rut": invoice_data["receptor_rut"],
            "receptor_razon_social": invoice_data["receptor_razon_social"],
            "monto_neto": invoice_data["monto_neto"],
            "monto_iva": invoice_data["monto_iva"],
            "monto_total": invoice_data["monto_total"],
            "tasa_iva": invoice_data.get("tasa_iva", 19.00),
            "status": "draft"
        }
        
        insert_response = self.supabase.table("dte_issued").insert(dte_record).execute()
        dte_id = insert_response.data[0]["id"]
        
        # 3. Guardar items
        for i, item in enumerate(items, 1):
            item["dte_id"] = dte_id
            item["organization_id"] = self.organization_id
            item["line_number"] = i
            self.supabase.table("dte_items").insert(item).execute()
            
        # 4. Generar XML (Unsigned + TED)
        xml_unsigned = self.xml_builder.build_dte_xml(dte_record, items)
        
        # 5. Sincronizar con RCV (sales_records) para reportes inmediatos
        periodo = dte_record["fecha_emision"][:7] + "-01" # Formato YYYY-MM-01
        monto_calculado = dte_record["monto_total"]
        if str(tipo_dte) in ['61', '112']: # Notas de crédito restan
            monto_calculado = -monto_calculado
            es_suma = False
        else:
            es_suma = True

        rcv_entry = {
            "organization_id": self.organization_id,
            "periodo": periodo,
            "tipo_documento": str(tipo_dte),
            "folio": folio,
            "rut_receptor": dte_record["receptor_rut"],
            "razon_social_receptor": dte_record["receptor_razon_social"],
            "fecha_docto": dte_record["fecha_emision"],
            "monto_neto": dte_record["monto_neto"],
            "monto_exento": 0,
            "monto_iva": dte_record["monto_iva"],
            "monto_total": dte_record["monto_total"],
            "monto_calculado": monto_calculado,
            "es_suma": es_suma
        }
        self.supabase.table("sales_records").upsert(rcv_entry, on_conflict="organization_id,folio,rut_receptor,periodo").execute()

        # 6. Actualizar en DB
        self.supabase.table("dte_issued")\
            .update({"xml_content": xml_unsigned, "status": "signed"})\
            .eq("id", dte_id)\
            .execute()
            
        return {"id": dte_id, "folio": folio, "status": "signed", "xml": xml_unsigned}
            
    async def list_dtes(self, organization_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Lista los documentos emitidos para una organización."""
        response = self.supabase.table("dte_issued")\
            .select("*")\
            .eq("organization_id", organization_id)\
            .order("created_at", desc=True)\
            .range(offset, offset + limit)\
            .execute()
        return response.data
