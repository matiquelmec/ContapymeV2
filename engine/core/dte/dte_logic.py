import datetime
import hashlib
import json
import uuid
import tempfile
import os
from typing import Dict, List, Any

from .dte_xml_builder import DTEXMLBuilder
from .dte_signer import DTESigner
from .sii_client import SIIClient
from .caf_manager import CAFManager
from ..database import get_supabase

class DTELogic:
    """
    Orquestador principal para la generación, firma y registro de DTEs.
    """
    
    def __init__(self, organization_id: str):
        self.organization_id = organization_id
        self.supabase = get_supabase()
        self.company_data = self._load_company_data()
        self.xml_builder = DTEXMLBuilder(self.company_data)
        self.signer = DTESigner()

    def _load_company_data(self) -> Dict[str, Any]:
        """Carga los datos del emisor desde la base de datos."""
        response = self.supabase.table("dte_companies")\
            .select("*")\
            .eq("organization_id", self.organization_id)\
            .execute()
        
        if (not response.data) or (len(response.data) == 0):
            raise Exception(
                f"Configuración DTE Pendiente: La organización no ha sido registrada como emisor electrónico. "
                f"Por favor, vaya a 'Configuración de Empresa > Facturación' para completar los datos de la empresa "
                f"y cargar sus folios (CAF)."
            )
        return response.data[0]

    def _get_next_folio_with_caf(self, tipo_dte: int) -> tuple[int, Dict[str, Any]]:
        """Obtiene el siguiente folio disponible y el CAF correspondiente."""
        caf = self.supabase.table("dte_caf_folios")\
            .select("*")\
            .eq("organization_id", self.organization_id)\
            .eq("tipo_dte", tipo_dte)\
            .eq("is_active", True)\
            .order("range_start")\
            .execute()
        
        if not caf.data or len(caf.data) == 0:
            raise Exception(
                f"Folios Agotados o Faltantes: No se encontraron folios (CAF) activos para el documento tipo {tipo_dte}. "
                f"Por favor, descargue un nuevo archivo CAF desde el portal del SII y cárguelo en 'Configuración de Empresa > Facturación'."
            )
            
        current_caf = caf.data[0]
        next_folio = current_caf["last_used_folio"] + 1
        
        if next_folio > current_caf["range_end"]:
            # Marcar CAF como inactivo si se acabaron los folios
            self.supabase.table("dte_caf_folios")\
                .update({"is_active": False})\
                .eq("id", current_caf["id"])\
                .execute()
            return self._get_next_folio_with_caf(tipo_dte)
            
        # Actualizar último folio usado
        self.supabase.table("dte_caf_folios")\
            .update({"last_used_folio": next_folio})\
            .eq("id", current_caf["id"])\
            .execute()
            
        return next_folio, current_caf

    def _get_certificate(self) -> tuple[bytes, str]:
        """Descarga el PFX de la empresa, con fallback al Certificado Maestro."""
        cert_path = self.company_data.get("cert_path")
        enc_pass = self.company_data.get("cert_password_encrypted")
        
        if cert_path and enc_pass:
            # 1. Certificado Propio (Descentralizado)
            res = self.supabase.storage.from_("dte_certificates").download(cert_path)
            pfx_bytes = res
            
            rpc_res = self.supabase.rpc(
                "decrypt_cert_password", 
                {"encrypted_password": enc_pass, "org_id": self.organization_id}
            ).execute()
            
            if not rpc_res.data:
                raise Exception("Error al obtener la clave del certificado de la empresa.")
            return pfx_bytes, rpc_res.data
        else:
            # 2. Certificado Maestro Centralizado (Delegación)
            master_pass = os.environ.get("DTE_MASTER_CERT_PASSWORD")
            if not master_pass:
                raise Exception("El cliente no tiene certificado y el Certificado Maestro no está configurado (DTE_MASTER_CERT_PASSWORD).")
                
            master_pass = master_pass.strip('"').strip("'")
            
            try:
                try:
                    res = self.supabase.storage.from_("dte_certificates").download("system/master_cert.pfx")
                except Exception:
                    res = self.supabase.storage.from_("dte_certificates").download("Certificado E-Certchile (14).pfx")
                pfx_bytes = res
                return pfx_bytes, master_pass
            except Exception as e:
                raise Exception(f"Error descargando el Certificado Maestro: {str(e)}")

    def _get_previous_hash(self, tipo_dte: int) -> str:
        """Obtiene el hash del último DTE emitido para mantener la cadena de integridad."""
        last_dte = self.supabase.table("dte_issued")\
            .select("integrity_hash")\
            .eq("organization_id", self.organization_id)\
            .eq("tipo_dte", tipo_dte)\
            .order("folio", desc=True)\
            .limit(1)\
            .execute()
        
        if not last_dte.data or len(last_dte.data) == 0:
            return "ORIGIN" # Sincronizado con COALESCE(prev_hash, 'ORIGIN') en trigger PostgreSQL
            
        return last_dte.data[0]["integrity_hash"]

    def _calculate_integrity_hash(self, record: Dict[str, Any]) -> str:
        """Calcula un hash SHA-256 idéntico al del disparador de base de datos PostgreSQL."""
        fields = [
            str(record["organization_id"]),
            str(record["company_id"]),
            str(record["tipo_dte"]),
            str(record["folio"]),
            str(record["monto_total"]),
            str(record["receptor_rut"]),
            str(record["previous_hash"])
        ]
        data_string = "|".join(fields)
        return hashlib.sha256(data_string.encode('utf-8')).hexdigest()

    async def create_and_sign_invoice(self, invoice_data: Dict[str, Any], items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Crea un DTE, genera el XML, lo timbra y lo guarda.
        """
        tipo_dte = invoice_data.get("tipo_dte", 33)
        
        # 1. Obtener Folio Real y su CAF
        folio, current_caf = self._get_next_folio_with_caf(tipo_dte)
        
        # 2. Registrar en DB (Estado inicial: draft)
        dte_record = {
            "organization_id": self.organization_id,
            "company_id": self.company_data["id"],
            "tipo_dte": tipo_dte,
            "folio": folio,
            "fecha_emision": invoice_data.get("fecha_emision") or datetime.date.today().isoformat(),
            "receptor_rut": invoice_data["receptor_rut"],
            "receptor_razon_social": invoice_data["receptor_razon_social"],
            "monto_neto": invoice_data["monto_neto"],
            "monto_iva": invoice_data["monto_iva"],
            "monto_total": invoice_data["monto_total"],
            "tasa_iva": invoice_data.get("tasa_iva", 19.00),
            "status": "draft",
            "previous_hash": self._get_previous_hash(tipo_dte),
            "referencias": invoice_data.get("referencias", [])
        }
        
        # Calcular Integrity Hash de forma sincronizada con PostgreSQL
        dte_record["integrity_hash"] = self._calculate_integrity_hash(dte_record)
        
        insert_response = self.supabase.table("dte_issued").insert(dte_record).execute()
        dte_id = insert_response.data[0]["id"]
        
        # 3. Guardar items
        for i, item in enumerate(items, 1):
            item["dte_id"] = dte_id
            item["organization_id"] = self.organization_id
            item["line_number"] = i
            self.supabase.table("dte_items").insert(item).execute()
            
        # 4. Construir y Firmar el Timbre Electrónico (TED)
        rsask_pem = CAFManager.get_private_key_from_caf(current_caf["caf_xml"])
        if not rsask_pem:
            raise Exception("No se pudo extraer la clave privada (RSASK) del archivo CAF para firmar el timbre electrónico.")

        item1_name = items[0]["product_name"] if items else "SERVICIO"
        tstamp = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')

        # Armar bloque <DD> del TED exacto
        rut_emisor = self.company_data['rut']
        rut_receptor = dte_record['receptor_rut']
        razon_social_receptor = dte_record['receptor_razon_social'][:40]
        monto_total = dte_record['monto_total']
        item_name_40 = item1_name[:40]
        
        caf_xml_clean = current_caf["caf_xml"].strip()
        if caf_xml_clean.startswith("<?xml"):
            decl_end = caf_xml_clean.find("?>")
            if decl_end != -1:
                caf_xml_clean = caf_xml_clean[decl_end + 2:].strip()

        dd_xml_str = f"<DD><RE>{rut_emisor}</RE><TD>{tipo_dte}</TD><F>{folio}</F><FE>{dte_record['fecha_emision']}</FE><RR>{rut_receptor}</RR><RSR>{razon_social_receptor}</RSR><MNT>{monto_total}</MNT><IT1>{item_name_40}</IT1>{caf_xml_clean}<TSTAMP>{tstamp}</TSTAMP></DD>"

        # Generar firma digital del TED
        ted_signature_b64 = self.signer.sign_ted(dd_xml_str, rsask_pem)
        
        # Generar XML completo del TED
        ted_xml = self.xml_builder.build_ted_xml(dte_record, item1_name, current_caf["caf_xml"], ted_signature_b64, tstamp)

        # 5. Generar XML Unsigned (con TED e inyección de Referencias)
        xml_unsigned = self.xml_builder.build_dte_xml(
            dte_record, 
            items, 
            ted_xml=ted_xml, 
            referencias=dte_record["referencias"]
        )
        
        # 6. Firmar el XML con el Certificado de la empresa
        xml_signed = xml_unsigned
        
        try:
            pfx_bytes, cert_password = self._get_certificate()
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pfx") as tmp:
                tmp.write(pfx_bytes)
                tmp_pfx_path = tmp.name
                
            try:
                self.signer.load_certificate(tmp_pfx_path, cert_password)
                xml_signed = self.signer.sign_xml(xml_unsigned, f"DTE_{folio}")
                
                # 6.1 Crear EnvioDTE y firmarlo
                envio_xml = self.xml_builder.build_envio_dte(xml_signed, dte_record)
                envio_signed = self.signer.sign_envio(envio_xml, f"SetDoc_{folio}")
                
                # 6.2 Obtener Token del SII con el ambiente dinámico
                sii_client = SIIClient(environment=current_caf["environment"])
                try:
                    seed = await sii_client.get_seed()
                    signed_seed = self.signer.sign_seed(seed)
                    token = await sii_client.get_token(signed_seed)
                    
                    # 6.3 Enviar al SII
                    sii_res = await sii_client.send_dte(token, envio_signed, self.company_data["rut"], self.company_data["rut"])
                    
                    if sii_res.get("success"):
                        dte_record["track_id"] = sii_res.get("track_id")
                        self.supabase.table("dte_issued").update({"track_id": dte_record["track_id"]}).eq("id", dte_id).execute()
                except Exception as sii_e:
                    print(f"Error comunicando con el SII: {str(sii_e)}")
                    pass
                
            finally:
                if os.path.exists(tmp_pfx_path):
                    os.remove(tmp_pfx_path)
        except Exception as e:
            # Si falla la firma, dejamos el registro en "draft" y burbujeamos el error real
            raise Exception(f"Error durante la firma o envío del DTE: {str(e)}")
        
        # 7. Sincronizar con RCV (sales_records) para reportes inmediatos
        periodo = dte_record["fecha_emision"][:7] + "-01"
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

        # 8. Actualizar en DB
        self.supabase.table("dte_issued")\
            .update({"xml_content": xml_signed, "status": "signed"})\
            .eq("id", dte_id)\
            .execute()
            
        return {"id": dte_id, "folio": folio, "status": "signed", "xml": xml_signed}
            
    async def list_dtes(self, organization_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Lista los documentos emitidos para una organización."""
        response = self.supabase.table("dte_issued")\
            .select("*")\
            .eq("organization_id", organization_id)\
            .order("created_at", desc=True)\
            .range(offset, offset + limit)\
            .execute()
        return response.data

    async def verify_chain_integrity(self, tipo_dte: int) -> Dict[str, Any]:
        """
        Realiza una auditoría forense de la cadena de documentos para detectar manipulaciones.
        """
        all_dtes = self.supabase.table("dte_issued")\
            .select("*")\
            .eq("organization_id", self.organization_id)\
            .eq("tipo_dte", tipo_dte)\
            .order("folio", desc=False)\
            .execute()
        
        errors = []
        expected_prev_hash = "ORIGIN"
        
        for dte in all_dtes.data:
            # 1. Verificar vínculo con el anterior
            if dte["previous_hash"] != expected_prev_hash:
                errors.append(
                    f"Ruptura de cadena en Folio {dte['folio']}: Se esperaba {expected_prev_hash[:10]}... "
                    f"pero se encontró {dte['previous_hash'][:10]}..."
                )
            
            # 2. Recalcular Hash actual
            recalculated_hash = self._calculate_integrity_hash(dte)
            if dte["integrity_hash"] != recalculated_hash:
                errors.append(
                    f"Manipulación detectada en Folio {dte['folio']}: El contenido no coincide con la firma digital de integridad."
                )
            
            # Actualizar para el siguiente eslabón
            expected_prev_hash = dte["integrity_hash"]
            
        return {
            "status": "VALID" if not errors else "COMPROMISED",
            "total_documents": len(all_dtes.data),
            "errors": errors
        }
