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
            .eq("company_id", self.company_data["id"])\
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

    def validate_dte_date(self, tipo_dte: int, fecha_emision_str: str):
        """
        Valida que la fecha de emisión del DTE sea válida de acuerdo a las políticas del SII:
        - No puede ser una fecha futura.
        - Para Boletas (39, 41): Desfase máximo de 3 días hacia atrás.
        - Para Facturas (33, 34) y otros: Desfase máximo de 30 días o si el mes anterior ya está cerrado (después del día 20 del mes actual).
        """
        try:
            fecha_emision = datetime.date.fromisoformat(fecha_emision_str)
        except ValueError:
            raise ValueError(f"Formato de fecha inválido: '{fecha_emision_str}'. Debe ser YYYY-MM-DD.")

        hoy = datetime.date.today()

        # 1. Bloquear fechas futuras
        if fecha_emision > hoy:
            raise ValueError(
                f"La fecha de emisión del documento ({fecha_emision_str}) no puede ser posterior a la fecha actual ({hoy.isoformat()}). "
                "El SII rechaza de inmediato documentos con fechas futuras."
            )

        # 2. Validar según tipo de DTE
        tipo_str = str(tipo_dte)
        desfase_dias = (hoy - fecha_emision).days

        if tipo_str in ['39', '41']: # Boletas
            if desfase_dias > 3:
                raise ValueError(
                    f"Desfase de fecha excedido para Boleta Electrónica: La fecha ({fecha_emision_str}) tiene un retraso de {desfase_dias} días. "
                    "El SII exige que las boletas se declaren y envíen diariamente (máximo 3 días de desfase). "
                    "Por favor, emita la boleta con la fecha del día de hoy para evitar que sea rechazada."
                )
        else: # Facturas, Notas de Crédito, Notas de Débito, etc.
            # Limitar a máximo 30 días de desfase
            if desfase_dias > 30:
                raise ValueError(
                    f"Desfase de fecha excedido: La fecha de emisión ({fecha_emision_str}) tiene más de 30 días de desfase. "
                    "El SII no acepta documentos con fecha de emisión tan antigua con respecto a la fecha actual de transmisión. "
                    "Por favor, emita el documento con una fecha más reciente o del mes en curso."
                )
            
            # Si es del mes anterior, verificar si ya se cerró el periodo (vence el día 20 del mes actual)
            if fecha_emision.month != hoy.month or fecha_emision.year != hoy.year:
                if hoy.day > 20:
                    raise ValueError(
                        f"Periodo Tributario Cerrado: La fecha de emisión ({fecha_emision_str}) pertenece al mes anterior. "
                        f"Dado que hoy es {hoy.isoformat()} (pasado el día 20 del mes), la declaración de IVA (F29) del mes anterior ya venció y el periodo está cerrado. "
                        "No puede emitir documentos con fecha del mes anterior en este momento. Por favor, use la fecha del periodo actual."
                    )

    async def create_and_sign_invoice(self, invoice_data: Dict[str, Any], items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Crea un DTE, genera el XML, lo timbra y lo guarda.
        """
        tipo_dte = invoice_data.get("tipo_dte", 33)
        fecha_emision_str = invoice_data.get("fecha_emision") or datetime.date.today().isoformat()
        
        # Validar la fecha de emisión de forma inteligente antes de continuar
        self.validate_dte_date(tipo_dte, fecha_emision_str)
        
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
        razon_social_receptor = DTEXMLBuilder.clean_xml_text(dte_record['receptor_razon_social'])[:40]
        monto_total = dte_record['monto_total']
        item_name_40 = DTEXMLBuilder.clean_xml_text(item1_name)[:40]
        
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
                xml_signed = self.signer.sign_xml(xml_unsigned, f"DTE_{tipo_dte}_{folio}")
                
                # 6.1 Crear EnvioDTE y firmarlo
                envio_xml = self.xml_builder.build_envio_dte(xml_signed, dte_record)
                envio_signed = self.signer.sign_envio(envio_xml, f"SetDoc_{folio}")
                
            finally:
                if os.path.exists(tmp_pfx_path):
                    os.remove(tmp_pfx_path)
        except Exception as e:
            # Si falla la firma, dejamos el registro en "draft" y burbujeamos el error real
            raise Exception(f"Error durante la firma del DTE: {str(e)}")
        
        # ── PASO 6.2: Guardar XML firmado SIEMPRE (independiente del SII) ──
        self.supabase.table("dte_issued")\
            .update({"xml_content": xml_signed, "status": "signed"})\
            .eq("id", dte_id)\
            .execute()

        # ── PASO 6.3: Intentar enviar al SII (no bloquea la emisión si falla) ──
        sii_error_msg = None
        try:
            sii_client = SIIClient(environment=current_caf["environment"])
            seed = await sii_client.get_seed()
            signed_seed = self.signer.sign_seed(seed)
            token = await sii_client.get_token(signed_seed)
            
            sii_res = await sii_client.send_dte(token, envio_signed, self.company_data["rut"], self.company_data["rut"])
            
            if sii_res.get("success"):
                dte_record["track_id"] = sii_res.get("track_id")
                self.supabase.table("dte_issued").update({
                    "track_id": dte_record["track_id"],
                    "status": "sent",
                    "error_log": None
                }).eq("id", dte_id).execute()
                
                try:
                    from .dte_centralizer import centralize_dte_accounting
                    await centralize_dte_accounting(dte_id, self.organization_id)
                except Exception as cent_err:
                    print(f"Advertencia: No se pudo centralizar contablemente el DTE {dte_id}: {cent_err}")
        except Exception as sii_e:
            sii_error_msg = f"DTE firmado localmente (Folio {folio}). Pendiente de envio al SII: {str(sii_e)}"
            print(sii_error_msg)
            self.supabase.table("dte_issued").update({
                "error_log": sii_error_msg
            }).eq("id", dte_id).execute()

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

        # 8. Retorno final
        final_status = "sent" if dte_record.get("track_id") else "signed"
        result = {"id": dte_id, "folio": folio, "status": final_status, "xml": xml_signed}
        if sii_error_msg:
            result["sii_warning"] = sii_error_msg
        return result
            
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
            .eq("company_id", self.company_data["id"])\
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

    async def retry_send_to_sii(self, dte_id: str) -> Dict[str, Any]:
        """
        Reintenta el envío al SII de un DTE que quedó firmado localmente ('signed').
        Solo funciona si el DTE tiene xml_content y NO tiene track_id.
        """
        # 1. Obtener el DTE
        dte_resp = self.supabase.table("dte_issued")\
            .select("*")\
            .eq("id", dte_id)\
            .single()\
            .execute()
        dte = dte_resp.data
        
        if not dte:
            raise Exception(f"No se encontró DTE con id {dte_id}")
        
        if dte.get("track_id"):
            return {"status": "already_sent", "track_id": dte["track_id"], "message": "Este DTE ya fue enviado al SII."}
        
        if not dte.get("xml_content"):
            raise Exception(f"El DTE {dte_id} no tiene XML firmado. No se puede reenviar.")
        
        # 2. Reconstruir el envío
        envio_xml = self.xml_builder.build_envio_dte(dte["xml_content"], dte)
        
        # 3. Firmar el envío
        pfx_bytes, cert_password = self._get_certificate()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pfx") as tmp:
            tmp.write(pfx_bytes)
            tmp_pfx_path = tmp.name
        
        try:
            self.signer.load_certificate(tmp_pfx_path, cert_password)
            envio_signed = self.signer.sign_envio(envio_xml, f"SetDoc_{dte['folio']}")
        finally:
            if os.path.exists(tmp_pfx_path):
                os.remove(tmp_pfx_path)
        
        # 4. Determinar ambiente desde el CAF
        caf_records = self.supabase.table("dte_caf_folios")\
            .select("*")\
            .eq("organization_id", self.organization_id)\
            .eq("tipo_dte", dte["tipo_dte"])\
            .limit(1)\
            .execute()
        env = caf_records.data[0]["environment"] if caf_records.data else "cert"
        
        # 5. Enviar al SII
        sii_client = SIIClient(environment=env)
        seed = await sii_client.get_seed()
        signed_seed = self.signer.sign_seed(seed)
        token = await sii_client.get_token(signed_seed)
        
        sii_res = await sii_client.send_dte(token, envio_signed, self.company_data["rut"], self.company_data["rut"])
        
        if sii_res.get("success"):
            self.supabase.table("dte_issued").update({
                "track_id": sii_res.get("track_id"),
                "status": "sent",
                "error_log": None
            }).eq("id", dte_id).execute()
            
            try:
                from .dte_centralizer import centralize_dte_accounting
                await centralize_dte_accounting(dte_id, self.organization_id)
            except Exception as cent_err:
                print(f"Advertencia: No se pudo centralizar contablemente el DTE {dte_id} en el reintento: {cent_err}")
            
            return {"status": "sent", "track_id": sii_res.get("track_id"), "message": f"DTE Folio {dte['folio']} enviado exitosamente al SII."}
        
        raise Exception(f"El SII no aceptó el envío: {sii_res}")
