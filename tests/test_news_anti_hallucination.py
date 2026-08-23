import os
import sys
import unittest
from unittest.mock import patch, MagicMock

# Añadir ruta del engine al sys.path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'engine'))

from workers.news_worker import _validate_editorial_integrity, _clean_html, _slugify
from core.ai import process_news_with_local_llm, DEFAULT_MODEL

class TestNewsAntiHallucinationAndQuality(unittest.TestCase):
    """
    Suite de Pruebas de Calidad Editorial, Anti-Alucinación y Anti-Plagio
    para el motor de redacción de Contapymepuq v12.2.
    """

    def test_editorial_integrity_detects_literal_copy_paste(self):
        """1. Validar que el escudo rechace plagio o copias literales idénticas (>85% similitud)"""
        raw_text = (
            "El Servicio Nacional de Aduanas incautó un yate británico en Puerto Natales "
            "tras detectar supuestas infracciones a la normativa de admisión temporal sin fines comerciales."
        )
        # Copia casi exacta
        plagiarized_text = (
            "El Servicio Nacional de Aduanas incautó un yate británico en Puerto Natales "
            "tras detectar supuestas infracciones a la normativa de admisión temporal sin fines comerciales."
        )
        is_valid, reason = _validate_editorial_integrity(raw_text, plagiarized_text, "Resumen")
        self.assertFalse(is_valid)
        self.assertIn("Riesgo de copia literal", reason)

    def test_editorial_integrity_passes_original_executive_paraphrase(self):
        """2. Validar que una reescritura ejecutiva profesional y original sea aprobada con éxito"""
        raw_text = (
            "El Servicio Nacional de Aduanas incautó un yate británico en Puerto Natales "
            "tras detectar supuestas infracciones a la normativa de admisión temporal sin fines comerciales."
        )
        original_rewrite = (
            "En el marco de fiscalizaciones aduaneras en la provincia de Última Esperanza, "
            "autoridades marítimas procedieron a la retención preventiva de una nave de pabellón británico, "
            "iniciando una investigación sobre el régimen tributario aplicable a la embarcación en Magallanes."
        )
        is_valid, reason = _validate_editorial_integrity(raw_text, original_rewrite, "Resumen")
        self.assertTrue(is_valid)
        self.assertEqual(reason, "OK")

    def test_clean_html_removes_malformed_tags_and_junk(self):
        """3. Validar limpieza estricta de metadatos de diarios y etiquetas residuales"""
        raw = "<div>Texto de prueba con &nbsp; y &#8211; guiones. Waldo Seguel 636, Punta Arenas © 2026</div>"
        cleaned = _clean_html(raw)
        self.assertNotIn("<div", cleaned)
        self.assertNotIn("&nbsp;", cleaned)
        self.assertNotIn("Waldo Seguel", cleaned)
        self.assertIn("Texto de prueba con y - guiones.", cleaned)

    def test_slugify_url_friendly(self):
        """4. Validar generación correcta de URLs amigables (slugs) sin caracteres especiales ni acentos"""
        title = "Defensa del Yate Británico en Natales: Niega Uso Comercial"
        slug = _slugify(title)
        self.assertEqual(slug, "defensa-del-yate-britanico-en-natales-niega-uso-comercial")
        self.assertNotIn(":", slug)
        self.assertNotIn(" ", slug)

    def test_prompt_strict_factual_rules_present(self):
        """5. Validar que las reglas de oro de cero alucinación y anti-plagio estén en el prompt de la IA"""
        import inspect
        source_code = inspect.getsource(process_news_with_local_llm)
        self.assertIn("temperature\": 0.0", source_code)
        self.assertIn("REESCRITURA ORIGINAL (CERO PLAGIO)", source_code)
        self.assertIn("FIDELIDAD FACTUAL ESTRICTA (CERO ALUCINACIÓN)", source_code)
        self.assertIn("NUNCA inventes, supongas ni extrapoles", source_code)

if __name__ == "__main__":
    unittest.main()
