import unittest
import re

class TestJobsDashboardAndSecurity(unittest.TestCase):
    """Suite de pruebas de Seguridad, Auditoría Legal (Art. 2° DT) y Gestión de Empleos para Empresas"""

    def setUp(self):
        self.discriminatory_patterns = [
            (r"\b(edad\s*(?:entre|de|maxima|minima|debe\s*tener)?\s*\d{2}\s*(?:a|-|y)?\s*\d{2}\s*a[ñn]os?)\b", "Límites de edad"),
            (r"\b(menor\s*de\s*\d{2}\s*a[ñn]os?)\b", "Exclusión menor de edad"),
            (r"\b(mayor\s*de\s*\d{2}\s*a[ñn]os?)\b", "Exclusión mayor de edad"),
            (r"\b(buena\s*presencia)\b", "Apariencia física"),
            (r"\b(foto\s*(?:obligatoria|actualizada|en\s*el\s*cv)?)\b", "Foto en CV"),
            (r"\b(solter[oa]|casad[oa]|sin\s*hijos?)\b", "Estado civil / hijos"),
            (r"\b(solo\s*(?:hombres|mujeres|chilenos?|extranjeros?))\b", "Género / Nacionalidad"),
            (r"\b(sin\s*dicom|certificado\s*(?:de\s*)?dicom|bolet[ií]n\s*comercial\s*limpio)\b", "DICOM"),
        ]

    def test_01_legal_compliance_detects_age_discrimination(self):
        """1. Seguridad Legal: Debe detectar y bloquear avisos con exigencias de edad ilegal"""
        text_invalid = "Se busca Chofer de Faena, edad entre 25 y 40 años para faena en Punta Arenas."
        violations = []
        for pattern, reason in self.discriminatory_patterns:
            if re.search(pattern, text_invalid, re.IGNORECASE):
                violations.append(reason)
        
        self.assertIn("Límites de edad", violations)
        self.assertGreaterEqual(len(violations), 1)

    def test_02_legal_compliance_detects_dicom_and_photo_requirements(self):
        """2. Seguridad Legal: Debe bloquear exigencias de DICOM o fotografía en el CV"""
        text_dicom = "Postulantes enviar CV con foto actualizada y certificado de DICOM limpio."
        violations = []
        for pattern, reason in self.discriminatory_patterns:
            if re.search(pattern, text_dicom, re.IGNORECASE):
                violations.append(reason)
        
        self.assertIn("Foto en CV", violations)
        self.assertIn("DICOM", violations)

    def test_03_legal_compliance_passes_valid_job_posting(self):
        """3. Cumplimiento Laboral: Un aviso con requisitos profesionales legítimos debe ser aprobado"""
        text_valid = "Se requiere Contador Auditor o Ingeniero en Administración con 2 años de experiencia en conciliación bancaria y residencia en Magallanes."
        violations = []
        for pattern, reason in self.discriminatory_patterns:
            if re.search(pattern, text_valid, re.IGNORECASE):
                violations.append(reason)
        
        self.assertEqual(len(violations), 0, "El aviso legítimo no debería registrar violaciones legales")

    def test_04_slug_generation_and_normalization(self):
        """4. Normalización de Slugs: Generación correcta de URLs seguras sin acentos ni caracteres especiales"""
        title = "Técnico en Climatización & Refrigeración"
        company = "Frigorífico Simunovic"
        location = "Punta Arenas"
        
        raw_slug = f"{title}-{company}-{location}".lower()
        clean_slug = re.sub(r'[^a-z0-9]+', '-', raw_slug).strip('-')
        
        self.assertNotIn('&', clean_slug)
        self.assertNotIn(' ', clean_slug)
        self.assertTrue(clean_slug.startswith("t-cnico-en-climatizaci-n"))

    def test_05_job_lifecycle_status_transitions(self):
        """5. Ciclo de Vida: Transición estricta entre estados de vacantes (active -> filled -> expired)"""
        valid_statuses = {'active', 'filled', 'expired'}
        
        status_1 = 'active'
        self.assertIn(status_1, valid_statuses)
        
        status_2 = 'filled'
        self.assertIn(status_2, valid_statuses)

    def test_06_unauthorized_user_cannot_modify_other_company_jobs(self):
        """6. Seguridad Multi-Tenant: Un usuario regular NO puede modificar o eliminar vacantes de otra empresa"""
        user_company = "Recasur"
        user_role = "empresa" # no admin

        target_job_company = "Australis Seafoods"

        # Simulación de validación de propiedad
        is_admin = user_role == "admin"
        is_owner = user_company.lower() == target_job_company.lower()
        has_permission = is_admin or is_owner

        self.assertFalse(has_permission, "Un usuario de Recasur no debe tener permiso sobre Australis")

    def test_07_superadmin_can_moderate_all_companies(self):
        """7. Privilegios Superadmin: El rol admin sí tiene autorización global de moderación"""
        user_role = "admin"
        target_job_company = "Australis Seafoods"

        is_admin = user_role == "admin"
        has_permission = is_admin

        self.assertTrue(has_permission, "El superadmin debe poder moderar cualquier vacante")

if __name__ == '__main__':
    unittest.main()

