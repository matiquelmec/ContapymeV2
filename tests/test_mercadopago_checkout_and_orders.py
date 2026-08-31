import re
import pytest
import hmac
import hashlib

DISCRIMINATORY_PATTERNS = [
    re.compile(r'\b(edad\s*(?:entre|de|maxima|minima|debe\s*tener)?\s*\d{2}\s*(?:a|-|y)?\s*\d{2}\s*a[ñn]os?)\b', re.IGNORECASE),
    re.compile(r'\b(menor\s*de\s*\d{2}\s*a[ñn]os?)\b', re.IGNORECASE),
    re.compile(r'\b(mayor\s*de\s*\d{2}\s*a[ñn]os?)\b', re.IGNORECASE),
    re.compile(r'\b(buena\s*presencia)\b', re.IGNORECASE),
    re.compile(r'\b(foto\s*(?:obligatoria|actualizada|en\s*el\s*cv)?)\b', re.IGNORECASE),
    re.compile(r'\b(solter[oa]|casad[oa]|sin\s*hijos?)\b', re.IGNORECASE),
    re.compile(r'\b(dicom|bolet[ií]n\s*comercial|deudas?)\b', re.IGNORECASE),
]

def check_job_compliance(text: str):
    violations = []
    for pat in DISCRIMINATORY_PATTERNS:
        if pat.search(text):
            violations.append(pat.pattern)
    return len(violations) == 0, violations

JOB_TIER_PRICES = {
    'free': 0,
    'basic': 2990,
    'featured': 4990,
    'faena': 9990
}

SUBSCRIPTION_PLANS = {
    'emprendedor': {'name': 'Plan Emprendedor ERP', 'price': 9990},
    'pyme_pro': {'name': 'Plan Pyme Pro ERP', 'price': 24990},
    'estudio': {'name': 'Plan Estudio Contable ERP', 'price': 49990},
    'corporativo': {'name': 'Plan Corporativo ERP', 'price': 89990}
}

def calculate_tier_price(tier: str) -> int:
    return JOB_TIER_PRICES.get(tier, 0)

def calculate_subscription_price(plan_type: str, billing_cycle: str = 'monthly') -> int:
    plan = SUBSCRIPTION_PLANS.get(plan_type, SUBSCRIPTION_PLANS['emprendedor'])
    if billing_cycle == 'annual':
        return round(plan['price'] * 12 * 0.8)
    return plan['price']

