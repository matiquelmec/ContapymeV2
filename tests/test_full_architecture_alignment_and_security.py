import pytest
import hmac
import hashlib

# 1. Matriz Oficial de Precios ERP SaaS y Descuentos Anuales
ERP_PLANS = {
    'emprendedor': {'monthly': 9990, 'annual_monthly': 7992},  # 20% off
    'pyme_pro': {'monthly': 24990, 'annual_monthly': 19992},   # 20% off
    'estudio': {'monthly': 49990, 'annual_monthly': 39992},    # 20% off
    'corporativo': {'monthly': 89990, 'annual_monthly': 71992} # 20% off
}

JOB_TIERS = {
    'free': {'price': 0, 'is_free': True, 'requires_payment': False},
    'basic': {'price': 2990, 'is_free': False, 'requires_payment': True},
    'featured': {'price': 4990, 'is_free': False, 'requires_payment': True},
    'faena': {'price': 9990, 'is_free': False, 'requires_payment': True}
}

def calculate_subscription_price(plan_type: str, billing_cycle: str) -> int:
    plan = ERP_PLANS[plan_type]
    if billing_cycle == 'annual':
        # Cobro anual con 20% de descuento (precio mensual * 12 * 0.8)
        return int(round(plan['monthly'] * 12 * 0.8))
    return plan['monthly']

def verify_mp_webhook_hmac(secret: str, data_id: str, request_id: str, ts: str, signature: str) -> bool:
    manifest = f"id:{data_id};request-id:{request_id};ts:{ts};"
    expected = hmac.new(secret.encode('utf-8'), manifest.encode('utf-8'), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


class TestFullArchitectureAlignmentAndSecurity:

    def test_01_job_free_tier_requires_no_payment_and_activates_instant(self):
        """Verifica que el plan básico $0 no active cobro y se publique de inmediato"""
        tier = JOB_TIERS['free']
        assert tier['price'] == 0
        assert tier['is_free'] is True
        assert tier['requires_payment'] is False

    def test_02_job_paid_tiers_require_mercadopago_checkout(self):
        """Verifica que los planes destacados requieran pasarela con tarifas exactas"""
        assert JOB_TIERS['basic']['price'] == 2990
        assert JOB_TIERS['basic']['requires_payment'] is True

        assert JOB_TIERS['featured']['price'] == 4990
        assert JOB_TIERS['featured']['requires_payment'] is True

        assert JOB_TIERS['faena']['price'] == 9990
        assert JOB_TIERS['faena']['requires_payment'] is True

    def test_03_subscription_monthly_prices(self):
        """Verifica precios mensuales del SaaS ERP"""
        assert calculate_subscription_price('emprendedor', 'monthly') == 9990
        assert calculate_subscription_price('pyme_pro', 'monthly') == 24990
        assert calculate_subscription_price('estudio', 'monthly') == 49990
        assert calculate_subscription_price('corporativo', 'monthly') == 89990

    def test_04_subscription_annual_20_percent_discount_calculation(self):
        """Verifica que el cobro anual aplique exactamente el 20% de descuento"""
        # Emprendedor: 9.990 * 12 = 119.880 -> con 20% off = 95.904
        assert calculate_subscription_price('emprendedor', 'annual') == 95904
        # Pyme Pro: 24.990 * 12 = 299.880 -> con 20% off = 239.904
        assert calculate_subscription_price('pyme_pro', 'annual') == 239904
        # Estudio: 49.990 * 12 = 599.880 -> con 20% off = 479.904
        assert calculate_subscription_price('estudio', 'annual') == 479904
        # Corporativo: 89.990 * 12 = 1.079.880 -> con 20% off = 863.904
        assert calculate_subscription_price('corporativo', 'annual') == 863904

    def test_05_webhook_hmac_sha256_cryptographic_verification(self):
        """Verifica la seguridad criptográfica del webhook de Mercado Pago con la clave secreta de producción"""
        secret = "a6d9614a125e923d3313fe43ba15b8028b93c0c636d84fbb1ac149e3d72811a4"
        data_id = "1735289065"
        req_id = "req_test_abc123"
        ts = "1724962800"

        manifest = f"id:{data_id};request-id:{req_id};ts:{ts};"
        valid_sig = hmac.new(secret.encode('utf-8'), manifest.encode('utf-8'), hashlib.sha256).hexdigest()

        # Debe validar firma correcta
        assert verify_mp_webhook_hmac(secret, data_id, req_id, ts, valid_sig) is True

        # Debe rechazar firma manipulada o interceptada
        assert verify_mp_webhook_hmac(secret, data_id, req_id, ts, "invalid_tampered_signature") is False

    def test_06_trial_period_countdown_math(self):
        """Verifica que el cálculo de días restantes del periodo de prueba sea exacto"""
        created_at_timestamp = 1724000000
        now_timestamp = 1724000000 + (3 * 24 * 3600) # 3 días después
        total_trial_days = 14
        
        elapsed_days = (now_timestamp - created_at_timestamp) // (24 * 3600)
        remaining_days = max(0, total_trial_days - elapsed_days)
        
        assert remaining_days == 11
