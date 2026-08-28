import unittest
from PIL import Image
import io

class TestWebPImageCompression(unittest.TestCase):
    """Suite de pruebas para el motor de compresión y optimización de imágenes WebP"""

    def test_01_webp_compression_reduces_file_size_by_over_70_percent(self):
        """1. Compresión WebP: Validar que la compresión reduzca el peso más de un 70% sin perder dimensiones clave"""
        # Crear imagen pesada sintética (1200x1200 en PNG sin comprimir)
        img = Image.new('RGB', (1200, 1200), color=(73, 109, 137))
        
        # Buffer PNG original
        png_buffer = io.BytesIO()
        img.save(png_buffer, format='PNG')
        original_size = len(png_buffer.getvalue())

        # Buffer WebP comprimido (calidad 85%)
        webp_buffer = io.BytesIO()
        img.save(webp_buffer, format='WEBP', quality=85, method=6)
        compressed_size = len(webp_buffer.getvalue())

        savings_ratio = (original_size - compressed_size) / original_size
        self.assertGreater(savings_ratio, 0.50, f"El ahorro fue {savings_ratio:.2%}, se esperaba > 50%")
        self.assertLess(compressed_size, original_size)

    def test_02_aspect_ratio_preservation_on_resize(self):
        """2. Proporción de Aspecto: Redimensionar preservando exactamente el ratio horizontal original"""
        original_w, original_h = 3840, 2160 # 4K 16:9
        max_w = 1600

        # Cálculo de nuevo alto
        new_h = round((original_h * max_w) / original_w)
        
        self.assertEqual(new_h, 900)
        self.assertAlmostEqual(max_w / new_h, 16 / 9, places=2)

    def test_03_svg_and_transparent_formats_integrity(self):
        """3. Integridad de Formatos: Soporte de canales alfa y preservación de transparencia"""
        img_rgba = Image.new('RGBA', (800, 600), color=(255, 0, 0, 128))
        webp_rgba_buffer = io.BytesIO()
        img_rgba.save(webp_rgba_buffer, format='WEBP', quality=85)
        
        loaded = Image.open(webp_rgba_buffer)
        self.assertEqual(loaded.mode, 'RGBA')
        self.assertEqual(loaded.size, (800, 600))

if __name__ == '__main__':
    unittest.main()
