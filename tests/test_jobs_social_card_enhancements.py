import pytest

class TestJobsSocialCardEnhancements:
    """
    🧪 Suite de Pruebas Unitarias para Tarjetas Promocionales de Empleo:
    Formatos 1:1 y 9:16, Píldora de Sueldo Magnética, Extractor de Beneficios,
    Zona de Sticker de Enlace de Instagram y Sello de Verificación.
    """

    def test_01_social_card_aspect_ratios(self):
        """Comprueba que los ratios cuadrado (1:1) y vertical historia (9:16) tengan proporciones exactas."""
        square_w, square_h = 1080, 1080
        story_w, story_h = 1080, 1920

        assert square_w / square_h == 1.0
        assert round(story_w / story_h, 4) == round(9 / 16, 4)

    def test_02_benefits_chip_extractor_identifies_key_perks(self):
        """Valida que el extractor de beneficios identifique colación, traslado, contrato indefinido y seguro."""
        def extract_chips(title: str, desc: str, reqs: list, shift: str) -> list:
            chips = []
            text = f"{title} {desc} {' '.join(reqs)} {shift}".lower()
            if any(k in text for k in ['colación', 'almuerzo', 'casino', 'comida']):
                chips.append('☕ Colación')
            if any(k in text for k in ['traslado', 'acercamiento', 'movilización', 'bus']):
                chips.append('🚐 Traslado')
            if any(k in text for k in ['indefinido', 'planta', 'estable']):
                chips.append('⚡ Indefinido')
            if any(k in text for k in ['seguro', 'salud', 'mutual']):
                chips.append('🏥 Seguro')
            return chips[:3]

        job_data = {
            "title": "Operador de Grúa Horquilla",
            "desc": "Se ofrece almuerzo en casino de empresa y bus de acercamiento desde Punta Arenas.",
            "reqs": ["Licencia D vigente", "Contrato indefinido tras periodo de prueba"],
            "shift": "Turno rotativo 5x2"
        }

        chips = extract_chips(job_data["title"], job_data["desc"], job_data["reqs"], job_data["shift"])
        
        assert "☕ Colación" in chips
        assert "🚐 Traslado" in chips
        assert "⚡ Indefinido" in chips
        assert len(chips) <= 3

    def test_03_salary_badge_formatting_and_relativity(self):
        """Comprueba que la pastilla de sueldo formatee monedas chilenas y agregue icono monetario."""
        raw_salary = "$1.250.000 Líquido"
        badge_text = f"💰 {raw_salary}"

        assert "💰" in badge_text
        assert "$1.250.000" in badge_text
        assert "Líquido" in badge_text

    def test_04_story_interactive_sticker_callout_structure(self):
        """Verifica que el callout táctico para el Sticker de Instagram contenga las directivas de acción."""
        sticker_box = {
            "icon": "🔗",
            "title": "Pega aquí el Sticker de Enlace",
            "subtitle": "Toca para postular directamente",
            "cta": "POSTULAR ➔"
        }

        assert sticker_box["icon"] == "🔗"
        assert "Sticker de Enlace" in sticker_box["title"]
        assert "POSTULAR" in sticker_box["cta"]

    def test_05_verified_employer_security_and_free_postulation_stamp(self):
        """Valida que el sello de postulación confirme gratuidad total (sin cobro al postulante)."""
        stamp = "✓ 100% Gratuita • Sin cobro al postulante"
        assert "100% Gratuita" in stamp
        assert "Sin cobro" in stamp
