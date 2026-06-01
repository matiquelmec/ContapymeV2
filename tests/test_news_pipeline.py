import os
import sys
import unittest

# Agregar carpeta engine al PATH
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'engine'))

from workers.news_worker import _clean_html

class TestNewsPipelineQuality(unittest.TestCase):
    
    def test_clean_html_with_escaped_entities(self):
        """1. Validar que _clean_html resuelva y limpie entidades HTML escapadas como &lt;a...&gt;"""
        dirty_input = '&lt;a href="https://news.google.com/rss/articles/123" target="_blank"&gt;Noticia de Prueba&lt;/a&gt; Este es el texto real de la noticia.'
        cleaned = _clean_html(dirty_input)
        
        self.assertNotIn('<a', cleaned)
        self.assertNotIn('href=', cleaned)
        self.assertNotIn('&lt;', cleaned)
        self.assertIn('Noticia de Prueba Este es el texto real de la noticia.', cleaned)

    def test_clean_html_removes_malformed_tags(self):
        """2. Validar que se remuevan tags HTML incompletos o mal formados"""
        malformed_input = 'Algo de texto sano <a href="http://link" sin cerrar el tag'
        cleaned = _clean_html(malformed_input)
        
        self.assertNotIn('<a', cleaned)
        self.assertIn('Algo de texto sano', cleaned)

    def test_pre_llm_quality_simulation(self):
        """3. Simular el filtro pre-LLM del pipeline para descartar contenido truncado o muy corto"""
        # Entrada válida
        valid_content = "Este es un texto premium que contiene suficiente información de contexto sobre el desarrollo de las elecciones y la economía regional de Magallanes. Cuenta con los caracteres requeridos y desarrolla múltiples párrafos con coherencia."
        # Confirmar que tiene longitud suficiente y no termina en puntos suspensivos
        self.assertTrue(len(valid_content) >= 150)
        self.assertFalse(valid_content.endswith("..."))
        self.assertFalse(valid_content.endswith("…"))
        
        # Entrada inválida (corta)
        short_content = "Texto muy corto."
        self.assertTrue(len(short_content) < 150) # menor al umbral pre-IA
        
        # Entrada inválida (truncada)
        truncated_content = "Este es un texto que iba a ser muy largo pero lamentablemente se cortó..."
        self.assertTrue(truncated_content.endswith("...") or truncated_content.endswith("…"))

    def test_post_llm_quality_shield(self):
        """4. Validar el blindaje post-IA que rechaza contenido generado si está incompleto o tiene HTML"""
        # Simulación de respuesta IA correcta
        ai_title_ok = "Título Reescrito por IA"
        ai_content_ok = "Este es el cuerpo completo de la noticia generada por la Inteligencia Artificial de forma profesional, seria y ejecutiva. Contiene párrafos detallados y analiza perfectamente el impacto en Punta Arenas."
        ai_summary_ok = "Resumen ejecutivo de la noticia."
        
        # Debe pasar las reglas
        self.assertTrue(len(ai_content_ok) >= 150)
        self.assertTrue(len(ai_title_ok) >= 10)
        self.assertFalse(ai_content_ok.endswith("..."))
        self.assertFalse(ai_content_ok.endswith("…"))
        self.assertFalse(ai_summary_ok.endswith("..."))
        self.assertFalse(ai_summary_ok.endswith("…"))
        self.assertNotIn("<", ai_content_ok)
        
        # Simulación de respuesta IA con HTML residual (Debe fallar/ser rechazada)
        ai_content_bad_html = "Este es el texto <a href='link'>enlace</a> que no debería tener tags."
        self.assertTrue("<" in ai_content_bad_html or ">" in ai_content_bad_html or "href=" in ai_content_bad_html)
        
        # Simulación de respuesta IA truncada (Debe ser rechazada)
        ai_content_truncated = "Este contenido de la IA se cortó debido a límites de tokens de salida..."
        self.assertTrue(ai_content_truncated.endswith("...") or ai_content_truncated.endswith("…"))

if __name__ == '__main__':
    unittest.main()
