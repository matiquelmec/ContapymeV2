import logging
from typing import Dict, Any, List
from core.database import get_supabase

logger = logging.getLogger(__name__)

def get_accounting_config(db, org_id: str, module: str, tx_type: str) -> Dict[str, Any]:
    """
    Busca la configuración de cuentas para un módulo y tipo desde account_config_entries.
    Si no existe, devuelve valores por defecto.
    """
    res = db.table("account_config_entries").select("entry_key, chart_of_accounts(codigo, nombre)") \
        .eq("organization_id", org_id) \
        .eq("module_name", module) \
        .eq("is_active", True) \
        .execute()
        
    db_config = {}
    if res.data:
        for entry in res.data:
            key = entry.get("entry_key")
            coa = entry.get("chart_of_accounts")
            if coa:
                code = coa.get("codigo")
                name = coa.get("nombre")
                if key.startswith(f"{tx_type}_"):
                    base_key = key.replace(f"{tx_type}_", "")
                    db_config[f"{base_key}_code"] = code
                    db_config[f"{base_key}_name"] = name

    if db_config:
        return db_config
    
    # Valores por defecto de compatibilidad
    if module == 'rcv' and tx_type == 'sales':
        return {
            "tax_account_code": "2.1.02.001", "tax_account_name": "IVA Débito Fiscal",
            "revenue_account_code": "4.1.01.001", "revenue_account_name": "Ventas de Mercaderías",
            "asset_account_code": "1.1.02.001", "asset_account_name": "Clientes Nacionales"
        }
    return {}

async def centralize_dte_accounting(dte_id: str, organization_id: str) -> Dict[str, Any]:
    """
    Centraliza automáticamente un DTE emitido en la contabilidad general de forma atómica.
    """
    db = get_supabase()
    
    # 1. Buscar el DTE
    dte_res = db.table("dte_issued").select("*").eq("id", dte_id).single().execute()
    dte = dte_res.data
    if not dte:
        raise Exception(f"No se encontró el DTE con ID {dte_id}")
        
    # Solo centralizar si está en estado enviado ('sent') o aceptado ('accepted')
    if dte.get("status") not in ["sent", "accepted"]:
        logger.info(f"DTE {dte_id} en estado '{dte.get('status')}'. No elegible para centralización contable.")
        return {"status": "skipped", "reason": f"DTE state is {dte.get('status')}"}

    # 2. Evitar duplicidad (Idempotencia)
    existing_res = db.table("journal_entries") \
        .select("id") \
        .eq("organization_id", organization_id) \
        .eq("source_type", "dte_issued") \
        .eq("source_id", dte_id) \
        .execute()
        
    if existing_res.data and len(existing_res.data) > 0:
        logger.info(f"DTE {dte_id} ya se encuentra centralizado contablemente (Asiento: {existing_res.data[0]['id']})")
        return {"status": "already_centralized", "journal_entry_id": existing_res.data[0]["id"]}

    # 3. Obtener configuración de cuentas de venta
    config = get_accounting_config(db, organization_id, 'rcv', 'sales')
    if not config:
        raise Exception(f"Configuración contable ausente para módulo RCV Ventas de la organización {organization_id}")

    # 4. Determinar sentido contable según tipo de DTE (ej: Nota de crédito tipo 61 resta la venta)
    tipo_dte = dte.get("tipo_dte", 39)
    es_suma = True
    if str(tipo_dte) in ['61', '112']:
        es_suma = False

    tipo_activo = "debe" if es_suma else "haber"
    tipo_ingreso = "haber" if es_suma else "debe"

    # Nombres descriptivos de DTE
    doc_names = {
        33: 'Factura Electrónica',
        34: 'Factura Exenta',
        39: 'Boleta Electrónica',
        41: 'Boleta Exenta',
        56: 'Nota de Débito',
        61: 'Nota de Crédito',
        110: 'Factura Exportación',
        111: 'Nota de Débito Export.',
        112: 'Nota de Crédito Export.'
    }
    doc_name = doc_names.get(tipo_dte, f"Documento Tipo {tipo_dte}")
    partner = dte.get("receptor_razon_social") or "Particular"
    glosa = f"{doc_name} Folio {dte['folio']} - {partner}"
    if not es_suma:
        glosa = f"[ANULACIÓN/AJUSTE] {glosa}"

    # 5. Calcular montos para las líneas
    monto_total = int(dte.get("monto_total", 0))
    monto_iva = int(dte.get("monto_iva", 0))
    monto_neto = int(dte.get("monto_neto", 0))
    monto_exento = int(dte.get("monto_exento", 0))
    monto_base = monto_neto + monto_exento

    if abs(monto_base + monto_iva) != abs(monto_total):
        monto_base = abs(monto_total) - abs(monto_iva)

    lines = []
    # Clientes
    if monto_total != 0:
        lines.append({
            "cuenta_codigo": config["asset_account_code"],
            "cuenta_nombre": config["asset_account_name"],
            "tipo": tipo_activo,
            "monto": abs(monto_total)
        })
    # IVA Débito Fiscal
    if monto_iva != 0:
        lines.append({
            "cuenta_codigo": config["tax_account_code"],
            "cuenta_nombre": config["tax_account_name"],
            "tipo": tipo_ingreso,
            "monto": abs(monto_iva)
        })
    # Ingreso Ventas
    if monto_base != 0:
        lines.append({
            "cuenta_codigo": config["revenue_account_code"],
            "cuenta_nombre": config["revenue_account_name"],
            "tipo": tipo_ingreso,
            "monto": abs(monto_base)
        })

    if not lines:
        logger.info(f"DTE {dte_id} tiene monto total cero. No se generó asiento.")
        return {"status": "skipped", "reason": "Zero amount"}

    # 6. Crear el Asiento Contable usando la RPC de Supabase
    try:
        rpc_res = db.rpc("create_journal_entry_with_lines", {
            "p_organization_id": organization_id,
            "p_fecha": dte["fecha_emision"],
            "p_glosa": glosa,
            "p_lines": lines
        }).execute()
        
        journal_id = rpc_res.data
        if not journal_id:
            raise Exception("La RPC 'create_journal_entry_with_lines' retornó un valor nulo.")

        # 7. Registrar metadatos contables adicionales (source_type, source_id, tipo_comprobante)
        tipo_comprobante = "I" if es_suma else "T"
        db.table("journal_entries").update({
            "source_type": "dte_issued",
            "source_id": dte_id,
            "tipo_comprobante": tipo_comprobante
        }).eq("id", journal_id).execute()

        # 8. Sincronizar el ID del asiento en la tabla sales_records para evitar duplicaciones manuales
        try:
            sales_res = db.table("sales_records") \
                .select("id") \
                .eq("organization_id", organization_id) \
                .eq("folio", dte["folio"]) \
                .eq("rut_receptor", dte["receptor_rut"]) \
                .eq("tipo_documento", str(tipo_dte)) \
                .execute()
            if sales_res.data:
                db.table("sales_records") \
                    .update({"journal_entry_id": journal_id}) \
                    .eq("id", sales_res.data[0]["id"]) \
                    .execute()
        except Exception as sync_err:
            logger.warning(f"No se pudo enlazar el asiento contable con sales_records: {sync_err}")

        logger.info(f"Centralización exitosa para DTE {dte_id}. Asiento contable ID: {journal_id}")
        return {"status": "centralized", "journal_entry_id": journal_id}

    except Exception as e:
        logger.error(f"Fallo al centralizar DTE {dte_id}: {str(e)}")
        # Propagar el error para que sea capturado o registrado
        raise Exception(f"Fallo de centralización contable: {str(e)}")
