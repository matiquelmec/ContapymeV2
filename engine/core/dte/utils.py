import json
from typing import Any, Optional


def prepare_sii_raw_response(raw_text: Optional[str], max_len: int = 65536) -> Optional[str]:
    """Prepare a raw SII response for safe persistence.

    - If None, returns None.
    - If length <= max_len, returns as-is.
    - If longer, store a JSON object with head/tail snippets and original length.
    This avoids saving multi-megabyte SOAP bodies directly into user-visible columns.
    """
    if raw_text is None:
        return None

    try:
        if not isinstance(raw_text, str):
            raw_text = str(raw_text)

        if len(raw_text) <= max_len:
            return raw_text

        head_len = 4096
        tail_len = 4096
        head = raw_text[:head_len]
        tail = raw_text[-tail_len:]
        truncated = {
            "truncated": True,
            "original_length": len(raw_text),
            "head": head,
            "tail": tail
        }
        return json.dumps(truncated)
    except Exception:
        # In the worst case, fall back to a short marker.
        return "<sii_raw_response_unavailable>"


def sanitize_sii_payload(payload: Any, max_raw_len: int = 4096) -> Any:
    """Return a JSON-safe SII payload without embedding large raw bodies."""
    if payload is None:
        return None

    if not isinstance(payload, dict):
        return payload

    sanitized = dict(payload)
    for key in ("raw_response", "raw_xml", "resp_text"):
        if key in sanitized:
            sanitized[key] = prepare_sii_raw_response(sanitized.get(key), max_raw_len)
    return sanitized
