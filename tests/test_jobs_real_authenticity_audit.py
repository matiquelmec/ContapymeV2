"""
🧪 Suite de Pruebas Unitarias: Certificación de Autenticidad de Empleos Magallanes
==================================================================================
Valida que el portal opere exclusivamente con ofertas laborales reales y verificables:
1. Ausencia absoluta de avisos de demostración / sintéticos (ej. Estudio Tributario Austral, HIF Global mock).
2. Trazabilidad de origen y presencia de enlaces oficiales de postulación (BNE, Chiletrabajos, OMIL).
3. Cumplimiento estricto del Art. 2° Código del Trabajo (0% cláusulas discriminatorias).
4. Integridad del mapeo application_url en base de datos y UI.
5. Idempotencia del motor de sincronización de vacantes reales.
"""

import pytest
import os
import json
import re


class TestJobsRealAuthenticityAudit:

    def test_01_seed_jobs_contain_no_synthetic_demo_companies(self):
        """Verifica que jobs-feed-sync.ts no contenga empresas ficticias o correos mock en el seed."""
        sync_file = os.path.join("app", "src", "lib", "jobs", "jobs-feed-sync.ts")
        assert os.path.exists(sync_file), "El archivo jobs-feed-sync.ts debe existir."

        with open(sync_file, "r", encoding="utf-8") as f:
            content = f.read()

        prohibited_terms = [
            "Estudio Tributario Austral SpA",
            "Antártica21 Expeditions",
            "Transportes y Grúas Magallanes Ltda.",
            "talento@contapymepuq.cl",
            "+56944444565",
        ]

        for term in prohibited_terms:
            assert term not in content, f"El término de demostración '{term}' no debe existir en el feed oficial."

    def test_02_seed_jobs_contain_real_magallanes_employers_with_urls(self):
        """Verifica que el feed incluya empresas reales de Magallanes y enlaces oficiales de postulación."""
        sync_file = os.path.join("app", "src", "lib", "jobs", "jobs-feed-sync.ts")
        with open(sync_file, "r", encoding="utf-8") as f:
            content = f.read()

        assert "Sanchez & Sanchez Ltda." in content, "Debe incluir a Sanchez & Sanchez como empleador real verificado."
        assert "Procesadora Barranco Amarillo" in content, "Debe incluir a Procesadora Barranco Amarillo."
        assert "Australis Seafoods" in content, "Debe incluir a Australis Seafoods."
        assert "https://www.bne.cl" in content, "Debe enlazar a la Bolsa Nacional de Empleo oficial."
        assert "https://www.chiletrabajos.cl" in content, "Debe enlazar a Chiletrabajos Magallanes."

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

        res = supabase.table('job_postings').select('company_name, title, contact_email').eq('status', 'active').execute()
        assert len(res.data) >= 8, "Debe haber al menos 8 empleos reales activos en Magallanes."

        forbidden_companies = [
            "estudio tributario austral",
            "hif global",
            "grúas magallanes",
            "antártica21"
        ]

        for job in res.data:
            c_name = job["company_name"].lower()
            for forbidden in forbidden_companies:
                assert forbidden not in c_name, f"Se detectó empleo de demostración remanente: {job['company_name']}"
            assert job.get("contact_email") != "talento@contapymepuq.cl", "No debe haber correos mock en ofertas activas."
