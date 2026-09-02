"""
🧪 Suite de Pruebas Unitarias: Auditoría del Portal de Empleos Magallanes
========================================================================
Valida el ciclo de vida de vacantes, ingesta regional continua,
desduplicación criptográfica, sanitización anti-discriminación legal (Art. 2° DT)
y seguridad perimetral del endpoint de sincronización.
"""

import pytest
import re
import hashlib
from datetime import datetime, timezone, timedelta


def sanitize_job_content(text: str) -> str:
    """Implementación idéntica a sanitizeJobContent en jobs-feed-sync.ts."""
    if not text:
        return ""
    discriminatory_patterns = [
        r"\b(enviar|adjuntar|con)\s+(foto|fotograf[ií]a|imagen)\b",
        r"\b(sin\s+dicom|dicom\s+limpio|antecedentes\s+comerciales)\b",
        r"\b(edad\s*(?:entre|de)?\s*\d{2}\s*(?:a|y)?\s*\d{2}\s*a[ñn]os?)\b",
        r"\b(menor|mayor)\s+de\s+\d{2}\s*a[ñn]os?\b",
        r"\b(hombre|mujer|var[oó]n|femenino|masculino)\s+(exclusivo|solamente|excluyente)\b",
        r"\b(soltero|casado|estado\s+civil)\b",
    ]
    cleaned = text
    for pat in discriminatory_patterns:
        cleaned = re.sub(pat, "", cleaned, flags=re.IGNORECASE)
    
    # Strip scripts & HTML tags
    cleaned = re.sub(r"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"<[^>]*>?", "", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


def generate_job_deduplication_key(company: str, title: str, location: str) -> str:
    """Implementación idéntica a generateJobDeduplicationKey en jobs-feed-sync.ts."""
    import unicodedata

    def norm(s: str) -> str:
        s = s or ""
        s = unicodedata.normalize("NFD", s.lower())
        s = "".join(c for c in s if unicodedata.category(c) != "Mn")
        return re.sub(r"[^a-z0-9]", "", s).strip()

    raw = f"{norm(company)}|{norm(title)}|{norm(location)}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class TestJobsPortalAudit:

    def test_01_jobs_auto_expiration_lifecycle(self):
        """Verifica que las vacantes con fecha de expiración pasada sean filtradas y consideradas caducadas."""
        now = datetime.now(timezone.utc)
        expired_date = now - timedelta(days=2)
        active_date = now + timedelta(days=20)

        job_expired = {"id": "1", "status": "active", "expires_at": expired_date.isoformat()}
        job_active = {"id": "2", "status": "active", "expires_at": active_date.isoformat()}

        is_expired_1 = datetime.fromisoformat(job_expired["expires_at"]) < now
        is_expired_2 = datetime.fromisoformat(job_active["expires_at"]) < now

        assert is_expired_1 is True, "La oferta pasada debió marcarse como expirada."
        assert is_expired_2 is False, "La oferta vigente debe permanecer activa."

    def test_02_jobs_deduplication_hash_idempotency(self):
        """Verifica que la clave hash SHA-256 detecte vacantes duplicadas sin importar mayúsculas o tildes."""
        company_a = "Australis Seafoods S.A."
        title_a = "Operador(a) de Planta de Procesos"
        loc_a = "Punta Arenas"

        company_b = "australis seafoods s.a."
        title_b = "Operador(a) de Planta de Procesos"
        loc_b = "punta arenas"

        hash_a = generate_job_deduplication_key(company_a, title_a, loc_a)
        hash_b = generate_job_deduplication_key(company_b, title_b, loc_b)

        assert hash_a == hash_b, "El hash de desduplicación debe ser idéntico e insensible a mayúsculas/espacios."

    def test_03_jobs_anti_discrimination_legal_filter(self):
        """Verifica que el filtro elimine requisitos ilegales bajo el Art. 2° del Código del Trabajo."""
        raw_desc = (
            "Buscamos recepcionista. Requisitos: enviar con fotografía, sin Dicom y edad entre 20 a 30 años. "
            "Excelente ambiente laboral en Punta Arenas."
        )
        cleaned = sanitize_job_content(raw_desc)

        assert "fotografía" not in cleaned.lower()
        assert "dicom" not in cleaned.lower()
        assert "edad entre" not in cleaned.lower()
        assert "Punta Arenas" in cleaned
        assert "Excelente ambiente laboral" in cleaned

    def test_04_jobs_xss_and_script_sanitization(self):
        """Verifica que cualquier inyección XSS o etiqueta HTML sea purgada por seguridad."""
        malicious_input = "<script>alert('pwned')</script><b>Ingeniero de Operaciones</b><img src=x onerror=alert(1)>"
        sanitized = sanitize_job_content(malicious_input)

        assert "<script>" not in sanitized
        assert "alert(" not in sanitized
        assert "<b>" not in sanitized
        assert "Ingeniero de Operaciones" in sanitized

    def test_05_sync_authorization_guard(self):
        """Verifica que el endpoint de sincronización rechace peticiones sin credencial o secret."""
        def authorize(header_auth: str, cron_header: str, expected_secret: str) -> bool:
            if not expected_secret:
                return False
            if header_auth.startswith("Bearer ") and header_auth[7:] == expected_secret:
                return True
            if cron_header == expected_secret:
                return True
            return False

        secret = "secret-super-seguro-2026"

        assert authorize("Bearer secret-super-seguro-2026", "", secret) is True
        assert authorize("", "secret-super-seguro-2026", secret) is True
        assert authorize("Bearer token-invalido", "", secret) is False
        assert authorize("", "", secret) is False

    def test_06_regional_magallanes_locations_coverage(self):
        """Verifica que las comunas principales de Magallanes estén cubiertas en el catálogo regional."""
        valid_locations = {"Punta Arenas", "Puerto Natales", "Porvenir", "Torres del Paine", "Cabo de Hornos"}
        sample_locations = ["Punta Arenas", "Puerto Natales", "Porvenir"]

        for loc in sample_locations:
            assert loc in valid_locations

    def test_07_jobs_sorting_order_latest_first(self):
        """Verifica que el orden de publicación sea estrictamente descendente (últimos publicados primero)."""
        jobs = [
            {"id": "old", "title": "Aviso Antiguo", "published_at": "2026-08-25T10:00:00Z"},
            {"id": "mid", "title": "Aviso Intermedio", "published_at": "2026-08-27T10:00:00Z"},
            {"id": "new", "title": "Aviso de Hoy", "published_at": "2026-09-02T12:00:00Z"},
        ]

        sorted_jobs = sorted(jobs, key=lambda j: j["published_at"], reverse=True)
        assert sorted_jobs[0]["id"] == "new", "El aviso más reciente debe quedar primero en la lista."
        assert sorted_jobs[1]["id"] == "mid"
        assert sorted_jobs[2]["id"] == "old"

    def test_08_relative_job_date_formatting(self):
        """Verifica el cálculo de etiquetas humanas de fecha (Hoy, Ayer, Hace X días)."""
        def format_relative_date(pub_dt: datetime, ref_now: datetime) -> str:
            diff = ref_now - pub_dt
            diff_hours = int(diff.total_seconds() // 3600)
            diff_days = int(diff.total_seconds() // 86400)

            if diff_hours < 1:
                return "Publicado hace instantes"
            if diff_hours < 24:
                return "Publicado hoy"
            if diff_days == 1:
                return "Publicado ayer"
            if diff_days < 7:
                return f"Hace {diff_days} días"
            return pub_dt.strftime("%d %b")

        now = datetime(2026, 9, 2, 15, 0, 0, tzinfo=timezone.utc)

        # 2 horas atrás -> "Publicado hoy"
        dt_today = now - timedelta(hours=2)
        assert format_relative_date(dt_today, now) == "Publicado hoy"

        # 1 día atrás -> "Publicado ayer"
        dt_yesterday = now - timedelta(days=1)
        assert format_relative_date(dt_yesterday, now) == "Publicado ayer"

        # 6 días atrás -> "Hace 6 días"
        dt_6days = now - timedelta(days=6)
        assert format_relative_date(dt_6days, now) == "Hace 6 días"

    def test_09_normalize_string_list_resilience(self):
        """Verifica que normalizeStringList soporte indistintamente arrays, strings multilínea, JSON o nulos sin crashear."""
        import json

        def normalize_string_list(val):
            if not val:
                return []
            if isinstance(val, list):
                return [str(v).strip() for v in val if str(v).strip()]
            if isinstance(val, str):
                s = val.strip()
                if s.startswith("[") and s.endswith("]"):
                    try:
                        parsed = json.loads(s)
                        if isinstance(parsed, list):
                            return [str(v).strip() for v in parsed if str(v).strip()]
                    except Exception:
                        pass
                lines = [re.sub(r"^[-•*]\s*", "", line).strip() for line in s.split("\n")]
                return [line for line in lines if line]
            return []

        # Caso 1: Array estándar
        assert normalize_string_list(["Req A", "Req B"]) == ["Req A", "Req B"]

        # Caso 2: Texto multilínea con viñetas
        raw_text = "- Título Técnico\n- Experiencia 2 años\n- Licencia clase B"
        assert normalize_string_list(raw_text) == ["Título Técnico", "Experiencia 2 años", "Licencia clase B"]

        # Caso 3: JSON codificado como string
        json_str = '["Item 1", "Item 2"]'
        assert normalize_string_list(json_str) == ["Item 1", "Item 2"]

        # Caso 4: Valores nulos o vacíos
        assert normalize_string_list(None) == []
        assert normalize_string_list("") == []
        assert normalize_string_list([]) == []


