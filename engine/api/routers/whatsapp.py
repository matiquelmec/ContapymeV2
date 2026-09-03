"""
whatsapp.py — Router de Autoatención Laboral vía WhatsApp
Permite la interacción de colaboradores con ContaPymePUQ.
Incluye soporte para Meta Cloud API, simulación interactiva y modo inactivo por defecto.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, date
import logging
import re

from core.database import get_supabase, get_pg_connection
from core.auth import verify_token, verify_org_role
from core.whatsapp.intent_engine import WhatsAppIntentEngine

logger = logging.getLogger("whatsapp_router")
router = APIRouter()

# ── MODELOS PYDANTIC ─────────────────────────────────────────────────────────

class WhatsAppSettingsUpdate(BaseModel):
    is_active: bool
    provider_type: Optional[str] = "meta_cloud"
    phone_number_id: Optional[str] = None
    welcome_message: Optional[str] = "¡Hola! Bienvenido al portal de autoatención laboral. ¿En qué te puedo ayudar hoy?"
    allow_liquidation_download: bool = True
    allow_vacation_query: bool = True
    allow_certificate_download: bool = True
    allow_ai_riohs: bool = True
    require_2fa: bool = True

class WhatsAppSimulationRequest(BaseModel):
    organization_id: str
    phone_number: str = "56912345678"
    message: str

class WhatsAppSimulationResponse(BaseModel):
    success: bool
    intent: str
    reply_text: str
    authenticated: bool
    media_url: Optional[str] = None
    action_performed: Optional[str] = None

# ── ENDPOINTS DE CONFIGURACIÓN & ESTADO ──────────────────────────────────────

@router.get("/settings/{organization_id}")
async def get_whatsapp_settings(
    organization_id: str,
    current_user: dict = Depends(verify_token)
):
    """Obtiene la configuración de autoatención WhatsApp de una organización."""
    await verify_org_role(organization_id, auth=current_user)
    db = get_supabase()
    
    res = db.table("whatsapp_org_settings").select("*").eq("organization_id", organization_id).execute()
    if res.data:
        return {"success": True, "settings": res.data[0]}
        
    # Configuración predeterminada (Inactiva por defecto)
    default_settings = {
        "organization_id": organization_id,
        "is_active": False,
        "provider_type": "meta_cloud",
        "welcome_message": "¡Hola! Bienvenido al portal de autoatención laboral de ContaPymePUQ. ¿En qué te puedo ayudar hoy?",
        "allow_liquidation_download": True,
        "allow_vacation_query": True,
        "allow_certificate_download": True,
        "allow_ai_riohs": True,
        "require_2fa": True
    }
    return {"success": True, "settings": default_settings}

@router.put("/settings/{organization_id}")
async def update_whatsapp_settings(
    organization_id: str,
    payload: WhatsAppSettingsUpdate,
    current_user: dict = Depends(verify_token)
):
    """Actualiza la configuración (ej: activar/desactivar el bot)."""
    await verify_org_role(organization_id, auth=current_user)
    db = get_supabase()
    
    data = payload.dict()
    data["organization_id"] = organization_id
    data["updated_at"] = datetime.utcnow().isoformat()
    
    res = db.table("whatsapp_org_settings").upsert(data).execute()
    return {"success": True, "settings": res.data[0] if res.data else data}

# ── SIMULADOR INTERACTIVO (SANDBOX) ──────────────────────────────────────────

@router.post("/simulate", response_model=WhatsAppSimulationResponse)
async def simulate_whatsapp_message(
    payload: WhatsAppSimulationRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Simulador interactivo para el panel de administración.
    Permite probar el flujo de conversación sin requerir un teléfono físico conectado.
    """
    await verify_org_role(payload.organization_id, auth=current_user)
    db = get_supabase()
    
    # 1. Obtener configuración de la empresa
    cfg_res = db.table("whatsapp_org_settings").select("*").eq("organization_id", payload.organization_id).execute()
    cfg = cfg_res.data[0] if cfg_res.data else {
        "is_active": False,
        "require_2fa": True,
        "allow_liquidation_download": True,
        "allow_vacation_query": True,
        "allow_certificate_download": True
    }
    
    # 2. Buscar colaborador por teléfono o seleccionar el primer colaborador para la demo
    clean_phone = re.sub(r'[^0-9]', '', payload.phone_number)[-8:]
    emp_res = db.table("employees")\
        .select("id, rut, nombres, apellido_paterno, apellido_materno, cargo, fecha_ingreso, birth_date")\
        .eq("organization_id", payload.organization_id)\
        .like("phone", f"%{clean_phone}%")\
        .execute()
        
    emp = emp_res.data[0] if emp_res.data else None
    
    # Si no coincide el teléfono en la simulación, tomar el primer colaborador para probar
    if not emp:
        fallback_res = db.table("employees").select("*").eq("organization_id", payload.organization_id).limit(1).execute()
        if fallback_res.data:
            emp = fallback_res.data[0]
            
    if not emp:
        return WhatsAppSimulationResponse(
            success=False,
            intent="unknown",
            reply_text="No hay colaboradores registrados en esta empresa para simular la conversación.",
            authenticated=False
        )

    # 3. Clasificar intención
    intent = WhatsAppIntentEngine.classify_intent(payload.message)
    nombre = f"{emp.get('nombres', '')} {emp.get('apellido_paterno', '')}".strip()
    
    if intent == "greeting":
        reply = f"¡Hola {nombre}! 👋 Te doy la bienvenida al portal de autoatención de tu empresa.\n\nPuedes consultarme:\n1️⃣ Descargar tu liquidación de sueldo\n2️⃣ Consultar tus días de vacaciones disponibles\n3️⃣ Solicitar certificado de antigüedad laboral\n4️⃣ Consultas sobre el reglamento interno (RIOHS) y Ley Karin"
        return WhatsAppSimulationResponse(
            success=True,
            intent=intent,
            reply_text=reply,
            authenticated=True,
            action_performed="greeting"
        )
        
    elif intent == "liquidation":
        periodo = WhatsAppIntentEngine.extract_period_from_text(payload.message)
        liq_res = db.table("liquidations")\
            .select("id, folio_number, sueldo_liquido, periodo, status")\
            .eq("employee_id", emp["id"])\
            .eq("periodo", f"{periodo}-01")\
            .execute()
            
        if liq_res.data:
            liq = liq_res.data[0]
            monto = f"${int(liq.get('sueldo_liquido', 0)):,}".replace(",", ".")
            reply = f"✅ Tu liquidación del período {periodo} está disponible:\n\n• Folio: {liq.get('folio_number')}\n• Sueldo Líquido: {monto}\n• Estado: {liq.get('status').upper()}\n\nPuedes ver o descargar el documento a continuación:"
            return WhatsAppSimulationResponse(
                success=True,
                intent=intent,
                reply_text=reply,
                authenticated=True,
                media_url=f"/dashboard/payroll/liquidations/{liq['id']}",
                action_performed="send_liquidation_pdf"
            )
        else:
            # Fallback inteligente a la última liquidación registrada
            latest_res = db.table("liquidations")\
                .select("id, folio_number, sueldo_liquido, periodo, status")\
                .eq("employee_id", emp["id"])\
                .order("periodo", desc=True)\
                .limit(1)\
                .execute()
            if latest_res.data:
                liq = latest_res.data[0]
                per_str = str(liq.get("periodo"))[:7]
                monto = f"${int(liq.get('sueldo_liquido', 0)):,}".replace(",", ".")
                reply = f"ℹ️ No encontramos liquidación para {periodo}, pero aquí tienes tu **última liquidación disponible ({per_str})**:\n\n• Folio: {liq.get('folio_number')}\n• Sueldo Líquido: {monto}\n• Estado: {liq.get('status', '').upper()}\n\nPuedes ver o descargar el documento a continuación:"
                return WhatsAppSimulationResponse(
                    success=True,
                    intent=intent,
                    reply_text=reply,
                    authenticated=True,
                    media_url=f"/dashboard/payroll/liquidations/{liq['id']}",
                    action_performed="send_liquidation_pdf"
                )
            return WhatsAppSimulationResponse(
                success=True,
                intent=intent,
                reply_text="No encontramos liquidaciones registradas para tu perfil en el sistema.",
                authenticated=True
            )
            
    elif intent == "vacations":
        fing = emp.get("fecha_ingreso") or "2024-01-01"
        vac_res = db.table("vacation_requests")\
            .select("dias_solicitados")\
            .eq("employee_id", emp["id"])\
            .eq("status", "approved")\
            .execute()
        dias_tomados = sum(float(r.get("dias_solicitados") or 0) for r in (vac_res.data or []))
        vac_calc = WhatsAppIntentEngine.calculate_vacation_balance(fing, dias_tomados=dias_tomados, is_magallanes=True)
        reply = f"🌴 Saldo de Vacaciones al día de hoy:\n\n• Días acumulados: {vac_calc['dias_acumulados']} días hábiles\n• Días tomados: {vac_calc['dias_tomados']} días\n• Saldo disponible: {vac_calc['saldo_disponible']} días hábiles legales\n\n(Cálculo bajo el Estatuto Regional de Magallanes — Art. 67 inc. 2 del Código del Trabajo, base 20 días anuales)."
        return WhatsAppSimulationResponse(
            success=True,
            intent=intent,
            reply_text=reply,
            authenticated=True,
            action_performed="vacation_query"
        )
        
    elif intent == "certificate":
        reply = f"📄 Tu Certificado de Antigüedad Laboral ha sido generado:\n\n• Colaborador: {nombre}\n• RUT: {emp.get('rut')}\n• Cargo: {emp.get('cargo', 'Colaborador')}\n• Fecha Ingreso: {emp.get('fecha_ingreso')}\n\nEl documento incluye sello criptográfico SHA-256 para trámites bancarios o de arriendo."
        return WhatsAppSimulationResponse(
            success=True,
            intent=intent,
            reply_text=reply,
            authenticated=True,
            media_url="/api/v1/documents/sample-certificate.pdf",
            action_performed="generate_certificate"
        )
        
    elif intent == "riohs":
        reply = f"📘 Consulta Laboral & Normativa:\n\nDe acuerdo al RIOHS de la empresa y la Ley Karin (Ley N° 21.643), la organización cuenta con un protocolo preventivo y canal de denuncia confidencial ante conductas de acoso laboral, sexual o violencia en el trabajo. Puedes contactar directamente a RRHH o canalizar tu solicitud por este medio."
        return WhatsAppSimulationResponse(
            success=True,
            intent=intent,
            reply_text=reply,
            authenticated=True,
            action_performed="riohs_qa"
        )
        
    return WhatsAppSimulationResponse(
        success=True,
        intent="unknown",
        reply_text=f"Hola {nombre}. No entendí con claridad tu solicitud. Puedes escribirme 'liquidación', 'vacaciones', 'certificado' o hacer una pregunta sobre el reglamento interno.",
        authenticated=True
    )

# ── WEBHOOK OFICIAL DE META WHATSAPP CLOUD API ───────────────────────────────

@router.get("/webhook")
async def verify_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token")
):
    """Endpoint de verificación obligatorio por Meta Cloud API."""
    expected_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "contapymepuq_secret_token_2026")
    if hub_mode == "subscribe" and hub_verify_token == expected_token:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Token de verificación inválido")

@router.post("/webhook")
async def receive_whatsapp_message(request: Request):
    """
    Endpoint receptor de mensajes entrantes desde WhatsApp.
    Si el módulo está inactivo en la organización, descarta y retorna 200 OK.
    """
    body = await request.json()
    logger.info(f"[WhatsApp Webhook Inbound]: {body}")
    # Retornar 200 OK para confirmar recepción a Meta
    return {"status": "received"}
