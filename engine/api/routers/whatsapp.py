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
import os

from core.database import get_supabase, get_pg_connection
from core.auth import verify_token, verify_org_role
from core.whatsapp.intent_engine import WhatsAppIntentEngine
from core.whatsapp.provider_interface import MetaCloudWhatsAppProvider, MockWhatsAppProvider

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
    
    cfg_res = db.table("whatsapp_org_settings").select("*").eq("organization_id", payload.organization_id).execute()
    cfg = cfg_res.data[0] if cfg_res.data else {
        "is_active": False,
        "require_2fa": True,
        "allow_liquidation_download": True,
        "allow_vacation_query": True,
        "allow_certificate_download": True
    }
    
    clean_phone = re.sub(r'[^0-9]', '', payload.phone_number)[-8:]
    emp_res = db.table("employees")\
        .select("id, rut, nombres, apellido_paterno, apellido_materno, cargo, fecha_ingreso, birth_date")\
        .eq("organization_id", payload.organization_id)\
        .like("phone", f"%{clean_phone}%")\
        .execute()
        
    emp = emp_res.data[0] if emp_res.data else None
    
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
            reply = f"✅ Tu liquidación del período {periodo} está disponible:\n\n• Folio: {liq.get('folio_number')}\n• Sueldo Líquido: {monto}\n• Estado: {str(liq.get('status')).upper()}\n\nPuedes ver o descargar el documento a continuación:"
            return WhatsAppSimulationResponse(
                success=True,
                intent=intent,
                reply_text=reply,
                authenticated=True,
                media_url=f"/dashboard/payroll/liquidations/{liq['id']}",
                action_performed="send_liquidation_pdf"
            )
        else:
            latest_res = db.table("liquidations")\
                .select("id, folio_number, sueldo_liquido, periodo, status")\
                .eq("employee_id", emp["id"])\
                .order("periodo", desc=True)\
                .limit(1)\
                .execute()
                
            if latest_res.data:
                liq = latest_res.data[0]
                monto = f"${int(liq.get('sueldo_liquido', 0)):,}".replace(",", ".")
                periodo_real = str(liq.get("periodo"))[:7]
                reply = f"ℹ️ Aún no se encuentra cerrada la liquidación de {periodo}, pero tienes disponible tu última liquidación cerrada ({periodo_real}):\n\n• Folio: {liq.get('folio_number')}\n• Sueldo Líquido: {monto}\n• Estado: {str(liq.get('status')).upper()}\n\nPuedes revisarla a continuación:"
                return WhatsAppSimulationResponse(
                    success=True,
                    intent=intent,
                    reply_text=reply,
                    authenticated=True,
                    media_url=f"/dashboard/payroll/liquidations/{liq['id']}",
                    action_performed="send_liquidation_pdf"
                )
            else:
                reply = f"Hola {nombre}. Actualmente no registras liquidaciones aprobadas en el sistema para el período solicitado."
                return WhatsAppSimulationResponse(
                    success=True,
                    intent=intent,
                    reply_text=reply,
                    authenticated=True,
                    action_performed="none"
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
        reply = "📘 Consulta Laboral & Normativa:\n\nDe acuerdo al RIOHS de la empresa y la Ley Karin (Ley N° 21.643), la organización cuenta con un protocolo preventivo y canal de denuncia confidencial ante conductas de acoso laboral, sexual o violencia en el trabajo. Puedes contactar directamente a RRHH o canalizar tu solicitud por este medio."
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

# ── PROCESAMIENTO ASÍNCRONO DE MENSAJES ENTRANTES REALES ───────────────────

async def process_inbound_message(phone_number_id: str, sender_phone: str, message_text: str):
    """
    Procesa un mensaje entrante real desde Meta WhatsApp Cloud API y envía la respuesta automática.
    """
    db = get_supabase()
    clean_phone = re.sub(r'[^0-9]', '', sender_phone)[-8:]
    
    settings_query = db.table("whatsapp_org_settings").select("*").eq("is_active", True)
    if phone_number_id:
        settings_query = settings_query.eq("phone_number_id", phone_number_id)
    cfg_res = settings_query.limit(1).execute()
    
    if not cfg_res.data:
        logger.warning(f"[WhatsApp] No hay configuración activa para phone_number_id: {phone_number_id}")
        return
        
    cfg = cfg_res.data[0]
    org_id = cfg["organization_id"]
    access_token = cfg.get("access_token") or os.getenv("WHATSAPP_ACCESS_TOKEN")
    
    if not access_token:
        logger.error(f"[WhatsApp] Falta access_token para organization_id: {org_id}")
        return
        
    provider = MetaCloudWhatsAppProvider(phone_number_id=phone_number_id, access_token=access_token)
    
    emp_res = db.table("employees")\
        .select("id, rut, nombres, apellido_paterno, apellido_materno, cargo, fecha_ingreso, birth_date")\
        .eq("organization_id", org_id)\
        .like("phone", f"%{clean_phone}%")\
        .execute()
        
    emp = emp_res.data[0] if emp_res.data else None
    
    if not emp:
        msg = f"Hola! Tu número ({sender_phone}) no figura registrado en el sistema de colaboradores de la empresa. Por favor comunícate con el área de Recursos Humanos para actualizar tu ficha personal."
        await provider.send_text_message(sender_phone, msg)
        return

    nombre = f"{emp.get('nombres', '')} {emp.get('apellido_paterno', '')}".strip()
    
    session_res = db.table("whatsapp_sessions")\
        .select("*")\
        .eq("organization_id", org_id)\
        .eq("phone_number", sender_phone)\
        .execute()
        
    session = session_res.data[0] if session_res.data else None
    is_authenticated = session.get("is_authenticated", False) if session else False
    failed_attempts = session.get("failed_attempts", 0) if session else 0
    locked_until_str = session.get("locked_until") if session else None

    # Verificar si el usuario está bloqueado por fuerza bruta
    if locked_until_str:
        try:
            locked_until = datetime.fromisoformat(locked_until_str.replace("Z", "+00:00"))
            if datetime.now(locked_until.tzinfo) < locked_until:
                minutos_restantes = max(1, int((locked_until - datetime.now(locked_until.tzinfo)).total_seconds() / 60))
                await provider.send_text_message(
                    sender_phone,
                    f"🔒 Tu cuenta ha sido bloqueada temporalmente por múltiples intentos fallidos. Intenta nuevamente en {minutos_restantes} minutos o comunícate con RRHH."
                )
                return
        except Exception as lock_err:
            logger.warn(f"[WhatsApp] Error al evaluar locked_until: {lock_err}")
    
    digits_match = re.match(r'^\s*(\d{4})\s*$', message_text)
    if digits_match:
        input_digits = digits_match.group(1)
        if WhatsAppIntentEngine.validate_2fa_response(input_digits, emp):
            db.table("whatsapp_sessions").upsert({
                "organization_id": org_id,
                "phone_number": sender_phone,
                "employee_id": emp["id"],
                "is_authenticated": True,
                "auth_stage": "authenticated",
                "failed_attempts": 0,
                "locked_until": None,
                "last_interaction_at": datetime.utcnow().isoformat()
            }).execute()
            reply = f"✅ ¡Identidad verificada con éxito, {nombre}!\n\n¿En qué te puedo ayudar hoy?\n1️⃣ Escribe *'mi liquidación'* para ver tu sueldo\n2️⃣ Escribe *'mis vacaciones'* para consultar tus días disponibles en Magallanes\n3️⃣ Escribe *'certificado'* para obtener un certificado laboral\n4️⃣ Escribe tu consulta sobre el reglamento interno o Ley Karin"
            await provider.send_text_message(sender_phone, reply)
            return
        else:
            new_failed = failed_attempts + 1
            upsert_payload = {
                "organization_id": org_id,
                "phone_number": sender_phone,
                "employee_id": emp["id"],
                "is_authenticated": False,
                "auth_stage": "awaiting_2fa",
                "failed_attempts": new_failed,
                "last_interaction_at": datetime.utcnow().isoformat()
            }
            if new_failed >= 3:
                from datetime import timedelta
                lock_time = datetime.utcnow() + timedelta(minutes=30)
                upsert_payload["locked_until"] = lock_time.isoformat()
                db.table("whatsapp_sessions").upsert(upsert_payload).execute()
                await provider.send_text_message(
                    sender_phone,
                    "🔒 Has superado el límite de 3 intentos de verificación. Por tu seguridad laboral, tu acceso ha sido bloqueado por 30 minutos."
                )
                return
            else:
                db.table("whatsapp_sessions").upsert(upsert_payload).execute()
                intentos_restantes = 3 - new_failed
                await provider.send_text_message(
                    sender_phone,
                    f"❌ Los 4 dígitos ingresados no coinciden con tu registro. Te quedan {intentos_restantes} intento(s) antes del bloqueo de seguridad."
                )
                return

    if cfg.get("require_2fa", True) and not is_authenticated:
        db.table("whatsapp_sessions").upsert({
            "organization_id": org_id,
            "phone_number": sender_phone,
            "employee_id": emp["id"],
            "is_authenticated": False,
            "auth_stage": "awaiting_2fa",
            "last_interaction_at": datetime.utcnow().isoformat()
        }).execute()
        solicitud_pin = f"¡Hola {nombre}! 👋 Por tu seguridad y privacidad laboral, por favor ingresa los *últimos 4 dígitos de tu RUT* (sin contar el dígito verificador) para validar tu identidad."
        await provider.send_text_message(sender_phone, solicitud_pin)
        return

    intent = WhatsAppIntentEngine.classify_intent(message_text)
    
    if intent == "greeting":
        reply = f"¡Hola {nombre}! 👋 Te doy la bienvenida al portal de autoatención de tu empresa.\n\nPuedes consultarme:\n1️⃣ *'mi liquidación'* para descargar tu colilla de sueldo\n2️⃣ *'mis vacaciones'* para consultar tu saldo legal\n3️⃣ *'certificado'* para constancia laboral\n4️⃣ Consultas sobre el reglamento interno (RIOHS) y Ley Karin"
        await provider.send_text_message(sender_phone, reply)
        
    elif intent == "liquidation":
        periodo = WhatsAppIntentEngine.extract_period_from_text(message_text)
        liq_res = db.table("liquidations")\
            .select("id, folio_number, sueldo_liquido, periodo, status")\
            .eq("employee_id", emp["id"])\
            .eq("periodo", f"{periodo}-01")\
            .execute()
            
        liq = liq_res.data[0] if liq_res.data else None
        if not liq:
            latest_res = db.table("liquidations")\
                .select("id, folio_number, sueldo_liquido, periodo, status")\
                .eq("employee_id", emp["id"])\
                .order("periodo", desc=True)\
                .limit(1)\
                .execute()
            if latest_res.data:
                liq = latest_res.data[0]
                periodo = str(liq.get("periodo"))[:7]
                
        if liq:
            monto = f"${int(liq.get('sueldo_liquido', 0)):,}".replace(",", ".")
            frontend_base = os.getenv("FRONTEND_URL", "https://contapymepuq.vercel.app")
            liq_url = f"{frontend_base}/dashboard/payroll/liquidations/{liq['id']}"
            reply = f"✅ Tu liquidación del período {periodo} está disponible:\n\n• Folio: {liq.get('folio_number')}\n• Sueldo Líquido: {monto}\n• Estado: {str(liq.get('status')).upper()}\n\n🔗 Puedes ver y descargar tu documento oficial aquí:\n{liq_url}"
            await provider.send_text_message(sender_phone, reply)
        else:
            await provider.send_text_message(sender_phone, f"Hola {nombre}. No encontramos liquidaciones emitidas actualmente en el sistema para tu perfil.")
            
    elif intent == "vacations":
        fing = emp.get("fecha_ingreso") or "2024-01-01"
        vac_res = db.table("vacation_requests")\
            .select("dias_solicitados")\
            .eq("employee_id", emp["id"])\
            .eq("status", "approved")\
            .execute()
        dias_tomados = sum(float(r.get("dias_solicitados") or 0) for r in (vac_res.data or []))
        vac_calc = WhatsAppIntentEngine.calculate_vacation_balance(fing, dias_tomados=dias_tomados, is_magallanes=True)
        reply = f"🌴 Saldo de Vacaciones al día de hoy ({nombre}):\n\n• Días acumulados: {vac_calc['dias_acumulados']} días hábiles\n• Días tomados: {vac_calc['dias_tomados']} días\n• Saldo disponible: {vac_calc['saldo_disponible']} días hábiles legales\n\n(Cálculo bajo el Estatuto Regional de Magallanes — Art. 67 inc. 2 del Código del Trabajo, base 20 días anuales)."
        await provider.send_text_message(sender_phone, reply)
        
    elif intent == "certificate":
        reply = f"📄 Certificado de Antigüedad Laboral ({nombre}):\n\n• RUT: {emp.get('rut')}\n• Cargo: {emp.get('cargo', 'Colaborador')}\n• Fecha Ingreso: {emp.get('fecha_ingreso')}\n\nPuedes descargar tu constancia con sello de validación desde el portal de la empresa."
        await provider.send_text_message(sender_phone, reply)
        
    elif intent == "riohs":
        reply = "📘 Consulta Laboral & Normativa:\n\nDe acuerdo al RIOHS de la empresa y la Ley Karin (Ley N° 21.643), la organización cuenta con un protocolo preventivo y canal de denuncia confidencial ante conductas de acoso laboral, sexual o violencia en el trabajo. Puedes contactar directamente a RRHH o canalizar tu solicitud por este medio."
        await provider.send_text_message(sender_phone, reply)
        
    else:
        await provider.send_text_message(sender_phone, f"Hola {nombre}. No entendí con claridad tu solicitud. Puedes escribirme 'liquidación', 'vacaciones', 'certificado' o hacer una pregunta sobre el reglamento interno.")

    db.table("whatsapp_message_logs").insert({
        "organization_id": org_id,
        "sender_phone": sender_phone,
        "direction": "inbound",
        "message_text": message_text,
        "intent_detected": intent,
        "status": "processed"
    }).execute()

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
    Endpoint receptor de mensajes entrantes desde Meta WhatsApp Cloud API.
    Procesa el mensaje del colaborador, evalúa la intención con el IntentEngine
    y despacha la respuesta automática vía MetaCloudWhatsAppProvider.
    """
    body = await request.json()
    logger.info(f"[WhatsApp Webhook Inbound]: {body}")
    
    try:
        entries = body.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                val = change.get("value", {})
                messages = val.get("messages", [])
                metadata = val.get("metadata", {})
                phone_number_id = metadata.get("phone_number_id")
                
                for msg in messages:
                    sender_phone = msg.get("from")
                    msg_type = msg.get("type")
                    msg_body = ""
                    if msg_type == "text":
                        msg_body = msg.get("text", {}).get("body", "").strip()
                    elif msg_type == "interactive":
                        msg_body = msg.get("interactive", {}).get("button_reply", {}).get("title", "")
                        
                    if sender_phone and msg_body:
                        await process_inbound_message(phone_number_id, sender_phone, msg_body)
    except Exception as e:
        logger.error(f"[WhatsApp Webhook Error]: {e}", exc_info=True)
        
    return {"status": "received"}