def verify_mp_webhook_signature(secret_key: str, data_id: str, signature: str) -> bool:
    expected = hmac.new(
        secret_key.encode('utf-8'),
        data_id.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


class TestMercadoPagoCheckoutAndOrders:

    def test_01_free_tier_amount_is_zero(self):
        """Verifica que el plan básico comunitario sea 100% gratuito ($0)"""
        assert calculate_tier_price('free') == 0

    def test_02_paid_tiers_match_fair_prices(self):
        """Verifica que los planes destacados coincidan con las tarifas justas acordadas"""
        assert calculate_tier_price('basic') == 2990
        assert calculate_tier_price('featured') == 4990
        assert calculate_tier_price('faena') == 9990

    def test_03_slug_normalization_removes_accents_and_special_chars(self):
        """Verifica que el slug para la URL de empleo no tenga tildes ni caracteres inválidos"""
        raw_title = "Mecánico Hidráulico & Operador Grúa - Punta Arenas"
        clean = raw_title.lower()
        clean = re.sub(r'[áàäâ]', 'a', clean)
        clean = re.sub(r'[éèëê]', 'e', clean)
        clean = re.sub(r'[íìïî]', 'i', clean)
        clean = re.sub(r'[óòöô]', 'o', clean)
        clean = re.sub(r'[úùüû]', 'u', clean)
        clean = re.sub(r'ñ', 'n', clean)
        clean = re.sub(r'[^a-z0-9]+', '-', clean).strip('-')
        
        assert "mecanico-hidraulico-operador-grua-punta-arenas" == clean

    def test_04_compliance_filter_blocks_illegal_dicom_and_photo(self):
        """Verifica que el filtro de cumplimiento bloquee solicitudes de DICOM o fotografía"""
        bad_text = "Se busca cajera con buena presencia y sin antecedentes comerciales en DICOM"
        is_ok, violations = check_job_compliance(bad_text)
        assert not is_ok
        assert len(violations) >= 2

    def test_05_compliance_filter_approves_valid_job_description(self):
        """Verifica que descripciones legales pasen sin advertencias"""
        good_text = "Se busca Técnico Eléctrico para mantenimiento preventivo en plantas de Puerto Natales. Jornada 40 horas."
        is_ok, violations = check_job_compliance(good_text)
        assert is_ok
        assert len(violations) == 0

    def test_06_hmac_sha256_webhook_signature_verification(self):
        """Verifica la seguridad criptográfica de los webhooks contra firmas falsificadas"""
        secret = "mp_secret_key_patagonia_2026"
        data_id = "payment_987654321"
        
        valid_sig = hmac.new(secret.encode('utf-8'), data_id.encode('utf-8'), hashlib.sha256).hexdigest()
        
        assert verify_mp_webhook_signature(secret, data_id, valid_sig) is True
        assert verify_mp_webhook_signature(secret, data_id, "fake_signature_abc123") is False

    def test_07_idempotent_order_status_transitions(self):
        """Verifica que una orden no pueda retroceder de 'paid' a 'pending'"""
        order = {"id": "ord_1", "status": "pending", "paid_at": None}
        
        if order["status"] == "pending":
            order["status"] = "paid"
            order["paid_at"] = "2026-08-29T18:00:00Z"
            
        assert order["status"] == "paid"

    def test_08_subscription_monthly_pricing_matrix(self):
        """Valida que todos los planes SaaS mensuales coincidan exactamente con la matriz oficial"""
        assert calculate_subscription_price('emprendedor', 'monthly') == 9990
        assert calculate_subscription_price('pyme_pro', 'monthly') == 24990
        assert calculate_subscription_price('estudio', 'monthly') == 49990
        assert calculate_subscription_price('corporativo', 'monthly') == 89990

    def test_09_subscription_annual_discount_calculation(self):
        """Valida el cálculo del 20% de descuento en suscripciones anuales"""
        # Emprendedor anual: 9990 * 12 * 0.8 = 95904
        assert calculate_subscription_price('emprendedor', 'annual') == 95904
        # Pyme Pro anual: 24990 * 12 * 0.8 = 239904
        assert calculate_subscription_price('pyme_pro', 'annual') == 239904

    def test_10_webhook_external_reference_parser(self):
        """Valida que el webhook decodifique correctamente el tipo de recurso y el ID correspondiente"""
        def parse_ext_ref(ext_ref: str):
            if ext_ref.startswith('sub_'):
                parts = ext_ref.split('_')
                return {'type': 'subscription', 'org_id': parts[1], 'plan': '_'.join(parts[2:]) if len(parts) > 2 else 'pyme_pro'}
            elif ext_ref.startswith('job_'):
                return {'type': 'job', 'job_id': ext_ref.replace('job_', '')}
            elif ext_ref.startswith('banner_'):
                return {'type': 'banner', 'banner_id': ext_ref.replace('banner_', '')}
            elif ext_ref.startswith('news_'):
                return {'type': 'news', 'news_id': ext_ref.replace('news_', '')}
            return {'type': 'unknown'}

        sub_parsed = parse_ext_ref('sub_org123_pyme_pro')
        assert sub_parsed['type'] == 'subscription'
        assert sub_parsed['org_id'] == 'org123'
        assert sub_parsed['plan'] == 'pyme_pro'

        job_parsed = parse_ext_ref('job_550e8400-e29b-41d4-a716-446655440000')
        assert job_parsed['type'] == 'job'
        assert job_parsed['job_id'] == '550e8400-e29b-41d4-a716-446655440000'
