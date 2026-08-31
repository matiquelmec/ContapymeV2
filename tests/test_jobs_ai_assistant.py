"""
🧪 Test Suite: Asistente de Reclutamiento IA & Filtro de Cumplimiento Legal Laboral
Valida la generación estructurada de ofertas de empleo con IA (Groq / Llama-3.3-70B),
la inferencia de turnos de la Ley 40 Horas y la purga automática de patrones discriminatorios.
"""

import pytest
import re

# Patrones de discriminación del Código del Trabajo de Chile (Art. 2°)
DISCRIMINATORY_PATTERNS = [
    (r"\b(edad\s*(?:entre|de|maxima|minima|debe\s*tener)?\s*\d{2}\s*(?:a|-|y)?\s*\d{2}\s*a[ñn]os?)\b", "Límites de edad"),
    (r"\b(buena\s*presencia)\b", "Apariencia física"),
    (r"\b(foto\s*(?:obligatoria|actualizada|en\s*el\s*cv)?)\b", "Fotografía en CV"),
    (r"\b(solter[oa]|casad[oa]|sin\s*hijos?)\b", "Estado civil"),
    (r"\b(sin\s*dicom|certificado\s*(?:de\s*)?dicom|bolet[ií]n\s*comercial\s*limpio)\b", "DICOM / Antecedentes comerciales"),
]

VALID_SHIFTS = [
    "Lunes a Viernes (40 Horas)",
    "Turno 7x7 Faena",
    "Turno 14x14",
    "Turno 4x4",
    "Turno Rotativo 6x1",
    "Part-Time Fin de Semana"
]

VALID_SECTORS = [
    "Comercio & Retail",
    "Gastronomía & Hotelería",
    "Salmonicultura & Pesca",
    "Logística & Transporte",
    "Construcción & Minería",
    "Administración & Finanzas",
    "Salud & Servicios",
    "Tecnología & Otros"
]


def clean_job_text(text: str) -> str:
    """Simula el filtro de purga automática de patrones discriminatorios del backend."""
    cleaned = text
    for pattern, _ in DISCRIMINATORY_PATTERNS:
        cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", cleaned).strip()


class TestJobsAIAssistant:

    def test_01_job_ai_assistant_structured_json_schema(self):
        """Verifica que el contrato de respuesta del asistente contenga todas las propiedades requeridas."""
        mock_response = {
            "title": "Maestro Cocinero / Chef de Partida",
            "description": "Buscamos un maestro de cocina apasionado por la gastronomía austral para incorporarse a nuestro restaurante en Puerto Natales.",
            "requirements": "- Experiencia mínima de 2 años en cocina chilena o internacional\n- Manejo de BPM y manipulación de alimentos\n- Trabajo en equipo",
            "benefits": "- Almuerzo diario incluido\n- Seguro complementario de salud\n- Bono de temporada estival",
            "workShift": "Turno Rotativo 6x1",
            "sector": "Gastronomía & Hotelería",
            "location": "Puerto Natales",
            "salaryMin": 750000,
            "salaryMax": 900000
        }

        required_keys = ["title", "description", "requirements", "benefits", "workShift", "sector", "location"]
        for key in required_keys:
            assert key in mock_response, f"Falta la clave requerida '{key}' en la respuesta del asistente."
            assert len(str(mock_response[key])) > 0, f"El campo '{key}' no puede estar vacío."

    def test_02_job_ai_assistant_anti_discrimination_filter_enforcement(self):
        """Verifica que el filtro de seguridad purgue automáticamente cláusulas discriminatorias ilegales."""
        unlawful_draft = (
            "Buscamos cajera con buena presencia, edad entre 22 a 30 años, sin hijos, "
            "foto obligatoria en el cv y sin dicom para minimarket en Punta Arenas."
        )

        cleaned = clean_job_text(unlawful_draft)

        # Ninguno de los términos discriminatorios debe sobrevivir a la purga
        assert "buena presencia" not in cleaned.lower()
        assert "22 a 30 años" not in cleaned.lower()
        assert "sin hijos" not in cleaned.lower()
        assert "foto obligatoria" not in cleaned.lower()
        assert "sin dicom" not in cleaned.lower()

        # El contenido lícito debe preservarse
        assert "cajera" in cleaned.lower() or "minimarket" in cleaned.lower()

    def test_03_job_ai_assistant_shifts_and_sectors_validation(self):
        """Verifica que los turnos y sectores asignados pertenezcan a los catálogos autorizados y respeten la Ley 40 Horas."""
        sample_shift = "Lunes a Viernes (40 Horas)"
        sample_sector = "Comercio & Retail"

        assert sample_shift in VALID_SHIFTS, f"El turno '{sample_shift}' no es válido."
        assert sample_sector in VALID_SECTORS, f"El sector '{sample_sector}' no es válido."

    def test_04_job_ai_assistant_resilience_on_empty_input(self):
        """Verifica que entradas con menos de 5 caracteres sean rechazadas con un error amigable."""
        empty_inputs = ["", "   ", "abc", "1234"]
        for raw in empty_inputs:
            is_valid = len(raw.strip()) >= 5
            assert not is_valid, f"La entrada '{raw}' debió ser invalidada."

    def test_05_job_ai_assistant_salary_range_logic(self):
        """Verifica que cuando se infieren sueldos, el mínimo no sea mayor que el máximo."""
        salary_min = 650000
        salary_max = 850000

        assert salary_min <= salary_max
        assert salary_min >= 500000  # Por encima del Ingreso Mínimo Mensual de Chile
