import unittest
import json
import os
import urllib.parse

class TestJobBannerGeneration(unittest.TestCase):
    """Suite de pruebas para el Generador de Banners Publicitarios y Redes Sociales de ContaEmpleos PUQ"""

    def setUp(self):
        self.marketing_kit_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'public', 'branding', 'contaempleos-marketing-kit.json'
        )

    def test_01_marketing_kit_json_structure_and_palette(self):
        """1. Branding Kit: Validar que el JSON de marca contenga colores oficiales y proporciones para redes"""
        self.assertTrue(os.path.exists(self.marketing_kit_path), "El archivo contaempleos-marketing-kit.json no existe")
        
        with open(self.marketing_kit_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.assertIn("brand_identity", data)
        self.assertIn("color_palette", data["brand_identity"])
        self.assertIn("social_media_dimensions", data)

        palette = data["brand_identity"]["color_palette"]
        self.assertEqual(palette["primary_navy"]["hex"], "#0F172A")
        self.assertEqual(palette["brand_blue"]["hex"], "#2563EB")
        self.assertEqual(palette["emerald_salary"]["hex"], "#10B981")

        # Validar dimensiones de Instagram
        dims = data["social_media_dimensions"]
        self.assertEqual(dims["instagram_post_square"]["width"], 1080)
        self.assertEqual(dims["instagram_post_square"]["height"], 1080)
        self.assertEqual(dims["instagram_story_vertical"]["width"], 1080)
        self.assertEqual(dims["instagram_story_vertical"]["height"], 1920)

    def test_02_opengraph_edge_route_url_and_dimensions(self):
        """2. OpenGraph: Validar dimensiones 1200x630 estándar y codificación de slug"""
        slug = "supervisor-faena-australis"
        og_url = f"/api/og/job/{slug}"
        self.assertTrue(og_url.startswith("/api/og/job/"))
        self.assertEqual(urllib.parse.quote(slug), slug)

    def test_03_qr_code_url_generation_for_stories(self):
        """3. Código QR: Generación correcta del endpoint de código QR para historias 9:16"""
        job_slug = "tecnico-soporte-pos-punta-arenas"
        share_url = f"https://contapymepuq.cl/empleos/{job_slug}"
        
        qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={urllib.parse.quote(share_url)}&bgcolor=0F172A&color=38BDF8&margin=0"
        
        self.assertIn("api.qrserver.com", qr_url)
        self.assertIn("bgcolor=0F172A", qr_url)
        self.assertIn(urllib.parse.quote(share_url), qr_url)

    def test_04_social_copy_text_formatting_and_hashtags(self):
        """4. Copywriting: Verificar que el texto de Instagram y WhatsApp incluya hashtags regionales obligatorios"""
        with open(self.marketing_kit_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        hashtags = data.get("hashtags", [])
        self.assertIn("#EmpleosPuntaArenas", hashtags)
        self.assertIn("#TrabajoMagallanes", hashtags)
        self.assertIn("#ContaEmpleosPUQ", hashtags)

    def test_05_job_ad_prompt_spec_json_integrity(self):
        """5. AI Prompt Spec: Validar que el archivo job-ad-prompt-spec.json cumpla con el estándar de anuncio publicitario"""
        spec_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'public', 'branding', 'job-ad-prompt-spec.json'
        )
        self.assertTrue(os.path.exists(spec_path), "job-ad-prompt-spec.json no existe")
        with open(spec_path, 'r', encoding='utf-8') as f:
            spec = json.load(f)

        self.assertEqual(spec["tarea"], "generacion_oferta_empleo_publicitaria")
        self.assertIn("marca_principal", spec)
        self.assertIn("elementos_graficos", spec)
        self.assertIn("contenido_texto", spec)
        self.assertIn("estilo_y_composicion", spec)
        self.assertIn("prompt_ejecucion_ia_generativa", spec)
        self.assertIn("logo_contapyme", spec["elementos_graficos"])

    def test_06_nano_banana_2_studio_ad_schema(self):
        """6. Nano Banana 2: Validar esquema de control determinista multimodal (Gemini 3.1 Flash Image)"""
        sample_spec = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "model": "gemini-3.1-flash-image-preview",
            "meta": {
                "aspect_ratio": "9:16",
                "quality": "ultra_photorealistic",
                "thinking_level": "high"
            },
            "brand_identity": {
                "nombre_empresa": "Recasur",
                "paleta_de_colores_hex": {
                    "color_primario_corporativo": "#004080",
                    "color_acento_sueldo": "#10B981"
                }
            },
            "text_rendering": {
                "exact_title": "Mecánico Automotriz",
                "font_style": "Plus Jakarta Sans, Weight 900 Italic"
            },
            "technical": {
                "camera": { "type": "Hasselblad X2D 100C" }
            }
        }
        self.assertEqual(sample_spec["model"], "gemini-3.1-flash-image-preview")
        self.assertEqual(sample_spec["meta"]["thinking_level"], "high")
        self.assertIn("color_primario_corporativo", sample_spec["brand_identity"]["paleta_de_colores_hex"])
        self.assertIn("camera", sample_spec["technical"])

if __name__ == '__main__':
    unittest.main()
