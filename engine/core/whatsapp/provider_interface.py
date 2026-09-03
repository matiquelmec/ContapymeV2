"""
provider_interface.py — Abstracción de Proveedor de Mensajería WhatsApp
Permite alternar transparentemente entre Meta Cloud API y Web Sidecar.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

class WhatsAppProvider(ABC):
    @abstractmethod
    async def send_text_message(self, to_phone: str, text: str) -> Dict[str, Any]:
        """Envía un mensaje de texto al colaborador."""
        pass

    @abstractmethod
    async def send_document(self, to_phone: str, document_url: str, filename: str, caption: Optional[str] = None) -> Dict[str, Any]:
        """Envía un archivo (ej: PDF de liquidación) al colaborador."""
        pass

import re
import httpx
import logging

logger = logging.getLogger("whatsapp_meta_provider")

class MetaCloudWhatsAppProvider(WhatsAppProvider):
    """Proveedor oficial de Meta WhatsApp Cloud API."""
    
    def __init__(self, phone_number_id: str, access_token: str):
        self.phone_number_id = phone_number_id
        self.access_token = access_token
        self.api_url = f"https://graph.facebook.com/v21.0/{phone_number_id}/messages"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

    async def send_text_message(self, to_phone: str, text: str) -> Dict[str, Any]:
        clean_phone = re.sub(r'[^0-9]', '', to_phone)
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_phone,
            "type": "text",
            "text": {
                "preview_url": True,
                "body": text
            }
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(self.api_url, json=payload, headers=self.headers)
                data = res.json()
                if res.status_code >= 400:
                    logger.error(f"[Meta WhatsApp Send Text Error]: {res.status_code} - {data}")
                return {"status": "sent" if res.status_code < 400 else "error", "response": data}
        except Exception as e:
            logger.error(f"[Meta WhatsApp Network Error]: {e}")
            return {"status": "error", "detail": str(e)}

    async def send_document(self, to_phone: str, document_url: str, filename: str, caption: Optional[str] = None) -> Dict[str, Any]:
        clean_phone = re.sub(r'[^0-9]', '', to_phone)
        doc_payload: Dict[str, Any] = {
            "link": document_url,
            "filename": filename
        }
        if caption:
            doc_payload["caption"] = caption

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_phone,
            "type": "document",
            "document": doc_payload
        }
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(self.api_url, json=payload, headers=self.headers)
                data = res.json()
                if res.status_code >= 400:
                    logger.error(f"[Meta WhatsApp Send Doc Error]: {res.status_code} - {data}")
                return {"status": "sent" if res.status_code < 400 else "error", "response": data}
        except Exception as e:
            logger.error(f"[Meta WhatsApp Network Error]: {e}")
            return {"status": "error", "detail": str(e)}

class MockWhatsAppProvider(WhatsAppProvider):
    """Proveedor mock para pruebas unitarias y entornos cerrados (sandbox)."""
    def __init__(self):
        self.sent_messages = []

    async def send_text_message(self, to_phone: str, text: str) -> Dict[str, Any]:
        self.sent_messages.append({"type": "text", "to": to_phone, "text": text})
        return {"status": "success", "provider": "mock", "to": to_phone}

    async def send_document(self, to_phone: str, document_url: str, filename: str, caption: Optional[str] = None) -> Dict[str, Any]:
        self.sent_messages.append({"type": "document", "to": to_phone, "url": document_url, "filename": filename, "caption": caption})
        return {"status": "success", "provider": "mock", "to": to_phone, "filename": filename}

