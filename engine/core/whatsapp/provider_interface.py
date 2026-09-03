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
