"""
Contapyme V2 — Servicio de Auditoría y Trazabilidad (Audit Logs)
Permite registrar acciones críticas realizadas por usuarios o por el sistema.
"""
import logging
from typing import Any, Optional
from datetime import datetime, timezone
from .database import get_supabase

# Logger estándar de Python para consola con soporte seguro para Unicode/emojis en Windows
class UnicodeSafeStreamHandler(logging.StreamHandler):
    def emit(self, record: logging.LogRecord) -> None:
        try:
            msg = self.format(record)
            stream = self.stream
            if stream is None:
                return
            
            encoding = getattr(stream, "encoding", None) or "utf-8"
            try:
                stream.write(msg + self.terminator)
            except UnicodeEncodeError:
                try:
                    # Intenta codificar de forma segura reemplazando caracteres que no existan en la codificación actual
                    safe_bytes = msg.encode(encoding, errors="replace")
                    safe_msg = safe_bytes.decode(encoding)
                except Exception:
                    # Fallback extremo reemplazando cualquier caracter no-ASCII por '?'
                    safe_msg = "".join(c if ord(c) < 128 else "?" for c in msg)
                stream.write(safe_msg + self.terminator)
            self.flush()
        except RecursionError:
            raise
        except Exception:
            self.handleError(record)

logger = logging.getLogger("contapyme.audit")
logger.setLevel(logging.INFO)

# Configurar el manejador seguro
handler = UnicodeSafeStreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

def log_activity(
    action: str,
    organization_id: str,
    user_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> bool:
    """
    Registra una actividad en la tabla audit_logs de Supabase.
    """
    try:
        supabase = get_supabase()
        
        # Insertar en DB
        data = {
            "action": action,
            "organization_id": organization_id,
            "user_id": user_id,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Usamos service_role para que el motor siempre pueda escribir el log
        res = supabase.table("audit_logs").insert(data).execute()
        
        if len(res.data) > 0:
            logger.info(f"Audit log created: {action} (org: {organization_id})")
            return True
        else:
            logger.error(f"Failed to insert audit log for {action}")
            return False
            
    except Exception as e:
        logger.error(f"CRITICAL: Failed to write audit log: {str(e)}")
        # Envoltorio seguro: no queremos que el fallo de un log detenga la operación principal
        return False

def log_system_error(
    category: str,
    message: str,
    organization_id: Optional[str] = None,
    details: Optional[dict[str, Any]] = None
) -> bool:
    """
    Registra un error crítico del sistema (ej. fallo de parser) en la bitácora.
    """
    return log_activity(
        action=f"SYSTEM_ERROR_{category.upper()}",
        organization_id=organization_id or "00000000-0000-0000-0000-000000000000",
        entity_type="SYSTEM",
        entity_id=category,
        details={
            "error_message": message,
            **(details or {})
        }
    )
