"""
sii_defense.py — Router de Escritos de Descargo y Rectificatorias ante el SII
Permite a contadores generar y descargar escritos legales en formato Word (.docx).
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import io
import urllib.parse

from core.database import get_supabase
from core.auth import verify_token, verify_org_role
from core.sii.legal_defense_builder import SIILegalDefenseBuilder

router = APIRouter()

# ── MODELOS ──

class SIIDefenseRequest(BaseModel):
    organization_id: str
    document_type: str = Field(..., description="boletas_vs_facturas | citacion_art_63 | rectificatoria_f29 | condonacion_multas")
    periodos: List[str] = Field(default_factory=list, description="Ej: ['2025-01', '2025-02']")
    numero_citacion: Optional[str] = None
    argumentos_adicionales: Optional[str] = None

# ── CATÁLOGO DE PLANTILLAS LEGALES ──

TEMPLATES = [
    {
        "id": "boletas_vs_facturas",
        "title": "Descargo por Boletas vs Facturas (Ventas a Consumidor Final)",
        "law_reference": "Art. 53 D.L. 825 de la Ley del IVA & Art. 35 del Reglamento",
        "description": "Justifica legalmente que las ventas se realizan a consumidor final, fundamenta la inexigibilidad de facturas y acredita pago íntegro de IVA en F29."
    },
    {
        "id": "citacion_art_63",
        "title": "Respuesta Formal a Citación Art. 63 del Código Tributario",
        "law_reference": "Art. 63 D.L. 830 Código Tributario",
        "description": "Evacúa descargos dentro del plazo legal frente a requerimientos de fiscalización presencial o electrónica en la Unidad Punta Arenas."
    },
    {
        "id": "rectificatoria_f29",
        "title": "Solicitud de Rectificatoria Voluntaria de F29 (Error de Hecho)",
        "law_reference": "Art. 127 D.L. 830 Código Tributario",
        "description": "Solicita validación formal de rectificación de Formularios 29 acreditando ausencia de perjuicio fiscal y subsanación de códigos."
    },
    {
        "id": "condonacion_multas",
        "title": "Solicitud de Condonación de Intereses y Multas",
        "law_reference": "Circular N° 50 del SII & Art. 6° Letra B N° 4 Código Tributario",
        "description": "Petición fundada al Director Regional para condonación de recargos e intereses por corrección voluntaria y buena fe del contribuyente."
    }
]

@router.get("/templates")
async def get_templates():
    """Retorna el catálogo oficial de escritos y causas tributarias disponibles."""
    return {"success": True, "templates": TEMPLATES}

@router.get("/history/{organization_id}")
async def get_defense_history(
    organization_id: str,
    current_user: dict = Depends(verify_token)
):
    """Obtiene el historial de escritos generados para una empresa."""
    await verify_org_role(organization_id, auth=current_user)
    db = get_supabase()
    res = db.table("sii_defense_documents")\
        .select("*")\
        .eq("organization_id", organization_id)\
        .order("created_at", desc=True)\
        .execute()
    return {"success": True, "documents": res.data or []}

@router.post("/generate")
async def generate_defense_document(
    payload: SIIDefenseRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Genera el escrito formal en formato Word (.docx), lo registra en la base de datos
    y lo retorna como archivo descargable para el usuario.
    """
    await verify_org_role(payload.organization_id, auth=current_user)
    db = get_supabase()

    # 1. Obtener datos de la organización
    org_res = db.table("organizations")\
        .select("id, nombre, rut_empresa, giro, direccion, comuna, region")\
        .eq("id", payload.organization_id)\
        .single()\
        .execute()
        
    if not org_res.data:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
        
    org = org_res.data
    razon_social = org.get("nombre") or "EMPRESA CONTRIBUYENTE SPA"
    rut_empresa = org.get("rut_empresa") or "76.000.000-0"
    giro = org.get("giro") or "Servicios Comerciales"
    domicilio = f"{org.get('direccion') or 'Calle Principal S/N'}, {org.get('comuna') or 'Punta Arenas'}"

    # 2. Calcular IVA total declarado en los períodos solicitados desde f29_forms
    iva_total = 0.0
    if payload.periodos:
        f29_res = db.table("f29_forms")\
            .select("debito_fiscal, total_a_pagar, periodo")\
            .eq("organization_id", payload.organization_id)\
            .in_("periodo", [f"{p}-01" if len(p) == 7 else p for p in payload.periodos])\
            .execute()
        if f29_res.data:
            iva_total = sum(float(r.get("debito_fiscal") or r.get("total_a_pagar") or 0) for r in f29_res.data)

    # 3. Ensamblar datos del documento
    builder_data = {
        "doc_type": payload.document_type,
        "razon_social": razon_social,
        "rut_empresa": rut_empresa,
        "rep_legal": "REPRESENTANTE LEGAL DESIGNADO",
        "rep_rut": "15.999.888-7",
        "domicilio": domicilio,
        "giro": giro,
        "periodos": payload.periodos,
        "iva_declarado": iva_total,
        "numero_citacion": payload.numero_citacion,
        "argumentos_adicionales": payload.argumentos_adicionales
    }

    # 4. Generar el binario DOCX
    docx_stream = SIILegalDefenseBuilder.build_docx(builder_data)
    
    # 5. Registrar en sii_defense_documents
    import unicodedata, re
    clean_name = unicodedata.normalize('NFKD', razon_social).encode('ASCII', 'ignore').decode('ASCII')
    clean_name = re.sub(r'[^a-zA-Z0-9_]', '', clean_name.replace(" ", "_"))[:20]
    filename = f"Escrito_SII_{payload.document_type}_{clean_name}.docx"
    
    db.table("sii_defense_documents").insert({
        "organization_id": payload.organization_id,
        "document_type": payload.document_type,
        "titulo": f"Escrito SII: {payload.document_type.replace('_', ' ').title()}",
        "target_entity": "Dirección Regional SII XII Región Magallanes y Antártica Chilena",
        "periodos_involucrados": payload.periodos,
        "representante_legal_nombre": builder_data["rep_legal"],
        "representante_legal_rut": builder_data["rep_rut"],
        "domicilio": domicilio,
        "iva_declarado_total": iva_total,
        "file_name": filename,
        "status": "generado"
    }).execute()

    # 6. Stream como descarga Word
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Access-Control-Expose-Headers": "Content-Disposition"
    }
    
    return StreamingResponse(
        docx_stream,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers=headers
    )
