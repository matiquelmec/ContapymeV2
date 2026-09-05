from fastapi import APIRouter, HTTPException, Depends, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import date
from core.auth import verify_org_role, verify_token
from core.database import get_supabase
from core.dte.dte_logic import DTELogic
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class PurchaseOrderItem(BaseModel):
    descripcion: str
    unidad: str = "UNI"
    cantidad: float
    precio_unitario: int
    descuento_pct: float = 0.0
    afecto_iva: bool = True

class PurchaseOrderCreate(BaseModel):
    organization_id: str
    cliente_rut: str
    cliente_nombre: str
    cliente_giro: Optional[str] = "GIRO COMERCIAL"
    cliente_direccion: Optional[str] = "Punta Arenas"
    condicion_pago: Optional[str] = "Contado"
    observaciones: Optional[str] = ""
    fecha_entrega: Optional[str] = None
    items: List[PurchaseOrderItem]

@router.post("/create")
async def create_purchase_order(
    data: PurchaseOrderCreate = Body(...),
    auth: dict = Depends(verify_token)
):
    """
    Crea una nueva Orden de Compra (OC) preliminar en el sistema.
    """
    await verify_org_role(data.organization_id, required_roles=["owner", "admin", "accountant"], auth=auth)
    db = get_supabase()

    try:
        neto = 0
        exento = 0
        for item in data.items:
            subtotal = int(round(item.cantidad * item.precio_unitario * (1 - item.descuento_pct / 100.0)))
            if item.afecto_iva:
                neto += subtotal
            else:
                exento += subtotal

        iva = int(round(neto * 0.19))
        total = neto + iva + exento

        # Obtener siguiente número correlativo de OC para la organización
        last_oc = db.table("purchase_orders")\
            .select("numero")\
            .eq("organization_id", data.organization_id)\
            .order("numero", descending=True)\
            .limit(1)\
            .execute()
        
        siguiente_numero = (last_oc.data[0]["numero"] + 1) if last_oc.data else 1

        oc_payload = {
            "organization_id": data.organization_id,
            "numero": siguiente_numero,
            "fecha": date.today().isoformat(),
            "fecha_entrega": data.fecha_entrega or date.today().isoformat(),
            "cliente_rut": data.cliente_rut,
            "cliente_nombre": data.cliente_nombre,
            "cliente_giro": data.cliente_giro,
            "cliente_direccion": data.cliente_direccion,
            "condicion_pago": data.condicion_pago,
            "observaciones": data.observaciones,
            "neto": neto,
            "iva": iva,
            "exento": exento,
            "total": total,
            "estado": "emitida"
        }

        res = db.table("purchase_orders").insert(oc_payload).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Fallo al guardar Orden de Compra")
        
        oc_id = res.data[0]["id"]

        # Insertar items
        items_payload = []
        for item in data.items:
            items_payload.append({
                "orden_id": oc_id,
                "descripcion": item.descripcion,
                "unidad": item.unidad,
                "cantidad": item.cantidad,
                "precio_unitario": item.precio_unitario,
                "descuento_pct": item.descuento_pct,
                "afecto_iva": item.afecto_iva
            })
        
        db.table("purchase_order_items").insert(items_payload).execute()

        return {
            "status": "success",
            "message": f"Orden de Compra N° {siguiente_numero} creada exitosamente.",
            "purchase_order": res.data[0]
        }

    except Exception as e:
        logger.error(f"[OC Create Error] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list/{organization_id}")
async def list_purchase_orders(
    organization_id: str,
    auth: dict = Depends(verify_token)
):
    """
    Lista todas las Órdenes de Compra emitidas por la organización.
    """
    await verify_org_role(organization_id, required_roles=["owner", "admin", "accountant"], auth=auth)
    db = get_supabase()

    try:
        res = db.table("purchase_orders")\
            .select("*, purchase_order_items(*)")\
            .eq("organization_id", organization_id)\
            .order("created_at", descending=True)\
            .execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{oc_id}/convert-to-dte")
async def convert_oc_to_dte(
    oc_id: str,
    tipo_dte: int = 33, # 33 = Factura Afecta, 34 = Factura Exenta
    auth: dict = Depends(verify_token)
):
    """
    Convierte una Orden de Compra en Factura DTE SII firmada con 1 clic.
    """
    db = get_supabase()
    oc_res = db.table("purchase_orders").select("*, purchase_order_items(*)").eq("id", oc_id).single().execute()
    oc = oc_res.data
    if not oc:
        raise HTTPException(status_code=404, detail="Orden de Compra no encontrada")

    # 🛡️ BLINDAJE ANTI-DUPLICIDAD: Evitar doble facturación y duplicidad de débito fiscal IVA
    if oc.get("estado") == "facturada" or oc.get("folio_dte"):
        raise HTTPException(
            status_code=409,
            detail=f"Conflicto: La Orden de Compra N° {oc.get('numero')} ya fue facturada (Folio DTE {oc.get('folio_dte')}). No se permite facturar dos veces para proteger el crédito fiscal."
        )

    await verify_org_role(oc["organization_id"], required_roles=["owner", "admin", "accountant"], auth=auth)

    try:
        logic = DTELogic(oc["organization_id"])

        is_exenta = (int(tipo_dte) == 34)
        items_dict = []
        for it in oc.get("purchase_order_items", []):
            subtotal = int(round(it["cantidad"] * it["precio_unitario"] * (1 - it["descuento_pct"] / 100.0)))
            items_dict.append({
                "product_name": it["descripcion"],
                "quantity": float(it["cantidad"]),
                "unit_price": int(it["precio_unitario"]),
                "total_amount": subtotal,
                "is_exempt": True if is_exenta else (not it["afecto_iva"])
            })

        monto_neto = 0 if is_exenta else int(oc.get("neto", 0))
        monto_iva = 0 if is_exenta else int(oc.get("iva", 0))
        tasa_iva = 0.0 if is_exenta else 19.0

        dte_payload = {
            "organization_id": oc["organization_id"],
            "tipo_dte": tipo_dte,
            "receptor_rut": oc["cliente_rut"],
            "receptor_razon_social": oc["cliente_nombre"],
            "monto_neto": monto_neto,
            "monto_iva": monto_iva,
            "monto_total": int(oc.get("total", 0)),
            "tasa_iva": tasa_iva,
            "referencias": [{
                "tipo_doc": "801",  # 801 = Código SII para Orden de Compra
                "folio": str(oc.get("numero")),
                "fecha_ref": str(oc.get("fecha") or date.today().isoformat()),
                "razon_ref": f"Orden de Compra N° {oc.get('numero')}"
            }]
        }

        # Generar DTE firmado
        result = await logic.create_and_sign_invoice(dte_payload, items_dict)

        # Actualizar estado de la OC a "facturada" con el folio y el ID del DTE generado
        db.table("purchase_orders").update({
            "estado": "facturada",
            "tipo_dte": tipo_dte,
            "folio_dte": result.get("folio"),
            "dte_id": result.get("id")
        }).eq("id", oc_id).execute()

        return {
            "status": "success",
            "message": f"Orden de Compra N° {oc['numero']} convertida exitosamente a Factura DTE Folio N° {result.get('folio')}.",
            "dte_result": result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[OC Convert Error] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
