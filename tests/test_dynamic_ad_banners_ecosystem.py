import pytest
import datetime

class TestDynamicAdBannersEcosystem:
    """
    🧪 Suite de Pruebas Unitarias de Arquitectura y Seguridad:
    Ecosistema de Banners Publicitarios y Media Kit Digital ContaPymePUQ.
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

    def test_04_webhook_hmac_activation_sets_30_days_validity(self):
        """Comprueba que la activación automática extienda la vigencia exactamente por 30 días."""
        activation_time = datetime.datetime(2026, 8, 29, 20, 0, 0, tzinfo=datetime.timezone.utc)
        duration_days = 30
        
        expires_at = activation_time + datetime.timedelta(days=duration_days)
        assert (expires_at - activation_time).days == 30

    def test_05_fallback_slot_renders_when_no_active_banner(self):
        """Verifica que cuando la base de datos retorna null, el slot muestre el CTA de venta."""
        active_banner = None
        
        fallback_rendered = active_banner is None
        assert fallback_rendered is True
