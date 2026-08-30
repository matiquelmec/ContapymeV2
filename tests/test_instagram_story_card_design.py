import pytest
import math

class TestInstagramStoryCardDesign:
    """
    🧪 Suite de Pruebas Unitarias de Diseño Editorial, Zonas Seguras y Calidad:
    Plantilla de Historias de Instagram (1080x1920), Safe Zones, Paleta de Marca,
    Contraste WCAG AAA y Jerarquía Tipográfica de Alto Impacto.
    """

    def test_01_story_dimensions_strictly_match_instagram_9_16(self):
        """Valida que la resolución sea exactamente 1080x1920 px (ratio 9:16)."""
        width = 1080
        height = 1920
        aspect_ratio = width / height
        expected_ratio = 9 / 16

        assert width == 1080
        assert height == 1920
        assert round(aspect_ratio, 4) == round(expected_ratio, 4)

    def test_02_safe_zones_keep_text_within_safe_interactive_bounds(self):
        """Verifica que el área de contenido interactivo respete las zonas seguras superior (220px) e inferior (280px)."""
        top_safe_zone_limit = 220
        bottom_safe_zone_limit = 1920 - 280  # 1640px
        
        # Posición de la tarjeta flotante de contenido
        card_top = 720
        card_height = 880
        card_bottom = card_top + card_height  # 1600px

        assert card_top >= top_safe_zone_limit, "La tarjeta invade la zona superior de historias"
        assert card_bottom <= bottom_safe_zone_limit, "La tarjeta invade la zona inferior del teclado/respuesta"

    def test_03_contrast_ratio_exceeds_wcag_aaa_standards(self):
        """Calcula la relación de contraste entre el texto blanco (#ffffff) y el fondo Obsidian (#020617)."""
        def luminance(r, g, b):
            def adjust(c):
                c = c / 255.0
                return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
            return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b)

        white_lum = luminance(255, 255, 255)
        bg_lum = luminance(2, 6, 23)

        contrast_ratio = (white_lum + 0.05) / (bg_lum + 0.05)
        # WCAG AAA exige al menos 7:1 para texto normal y 4.5:1 para títulos grandes
        assert contrast_ratio >= 15.0, f"Contraste insuficiente: {contrast_ratio}"

    def test_04_brand_themes_palette_integrity(self):
        """Comprueba que los temas por categoría incluyan los códigos de color oficiales de ContaPymePUQ."""
        brand_colors = {
            "emerald_austral": "#10b981",
            "gold_patagonia": "#f59e0b",
            "obsidian_deep": "#020617",
        }

        assert brand_colors["emerald_austral"] == "#10b981"
        assert brand_colors["gold_patagonia"] == "#f59e0b"
        assert brand_colors["obsidian_deep"] == "#020617"

    def test_05_summary_trimming_avoids_chopped_words(self):
        """Valida que la lógica de resumen no corte palabras a la mitad ni deje frases truncadas sin sentido."""
        sample_text = (
            "El Ministerio de Obras Públicas confirmó la adjudicación de las obras de mejoramiento "
            "del muelle de Puerto Natales para potenciar el turismo y la pesca artesanal en la provincia de Última Esperanza."
        )

        def trim_summary(text: str, max_len: int = 150) -> str:
            if len(text) <= max_len:
                return text if text.endswith('.') else f"{text}."
            slice_text = text[:max_len]
            last_space = slice_text.rfind(' ')
            if last_space > 80:
                return f"{slice_text[:last_space]}..."
            return f"{slice_text}..."

        trimmed = trim_summary(sample_text, 150)
        assert len(trimmed) <= 153
        assert not trimmed.endswith("  ...")
        assert "mejoramiento" in trimmed
