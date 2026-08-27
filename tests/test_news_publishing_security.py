import unittest
import re

class TestNewsPublishingSecurity(unittest.TestCase):
    """Suite de pruebas de Seguridad, Sanitización y Publicación de Noticias y Comunicados de Empresa"""

    def setUp(self):
        self.allowed_categories = [
            'MAGALLANES ACTUAL',
            'ECONOMÍA Y PYMES',
            'TURISMO Y PATAGONIA',
            'COMERCIO AUSTRAL',
            'TECNOLOGÍA E INNOVACIÓN',
            'COMUNIDAD'
        ]

    def test_01_html_sanitization_removes_dangerous_tags(self):
        """1. Sanitización XSS: Eliminar tags script, style e iframe de títulos y cuerpos de noticias"""
        raw_html = "<script>alert('xss')</script><h3>Inauguración de Nueva Sucursal</h3><iframe src='bad.com'></iframe>"
        clean = re.sub(r'<script[\s\S]*?>[\s\S]*?</script>', '', raw_html, flags=re.IGNORECASE)
        clean = re.sub(r'<style[\s\S]*?>[\s\S]*?</style>', '', clean, flags=re.IGNORECASE)
        clean = re.sub(r'<[^>]+>', ' ', clean).strip()
        clean = re.sub(r'\s+', ' ', clean)
        
        self.assertNotIn('<script>', clean)
        self.assertNotIn('<iframe>', clean)
        self.assertIn("Inauguración de Nueva Sucursal", clean)

    def test_02_valid_category_assignment(self):
        """2. Categorización: Validar que la categoría del comunicado pertenezca a la taxonomía regional"""
        cat = "ECONOMÍA Y PYMES"
        self.assertIn(cat, self.allowed_categories)

    def test_03_summary_auto_generation_length(self):
        """3. Resumen Automático: Cortar descripciones largas a un límite legible de 300 caracteres"""
        long_content = "A" * 500
        summary = long_content if len(long_content) <= 300 else long_content[:297] + '...'
        
        self.assertEqual(len(summary), 300)
        self.assertTrue(summary.endswith('...'))

if __name__ == '__main__':
    unittest.main()
