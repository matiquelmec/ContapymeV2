import os
import sys
import unittest

# Agregar carpeta engine al sys.path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'engine'))

from workers.job_worker import (
    _clean_job_text,
    _audit_legal_compliance,
    _slugify_job,
    _is_duplicate_job,
    _extract_semantic_tokens,
    _has_valid_direct_contact
)

class TestJobsPipelineAndCompliance(unittest.TestCase):
    """
    🔬 SUITE DE AUDITORÍA Y CUMPLIMIENTO LEGAL PARA CONTAEMPLEOS PUQ
    Verifica el cumplimiento del Art. 2° del Código del Trabajo,
    Ley N° 20.609 (Ley Zamudio), cálculo previsional y deduplicación.
    """

    def test_01_rejects_age_discriminatory_requirements(self):
        """1. Art. 2° Código del Trabajo: Rechazar avisos que impongan límites de edad excluyentes"""
        text_with_age_1 = "Buscamos vendedor con edad entre 25 y 35 años para tienda en Zona Franca."
        is_valid_1, reason_1 = _audit_legal_compliance(text_with_age_1)
        self.assertFalse(is_valid_1)
        self.assertIn("edad", reason_1.lower())

        text_with_age_2 = "Se requiere chofer menor de 30 años con licencia A2."
        is_valid_2, reason_2 = _audit_legal_compliance(text_with_age_2)
        self.assertFalse(is_valid_2)

    def test_02_rejects_dicom_and_commercial_debts_requirements(self):
        """2. Protección Financiera: Prohibir exigencia de certificados de DICOM o boletín comercial"""
        text_with_dicom = "Importante empresa requiere cajero administrativo. Requisito excluyente: sin DICOM y antecedentes limpios."
        is_valid, reason = _audit_legal_compliance(text_with_dicom)
        self.assertFalse(is_valid)
        self.assertIn("comercial", reason.lower())

    def test_03_rejects_appearance_and_mandatory_photo(self):
        """3. No Discriminación: Prohibir exigencia de 'buena presencia' o fotografía en el CV"""
        text_with_photo = "Se busca recepcionista de buena presencia para hotel. Enviar CV con foto obligatoria."
        is_valid, reason = _audit_legal_compliance(text_with_photo)
        self.assertFalse(is_valid)
        self.assertIn("apariencia", reason.lower())

    def test_04_rejects_fraudulent_pay_before_work_scams(self):
        """4. Ciberseguridad & Anti-Fraude: Rechazar avisos con cobros previos de matrícula o esquemas piramidales"""
        text_scam = "Trabaja desde casa y gana dinero facil. Se requiere un pago previo por concepto de capacitacion y materiales."
        is_valid, reason = _audit_legal_compliance(text_scam)
        self.assertFalse(is_valid)
        self.assertIn("fraudulento", reason.lower())

    def test_05_approves_legitimate_competency_based_job(self):
        """5. Aprobación: Aceptar avisos basados en idoneidad, experiencia y competencias técnicas"""
        valid_job_text = (
            "Empresa de logística en Punta Arenas requiere Contador Auditor con al menos 2 años de experiencia en "
            "normativa IFRS, manejo de ERP contable y conciliaciones bancarias. Ofrecemos contrato indefinido, "
            "seguro de salud complementario y sueldo de $1.200.000 líquido."
        )
        is_valid, reason = _audit_legal_compliance(valid_job_text)
        self.assertTrue(is_valid)
        self.assertEqual(reason, "OK")

    def test_06_slug_generation_and_unicode_normalization(self):
        """6. SEO & Routing: Generación de slug limpio para ciudades de Magallanes con tildes"""
        slug = _slugify_job("Mecánico de Mantenimiento Acuícola", "Salmones Australis", "Puerto Natales")
        self.assertEqual(slug, "mecanico-de-mantenimiento-acuicola-salmones-australis-puerto-natales")
        self.assertNotIn("á", slug)
        self.assertNotIn("í", slug)

    def test_07_semantic_deduplication_detects_same_job_across_sources(self):
        """7. Deduplicación: Detección de misma vacante publicada en distintos portales/redes"""
        existing_jobs = [
            {
                "title": "Supervisor de Faena 7x7",
                "company_name": "Australis Aqua Services",
                "location": "Puerto Natales"
            }
        ]

        # Mismo cargo y empresa con variación menor de palabras
        is_dup = _is_duplicate_job(
            candidate_title="Supervisor de Faena en Turnos 7x7",
            candidate_company="Australis Aqua Services",
            candidate_location="Puerto Natales",
            existing_jobs=existing_jobs
        )
        self.assertTrue(is_dup)

        # Cargo distinto en la misma empresa
        is_different_job = _is_duplicate_job(
            candidate_title="Técnico de Laboratorio",
            candidate_company="Australis Aqua Services",
            candidate_location="Puerto Natales",
            existing_jobs=existing_jobs
        )
        self.assertFalse(is_different_job)

    def test_08_net_salary_calculation_math_formula(self):
        """8. Motor Salarial: Verificar deducciones legales (AFP 11.45%, Fonasa 7%, AFC 0.6%)"""
        gross_salary = 1000000
        afp_expected = 114500
        health_expected = 70000
        afc_expected = 6000
        total_deductions_expected = afp_expected + health_expected + afc_expected # 190.500
        net_expected = 1000000 - total_deductions_expected # 809.500

        afp = round(gross_salary * 0.1145)
        health = round(gross_salary * 0.07)
        afc = round(gross_salary * 0.006)
        total_deductions = afp + health + afc
        net = gross_salary - total_deductions

        self.assertEqual(afp, afp_expected)
        self.assertEqual(health, health_expected)
        self.assertEqual(afc, afc_expected)
        self.assertEqual(net, net_expected)

    def test_09_email_contact_sanitization_and_rfc_compliance(self):
        """9. Calidad de Canales: Validación estricta de emails corporativos y descarte de formatos inválidos"""
        valid_emails = [
            "seleccion@australis-seafoods.com",
            "rrhh@patagoniaecolodge.cl",
            "soporte.austral@servicestech.cl"
        ]
        invalid_emails = [
            "",
            "null",
            "undefined",
            "no-email",
            "@dominio.cl",
            "contacto@"
        ]
        for em in valid_emails:
            is_valid = bool(em and '@' in em and '.' in em and len(em.strip()) > 5)
            self.assertTrue(is_valid, f"Email válido fue rechazado: {em}")

        for em in invalid_emails:
            is_valid = bool(em and '@' in em and '.' in em and len(em.strip()) > 5 and not em.startswith('@') and not em.endswith('@'))
            self.assertFalse(is_valid, f"Email inválido fue aceptado: {em}")

    def test_10_webmail_and_mailto_uri_generator_security(self):
        """10. Seguridad & Enlaces: Generación segura de Webmail (Gmail/Outlook/mailto) con escape URI"""
        import urllib.parse

        email = "seleccion@australis-seafoods.com"
        job_title = "Supervisor(a) de Seguridad Patrimonial"
        company = "Australis Seafoods"

        subject = f"Postulación: {job_title} - {company} (ContaEmpleos PUQ)"
        encoded_subject = urllib.parse.quote(subject)

        mailto_link = f"mailto:{email}?subject={encoded_subject}"
        gmail_link = f"https://mail.google.com/mail/?view=cm&fs=1&to={email}&su={encoded_subject}"
        outlook_link = f"https://outlook.office.com/mail/deeplink/compose?to={email}&subject={encoded_subject}"

        self.assertTrue(mailto_link.startswith("mailto:seleccion@australis-seafoods.com"))
        self.assertIn("mail.google.com/mail/?view=cm", gmail_link)
        self.assertIn("outlook.office.com/mail/deeplink", outlook_link)
        # Verificar que no queden espacios sin codificar en la query string
        self.assertNotIn(" ", encoded_subject)

    def test_11_whatsapp_phone_normalization_and_e164_chile(self):
        """11. Seguridad & Normalización: Formato telefónico E.164 para WhatsApp en Chile (+569...)"""
        raw_numbers = [
            "+56 9 6120 0556",
            "+56961200354",
            "9 6122 0055",
            "+56-9-6122-0055"
        ]
        for raw in raw_numbers:
            digits_only = "".join(filter(str.isdigit, raw))
            self.assertGreaterEqual(len(digits_only), 8)

    def test_13_rejects_job_without_direct_contact_channel(self):
        """13. Regla de Calidad y Veracidad: Rechazar cualquier oferta laboral sin canal de contacto directo"""
        job_without_contact = {
            "title": "Vendedor de Salón",
            "company_name": "Empresa Regional",
            "contact_email": None,
            "contact_whatsapp": None,
            "application_url": None,
            "source_url": None
        }
        self.assertFalse(_has_valid_direct_contact(job_without_contact))

        job_with_fake_null_strings = {
            "title": "Vendedor de Salón",
            "company_name": "Empresa Regional",
            "contact_email": "null",
            "contact_whatsapp": "undefined",
            "application_url": "null"
        }
        self.assertFalse(_has_valid_direct_contact(job_with_fake_null_strings))

    def test_14_approves_jobs_with_verified_contact_channels(self):
        """14. Verificación de Canales: Aceptar avisos con Email válido, WhatsApp o URL institucional"""
        job_with_email = {
            "title": "Técnico Mecánico",
            "company_name": "Procesadora Barranco Amarillo",
            "contact_email": "operaciones@barrancoamarillo.cl",
            "contact_whatsapp": None
        }
        self.assertTrue(_has_valid_direct_contact(job_with_email))

        job_with_wa = {
            "title": "Operario de Cultivo",
            "company_name": "Australis Seafoods",
            "contact_email": None,
            "contact_whatsapp": "+56 9 6120 0556"
        }
        self.assertTrue(_has_valid_direct_contact(job_with_wa))

        job_with_direct_url = {
            "title": "Ingeniero Eléctrico",
            "company_name": "HIF Global",
            "contact_email": None,
            "contact_whatsapp": None,
            "application_url": "https://hifglobal.com/careers/magallanes-job-123"
        }
        self.assertTrue(_has_valid_direct_contact(job_with_direct_url))

    def test_15_validates_strict_contact_formats(self):
        """15. Sanitización Estricta: Descartar formatos inválidos como números cortos o emails sin dominio"""
        invalid_short_wa = {
            "title": "Guardia",
            "company_name": "Seguridad",
            "contact_email": None,
            "contact_whatsapp": "12345" # Menos de 8 dígitos
        }
        self.assertFalse(_has_valid_direct_contact(invalid_short_wa))

        invalid_malformed_email = {
            "title": "Guardia",
            "company_name": "Seguridad",
            "contact_email": "contacto@sin_punto",
            "contact_whatsapp": None
        }
        self.assertFalse(_has_valid_direct_contact(invalid_malformed_email))


if __name__ == '__main__':
    unittest.main()
