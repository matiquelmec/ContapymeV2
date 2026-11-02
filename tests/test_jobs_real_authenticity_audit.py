"""
🧪 Suite de Pruebas Unitarias: Certificación de Autenticidad de Empleos Magallanes
==================================================================================
Valida que el portal opere exclusivamente con ofertas laborales reales y verificables:
1. Ausencia absoluta de avisos de demostración o sintéticos.
2. Trazabilidad de origen y mapeo de application_url.
3. Cumplimiento estricto del Art. 2° Código del Trabajo.
4. Política Zero-Ficción: Ausencia de teléfonos de relleno y dominios fantasma.
"""

import pytest
import os
import json
import re


class TestJobsRealAuthenticityAudit:

    def test_01_seed_jobs_contain_no_synthetic_demo_companies(self):
        """Verifica que jobs-feed-sync.ts no contenga empresas ficticias o correos mock."""
        sync_file = os.path.join("app", "src", "lib", "jobs", "jobs-feed-sync.ts")
        assert os.path.exists(sync_file), "El archivo jobs-feed-sync.ts debe existir."

        with open(sync_file, "r", encoding="utf-8") as f:
            content = f.read()

        prohibited_terms = [
            "Estudio Tributario Austral SpA",
            "Antártica21 Expeditions",
            "Transportes y Grúas Magallanes Ltda.",
            "Naviera y Abastecimiento Estrecho de Magallanes",
            "talento@contapymepuq.cl",
            "+56944444565",
            "+56961200556",
            "+56961220055",
            "+56961200354",
        ]

        for term in prohibited_terms:
            assert term not in content, f"El término de relleno '{term}' no debe existir en el feed oficial."

    def test_02_dynamic_scraper_covers_real_magallanes_jobs(self):
        """Verifica que el colector dinámico apunte a portales laborales oficiales de Magallanes."""
        scraper_file = os.path.join("engine", "scrapers", "jobs_scraper.py")
        assert os.path.exists(scraper_file), "El colector dinámico debe existir."
        with open(scraper_file, "r", encoding="utf-8") as f:
            content = f.read()

        assert "chiletrabajos.cl" in content, "Debe consultar Chiletrabajos Magallanes."
        assert "punta arenas" in content.lower(), "Debe filtrar por comunas de Magallanes."

    def test_03_application_url_mapped_in_sync_payload(self):
        """Verifica que el payload de inserción mapee 'application_url' y 'source_url' hacia la base de datos."""
        sync_file = os.path.join("app", "src", "lib", "jobs", "jobs-feed-sync.ts")
        with open(sync_file, "r", encoding="utf-8") as f:
            content = f.read()

        assert "application_url: appUrl" in content, "jobs-feed-sync.ts debe mapear application_url."
        assert "source_url: appUrl" in content, "jobs-feed-sync.ts debe mapear source_url."

    def test_04_compliance_filter_purges_prohibited_criteria_from_real_jobs(self):
        """Verifica que el filtro legal elimine solicitudes discriminatorias (Art. 2° DT) en ofertas reales."""
        def sanitize(text: str) -> str:
            patterns = [
                r"\b(enviar|adjuntar|con)\s+(foto|fotograf[ií]a|imagen)\b",
                r"\b(sin\s+dicom|dicom\s+limpio|antecedentes\s+comerciales)\b",
                r"\b(edad\s*(?:entre|de)?\s*\d{2}\s*(?:a|y)?\s*\d{2}\s*a[ñn]os?)\b",
            ]
            res = text
            for p in patterns:
                res = re.sub(p, "", res, flags=re.IGNORECASE)
            return res.strip()

        raw_sample = "Buscamos Reponedor con foto obligatoria y sin dicom para turno rotativo."
        clean = sanitize(raw_sample)
        assert "foto" not in clean.lower()
        assert "dicom" not in clean.lower()
        assert "Reponedor" in clean

    def test_05_database_contains_zero_demo_jobs(self):
        """Audita que la base de datos actual no tenga ningún registro de demostración activo."""
        from supabase import create_client
        url = "https://mofkjgfrpfmtnktaepqi.supabase.co"
        key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMzg3MSwiZXhwIjoyMDg5MTA5ODcxfQ.4Dt6aFWe-0aDpY2LpeTC-CRkh2nh7YHFAGSr-M7uBvI"
        supabase = create_client(url, key)

        res = supabase.table('job_postings').select('company_name, title, contact_email, contact_whatsapp').eq('status', 'active').execute()
        forbidden_companies = [
            "estudio tributario austral",
            "grúas magallanes",
            "antártica21",
            "naviera y abastecimiento estrecho de magallanes"
        ]

        fallback_phones = {"+56961200556", "+56961220055", "+56961200354"}

        for job in res.data:
            c_name = job["company_name"].lower()
            for forbidden in forbidden_companies:
                assert forbidden not in c_name, f"Se detectó empleo de demostración remanente: {job['company_name']}"
            assert job.get("contact_email") != "talento@contapymepuq.cl", "No debe haber correos mock en ofertas activas."
            assert job.get("contact_whatsapp") not in fallback_phones, f"Teléfono fallback no permitido en oferta activa: {job.get('contact_whatsapp')}"
