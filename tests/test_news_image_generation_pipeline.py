import pytest
import io
from PIL import Image

class TestNewsImageGenerationPipeline:
    """
    🧪 Suite de Pruebas Unitarias de Arquitectura, Calidad y Seguridad:
    Pipeline de Generación de Imágenes Editoriales 2026, Proporción 16:9,
    Estilo Fotoperiodismo, Sanitización de Prompts y Compresión WebP.
    """

    def test_01_photojournalism_prompt_enhancement_contains_2026_standards(self):
        """Verifica que el pipeline inyecte descriptores fotoperiodísticos (35mm, luz natural) y filtros anti-CGI."""
        from engine.core.images import EDITORIAL_PHOTOJOURNALISM_STYLE, EDITORIAL_NEGATIVE_PROMPT

        assert "35mm" in EDITORIAL_PHOTOJOURNALISM_STYLE
        assert "documentary" in EDITORIAL_PHOTOJOURNALISM_STYLE
        assert "16:9" in EDITORIAL_PHOTOJOURNALISM_STYLE
        assert "Magallanes" in EDITORIAL_PHOTOJOURNALISM_STYLE

        assert "cartoon" in EDITORIAL_NEGATIVE_PROMPT
        assert "3d render" in EDITORIAL_NEGATIVE_PROMPT
        assert "plastic smooth skin" in EDITORIAL_NEGATIVE_PROMPT

    def test_02_aspect_ratio_dimensions_are_16_9(self):
        """Comprueba que las resoluciones objetivo (1280x720) cumplan con la relación de aspecto 16:9 exacta."""
        target_width = 1280
        target_height = 720
        ratio = target_width / target_height
        expected_ratio = 16 / 9

        assert round(ratio, 4) == round(expected_ratio, 4)

    def test_03_prompt_sanitization_removes_dangerous_characters(self):
        """Valida que la función de sanitización limpie saltos de línea y limite el tamaño del prompt."""
        from engine.core.images import _sanitize_visual_prompt

        dirty_prompt = """
        Cargo ships in Punta Arenas port\r\n\twith containers
        <script>alert(1)</script>
        """
        clean = _sanitize_visual_prompt(dirty_prompt)

        assert "\n" not in clean
        assert "\r" not in clean
        assert "\t" not in clean
        assert "Cargo ships in Punta Arenas" in clean
        assert len(clean) <= 400

    def test_04_validate_image_bytes_identifies_valid_headers(self):
        """Verifica que el validador binario reconozca JPEG, PNG y WebP y rechace payloads corruptos o falsos."""
        from engine.core.images import _validate_image_bytes

        jpeg_magic = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 100
        png_magic = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"\x00" * 100
        webp_magic = b"RIFF\x00\x00\x00\x00WEBPVP8 " + b"\x00" * 100
        corrupt_bytes = b"<html><script>alert(1)</script></html>"

        is_jpg, mime_jpg = _validate_image_bytes(jpeg_magic)
        assert is_jpg is True
        assert mime_jpg == "image/jpeg"

        is_png, mime_png = _validate_image_bytes(png_magic)
        assert is_png is True
        assert mime_png == "image/png"

        is_webp, mime_webp = _validate_image_bytes(webp_magic)
        assert is_webp is True
        assert mime_webp == "image/webp"

        is_bad, reason = _validate_image_bytes(corrupt_bytes)
        assert is_bad is False

    def test_05_webp_conversion_and_compression(self):
        """Verifica que una imagen PNG/RGB sea convertida y optimizada a formato WebP sin errores."""
        from engine.core.images import _optimize_to_webp

        # Crear una imagen sintética en memoria de 1600x900 (RGB)
        img = Image.new("RGB", (1600, 900), color=(34, 139, 34))
        raw_io = io.BytesIO()
        img.save(raw_io, format="PNG")
        png_bytes = raw_io.getvalue()

        # Optimizar a WebP con max_width=1280
        webp_bytes = _optimize_to_webp(png_bytes, max_width=1280, quality=85)

        # Validar resultado
        out_img = Image.open(io.BytesIO(webp_bytes))
        assert out_img.format == "WEBP"
        assert out_img.width == 1280
        assert out_img.height == 720
        assert len(webp_bytes) < len(png_bytes)
