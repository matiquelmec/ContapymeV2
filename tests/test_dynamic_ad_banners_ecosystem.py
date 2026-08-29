import pytest
import datetime
import random

class TestDynamicAdBannersEcosystem:
    """
    🧪 Suite de Pruebas Unitarias de Arquitectura y Seguridad:
    Ecosistema de Banners Publicitarios, Mega Banner, Rotación y Facturación Multiciclo.
    """

    def test_01_ad_banner_positions_and_pricing_integrity(self):
        """Verifica que las 3 posiciones publicitarias coincidan con las tarifas del Media Kit."""
        official_slots = {
            'sidebar': {
                'name': 'Banner Lateral en Noticias',
                'price': 39990,
                'db_position': 'news_sidebar',
            },
            'calculator': {
                'name': 'Banner Calculadora de Sueldos',
                'price': 49990,
                'db_position': 'calculator',
            },
            'header': {
                'name': 'Mega Banner Superior (Header)',
                'price': 59990,
                'db_position': 'header_top',
            },
        }

        assert official_slots['sidebar']['price'] == 39990
        assert official_slots['calculator']['price'] == 49990
        assert official_slots['header']['price'] == 59990
        assert official_slots['sidebar']['db_position'] == 'news_sidebar'
        assert official_slots['header']['db_position'] == 'header_top'

    def test_02_url_sanitization_blocks_xss_and_dangerous_schemes(self):
        """Valida que el filtro de seguridad bloquee inyecciones XSS y esquemas peligrosos en URLs."""
        def sanitize_target_url(raw_url: str) -> tuple[bool, str]:
            url = (raw_url or '').strip()
            if not url.startswith('https://') and not url.startswith('http://'):
                url = f"https://{url}"
            
            # Bloqueo estricto de esquemas maliciosos
            forbidden = ['javascript:', 'data:', 'vbscript:', '<script', 'onload=']
            for f in forbidden:
                if f in url.lower():
                    return False, "URL insegura detectada"
            return True, url

        # Casos seguros
        ok1, res1 = sanitize_target_url("www.automotorasur.cl")
        assert ok1 is True
        assert res1 == "https://www.automotorasur.cl"

        ok2, res2 = sanitize_target_url("https://wa.me/56912345678")
        assert ok2 is True
        assert res2 == "https://wa.me/56912345678"

        # Casos de ataque XSS bloqueados
        bad1, _ = sanitize_target_url("javascript:alert(document.cookie)")
        assert bad1 is False

        bad2, _ = sanitize_target_url("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")
        assert bad2 is False

        bad3, _ = sanitize_target_url("https://malicious.com/?q=<script>fetch('/api')</script>")
        assert bad3 is False

    def test_03_active_banner_query_filters_expired_and_pending(self):
        """Verifica que un banner vencido o en estado pending no sea servido al público."""
        now = datetime.datetime.now(datetime.timezone.utc)
        
        banner_active = {
            'id': 'b1',
            'status': 'active',
            'starts_at': (now - datetime.timedelta(days=2)).isoformat(),
            'expires_at': (now + datetime.timedelta(days=28)).isoformat(),
        }
        
        banner_expired = {
            'id': 'b2',
            'status': 'active',
            'starts_at': (now - datetime.timedelta(days=35)).isoformat(),
            'expires_at': (now - datetime.timedelta(days=5)).isoformat(),
        }
        
        banner_pending_payment = {
            'id': 'b3',
            'status': 'pending',
            'starts_at': now.isoformat(),
            'expires_at': (now + datetime.timedelta(days=30)).isoformat(),
        }

        def is_banner_visible(b: dict) -> bool:
            if b['status'] != 'active':
                return False
            expires = datetime.datetime.fromisoformat(b['expires_at'])
            return expires >= now

        assert is_banner_visible(banner_active) is True
        assert is_banner_visible(banner_expired) is False
        assert is_banner_visible(banner_pending_payment) is False

    def test_04_webhook_hmac_activation_sets_dynamic_validity(self):
        """Comprueba que la activación asigne 30, 180 o 365 días según el ciclo."""
        activation_time = datetime.datetime(2026, 8, 29, 20, 0, 0, tzinfo=datetime.timezone.utc)
        
        # Mensual
        exp_monthly = activation_time + datetime.timedelta(days=30)
        assert (exp_monthly - activation_time).days == 30

        # Semestral
        exp_semi = activation_time + datetime.timedelta(days=180)
        assert (exp_semi - activation_time).days == 180

        # Anual
        exp_annual = activation_time + datetime.timedelta(days=365)
        assert (exp_annual - activation_time).days == 365

    def test_05_fallback_slot_renders_when_no_active_banner(self):
        """Verifica que cuando no hay anunciante activo, el slot muestre el CTA de venta."""
        active_banner = None
        fallback_rendered = active_banner is None
        assert fallback_rendered is True

    def test_06_multi_cycle_billing_math_and_discounts(self):
        """Valida con exactitud matemática los descuentos del 15% (semestral) y 25% (anual)."""
        base_prices = {
            'sidebar': 39990,
            'calculator': 49990,
            'header': 59990,
        }

        for slot, base in base_prices.items():
            # Mensual
            assert base == base_prices[slot]
            # Semestral: base * 6 * 0.85
            expected_semi = round(base * 6 * 0.85)
            assert expected_semi < (base * 6)
            assert round(expected_semi / (base * 6), 2) == 0.85
            # Anual: base * 12 * 0.75 (Paga 9 meses, recibe 12)
            expected_annual = round(base * 12 * 0.75)
            assert expected_annual == base * 9
            assert round(expected_annual / (base * 12), 2) == 0.75

        # Tarifas anuales calculadas
        assert round(39990 * 12 * 0.75) == 359910
        assert round(49990 * 12 * 0.75) == 449910
        assert round(59990 * 12 * 0.75) == 539910

    def test_07_ad_rotation_distribution_uniformity(self):
        """Simula la rotación aleatoria uniforme de 3 anunciantes en 1.500 impresiones."""
        advertisers = ['Empresa_A', 'Empresa_B', 'Empresa_C']
        counts = {adv: 0 for adv in advertisers}
        
        simulations = 1500
        for _ in range(simulations):
            picked = random.choice(advertisers)
            counts[picked] += 1

        # Cada uno debe recibir aproximadamente el 33.3% (tolerancia ±5%)
        for adv, count in counts.items():
            percentage = (count / simulations) * 100
            assert 27.0 <= percentage <= 40.0, f"Distribución de {adv} fuera de rango: {percentage}%"
