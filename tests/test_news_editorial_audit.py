import os
import sys
import unittest
import unicodedata
from difflib import SequenceMatcher

# Añadir ruta del engine al sys.path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'engine'))

from workers.news_worker import (
    _clean_html, 
    _slugify, 
    _validate_editorial_integrity, 
    _is_semantic_duplicate,
    _extract_semantic_keywords
)
from core.ai import process_news_with_local_llm

class TestNewsEditorialAudit(unittest.TestCase):
    """
    🔬 SUITE DE AUDITORÍA INTEGRAL DE LA SECCIÓN DE NOTICIAS (Contapymepuq v12.3)
    Verifica ingestión, desduplicación semántica, blindaje anti-plagio, 
    anti-alucinación, seguridad y algoritmos de clasificación.
    """

    def test_01_html_sanitization_removes_all_scripts_and_ad_trackers(self):
        """1. Ingestión: Sanitización total de XSS, scripts y publicidad de medios externos"""
        raw_dirty_html = (
            '<div class="ad-banner"><script>alert("xss")</script>Publicidad</div>'
            '<p>El seremi de Obras Públicas informó la habilitación de la Ruta 9.</p>'
            '<span>Waldo Seguel 636, Punta Arenas © 2026</span>'
        )
        cleaned = _clean_html(raw_dirty_html)
        self.assertNotIn('<script', cleaned)
        self.assertNotIn('alert', cleaned)
        self.assertNotIn('Waldo Seguel', cleaned)
        self.assertIn('El seremi de Obras Públicas informó la habilitación de la Ruta 9.', cleaned)

    def test_02_unicode_slug_normalization_handles_chilean_spanish(self):
        """2. Enrutamiento: Generación limpia de slugs SEO sin caracteres inválidos ni acentos"""
        sample_title = "Inauguración de Obras en Magallanes & Antártica: ¡Inversión de $4.500 Millones!"
        slug = _slugify(sample_title)
        self.assertEqual(slug, "inauguracion-de-obras-en-magallanes-antartica-inversion-de-4500-millones")
        self.assertNotIn('á', slug)
        self.assertNotIn('&', slug)
        self.assertNotIn('$', slug)
        self.assertNotIn('!', slug)

    def test_03_cross_source_semantic_deduplication_exact_cases(self):
        """3. Deduplicación Semántica: Detección de mismos hechos reportados con diferente léxico"""
        existing_database_articles = [
            {
                "id": "1",
                "title": "Aduanas retiene yate británico en Puerto Natales por uso no autorizado",
                "content": "Personal del Servicio Nacional de Aduanas fiscalizó la embarcación privada..."
            },
            {
                "id": "2",
                "title": "MOP actualiza plan de contingencia por nieve en rutas de Punta Arenas",
                "content": "Vialidad desplegó maquinaria pesada en la Ruta 9 Norte..."
            }
        ]

        # Caso A: Mismo hecho del yate con palabras distintas
        incoming_candidate_1 = "Defensa de embarcación extranjera en Natales rechaza acusaciones de Aduanas"
        is_dup_1, reason_1 = _is_semantic_duplicate(incoming_candidate_1, "El equipo legal...", existing_database_articles)
        self.assertTrue(is_dup_1, "Debe detectar que trata sobre el mismo yate de Natales")

        # Caso B: Noticia completamente diferente sobre pesca
        incoming_candidate_2 = "Sernapesca certifica nueva planta de procesamiento de centolla en Porvenir"
        is_dup_2, _ = _is_semantic_duplicate(incoming_candidate_2, "Nueva planta industrial...", existing_database_articles)
        self.assertFalse(is_dup_2, "No debe marcar como duplicada una noticia distinta")

    def test_04_plagiarism_shield_rejects_copy_paste_threshold(self):
        """4. Blindaje Legal: Rechazo automático de textos con más del 85% de copia literal"""
        source_text = "El Banco Central de Chile decidió reducir la tasa de política monetaria en 25 puntos base debido a la desaceleración de la inflación subyacente."
        plagiarized_text = "El Banco Central de Chile decidió reducir la tasa de política monetaria en 25 puntos base debido a la desaceleración de la inflación."
        
        is_valid, reason = _validate_editorial_integrity(source_text, plagiarized_text, "Resumen")
        self.assertFalse(is_valid)
        self.assertIn("Riesgo de copia literal", reason)

    def test_05_original_executive_rewrite_approval(self):
        """5. Calidad Editorial: Aprobación de síntesis ejecutiva original de Contapymepuq"""
        source_text = "El Banco Central de Chile decidió reducir la tasa de política monetaria en 25 puntos base debido a la desaceleración de la inflación subyacente."
        original_rewrite = (
            "En su más reciente reunión de política financiera, el Consejo del Banco Central acordó un recorte de 25 puntos "
            "en la tasa de interés rectora, respondiendo a una inflación que muestra signos de convergencia hacia la meta del 3% anual. "
            "Esta medida busca aliviar el costo del financiamiento para las pequeñas y medianas empresas."
        )
        is_valid, reason = _validate_editorial_integrity(source_text, original_rewrite, "Resumen")
        self.assertTrue(is_valid)
        self.assertEqual(reason, "OK")

    def test_06_llm_zero_temperature_factual_invariants(self):
        """6. Invariantes Anti-Alucinación: Verificación de configuración determinista en el núcleo de IA"""
        import inspect
        source_code = inspect.getsource(process_news_with_local_llm)
        self.assertIn('"temperature": 0.0', source_code)
        self.assertIn('FIDELIDAD FACTUAL ESTRICTA (CERO ALUCINACIÓN)', source_code)
        self.assertIn('NUNCA inventes, supongas ni extrapoles', source_code)

if __name__ == '__main__':
    unittest.main()
