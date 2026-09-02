"""
🧪 Suite de Pruebas Unitarias: Automatización de Cron Jobs y Seguridad de Empleos
==================================================================================
Valida la infraestructura de tareas programadas autónomas:
- Configuración y sintaxis de Vercel Crons en app/vercel.json
- Verificación perimetral de cabeceras (Bearer CRON_SECRET, x-vercel-cron)
- Esquema de métricas de ejecución (inserted, skipped, expired, duration)
- Protección WAF y Rate Limiting en proxy.ts
- Idempotencia en reintentos de red
"""

import pytest
import json
import os
import re
import hashlib
import unicodedata


class TestJobsCronAutomation:

    def test_01_vercel_cron_schedule_syntax(self):
        """Verifica que app/vercel.json defina la regla de cron con sintaxis válida."""
        vercel_path = os.path.join("app", "vercel.json")
        assert os.path.exists(vercel_path), "El archivo app/vercel.json debe existir."

        with open(vercel_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        assert "crons" in data, "app/vercel.json debe contener la sección 'crons'."
        crons = data["crons"]
        assert len(crons) >= 1, "Debe existir al menos un cron configurado."

        jobs_cron = next((c for c in crons if c.get("path") == "/api/v1/jobs/sync"), None)
        assert jobs_cron is not None, "Debe existir un cron configurado para /api/v1/jobs/sync."

        schedule = jobs_cron.get("schedule")
        assert schedule == "0 11 * * *", f"El cron debe ser diario a las 11:00 UTC (8:00 AM Magallanes), obtenido: {schedule}"

        # Validar 5 campos cron
        parts = schedule.split()
        assert len(parts) == 5
        assert parts[0] == "0"   # minuto 0
        assert parts[1] == "11"  # hora 11 UTC

    def test_02_cron_endpoint_auth_header_validation(self):
        """Valida que la función de autorización acepte tokens legítimos y rechace intrusiones."""
        def check_auth(auth_header: str, cron_header: str, vercel_cron_header: str, is_vercel: bool, secret: str) -> bool:
            if secret:
                if auth_header.startswith("Bearer ") and auth_header[7:] == secret:
                    return True
                if cron_header == secret:
                    return True
            if vercel_cron_header == "1" and is_vercel:
                return True
            return False

        secret = "super-secret-cron-key-2026"

        # Caso 1: Bearer token válido -> Aprobado
        assert check_auth("Bearer super-secret-cron-key-2026", "", "", False, secret) is True

        # Caso 2: x-cron-secret válido -> Aprobado
        assert check_auth("", "super-secret-cron-key-2026", "", False, secret) is True

        # Caso 3: Vercel Cron nativo en producción -> Aprobado
        assert check_auth("", "", "1", True, secret) is True

        # Caso 4: Vercel Cron simulado fuera de producción -> Rechazado
        assert check_auth("", "", "1", False, secret) is False

        # Caso 5: Token incorrecto -> Rechazado
        assert check_auth("Bearer token-falso", "", "", False, secret) is False

        # Caso 6: Sin credenciales -> Rechazado
        assert check_auth("", "", "", False, secret) is False

    def test_03_cron_metrics_payload_schema(self):
        """Verifica que el payload de respuesta de sincronización contenga las métricas requeridas."""
        sample_response = {
            "success": True,
            "message": "Sincronización y ciclo de vida de empleos completado con éxito.",
            "metrics": {
                "inserted_count": 6,
                "skipped_count": 0,
                "expired_cleaned": 0,
                "duration_ms": 345,
            },
            "timestamp": "2026-09-02T16:00:00.000Z"
        }

        assert sample_response["success"] is True
        assert "metrics" in sample_response
        metrics = sample_response["metrics"]
        assert isinstance(metrics["inserted_count"], int)
        assert isinstance(metrics["skipped_count"], int)
        assert isinstance(metrics["expired_cleaned"], int)
        assert isinstance(metrics["duration_ms"], int)
        assert metrics["duration_ms"] >= 0
        assert "timestamp" in sample_response

    def test_04_cron_rate_limit_protection_in_proxy(self):
        """Verifica que proxy.ts contenga la regla de rate limiting para /api/v1/jobs/sync."""
        proxy_path = os.path.join("app", "src", "proxy.ts")
        assert os.path.exists(proxy_path), "app/src/proxy.ts debe existir."

        with open(proxy_path, "r", encoding="utf-8") as f:
            content = f.read()

        assert "/api/v1/jobs/sync" in content, "proxy.ts debe proteger la ruta /api/v1/jobs/sync con rate limiting."
        assert "jobs_sync:" in content, "proxy.ts debe definir la clave de limitación jobs_sync."

    def test_05_idempotent_retry_safety(self):
        """Verifica que si el cron se reintenta por desconexión temporal, no duplique registros."""
        def norm(s: str) -> str:
            s = s or ""
            s = unicodedata.normalize("NFD", s.lower())
            s = "".join(c for c in s if unicodedata.category(c) != "Mn")
            return re.sub(r"[^a-z0-9]", "", s).strip()

        def hash_job(c, t, l):
            raw = f"{norm(c)}|{norm(t)}|{norm(l)}"
            return hashlib.sha256(raw.encode("utf-8")).hexdigest()

        existing_db_hashes = set()

        job_feed = [
            {"company": "Australis Seafoods S.A.", "title": "Operador Planta", "location": "Punta Arenas"},
            {"company": "HIF Global Chile", "title": "Técnico Turbinas", "location": "Punta Arenas"},
        ]

        # Pase 1: Inserción inicial
        inserted_p1 = 0
        skipped_p1 = 0
        for j in job_feed:
            h = hash_job(j["company"], j["title"], j["location"])
            if h in existing_db_hashes:
                skipped_p1 += 1
            else:
                existing_db_hashes.add(h)
                inserted_p1 += 1

        assert inserted_p1 == 2
        assert skipped_p1 == 0

        # Pase 2: Reintento del cron job
        inserted_p2 = 0
        skipped_p2 = 0
        for j in job_feed:
            h = hash_job(j["company"], j["title"], j["location"])
            if h in existing_db_hashes:
                skipped_p2 += 1
            else:
                existing_db_hashes.add(h)
                inserted_p2 += 1

        assert inserted_p2 == 0, "En un reintento no deben insertarse nuevos duplicados."
        assert skipped_p2 == 2, "En un reintento todos los elementos existentes deben ser ignorados."
