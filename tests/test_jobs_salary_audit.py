"""
🧪 Suite de Pruebas Unitarias: Auditoría y Certificación Salarial (Bruto vs. Líquido)
=====================================================================================
Valida la coherencia de rentas en ContaEmpleos PUQ:
- Motor directo (Bruto a Líquido / Net-Down)
- Motor inverso (Líquido a Bruto / Gross-Up)
- Identidad matemática f(f^-1(L)) = L
- Preservación de ofertas laborales en Líquido (ej. $850.000 líquidos en bolsillo)
- Detector inteligente de modalidad (Líquido vs. Bruto)
- Sanitización de entradas numéricas y aportes patronales (SIS + AFC Empleador)
"""

import pytest
import math

TASA_AFP = 0.1145
TASA_SALUD = 0.0700
TASA_AFC = 0.0060
TASA_PREVISIONAL_TOTAL = TASA_AFP + TASA_SALUD + TASA_AFC  # 0.1905
FACTOR_NETO = 1.0 - TASA_PREVISIONAL_TOTAL  # 0.8095

TASA_SIS_EMPRESA = 0.0149
TASA_AFC_EMPRESA = 0.0240


def calcular_impuesto_segunda_categoria(base_tributable: int) -> int:
    if base_tributable <= 943500:
        return 0
    if base_tributable <= 2096670:
        return round((base_tributable * 0.04) - 37740)
    if base_tributable <= 3494450:
        return round((base_tributable * 0.08) - 121607)
    if base_tributable <= 4892230:
        return round((base_tributable * 0.135) - 313801)
    return round((base_tributable * 0.23) - 778563)


def calculate_from_gross(gross: float):
    safe_gross = max(0, min(50000000, round(gross)))
    afp = round(safe_gross * TASA_AFP)
    salud = round(safe_gross * TASA_SALUD)
    afc = round(safe_gross * TASA_AFC)

    base_tributable = max(0, safe_gross - afp - salud - afc)
    impuesto = max(0, calcular_impuesto_segunda_categoria(base_tributable))

    total_descuentos = afp + salud + afc + impuesto
    liquido = max(0, safe_gross - total_descuentos)

    sis_empresa = round(safe_gross * TASA_SIS_EMPRESA)
    afc_empresa = round(safe_gross * TASA_AFC_EMPRESA)
    costo_total_empresa = safe_gross + sis_empresa + afc_empresa

    return {
        "gross": safe_gross,
        "liquido": liquido,
        "afp": afp,
        "salud": salud,
        "afc": afc,
        "impuesto": impuesto,
        "total_descuentos": total_descuentos,
        "sis_empresa": sis_empresa,
        "afc_empresa": afc_empresa,
        "costo_total_empresa": costo_total_empresa,
    }


def calculate_from_net(target_net: float):
    safe_net = max(0, min(40000000, round(target_net)))
    if safe_net == 0:
        return calculate_from_gross(0)

    approx_gross = round(safe_net / FACTOR_NETO)
    current = calculate_from_gross(approx_gross)

    iterations = 0
    while current["liquido"] != safe_net and iterations < 30:
        diff = safe_net - current["liquido"]
        approx_gross += diff
        current = calculate_from_gross(approx_gross)
        iterations += 1

    return current


def detect_salary_mode(salary_raw: str = None) -> str:
    if not salary_raw:
        return "liquido"
    text = salary_raw.lower()
    if "bruto" in text or "imponible" in text:
        return "bruto"
    return "liquido"


class TestJobsSalaryAudit:

    def test_01_gross_to_net_calculation(self):
        """Verifica que un sueldo bruto de $1.000.000 descuente exactamente 19.05% previsional en tramo exento."""
        res = calculate_from_gross(1000000)
        assert res["gross"] == 1000000
        assert res["afp"] == 114500  # 11.45%
        assert res["salud"] == 70000  # 7.00%
        assert res["afc"] == 6000     # 0.60%
        assert res["impuesto"] == 0   # Base tributable 809.500 < 943.500 (Exento)
        assert res["total_descuentos"] == 190500
        assert res["liquido"] == 809500

    def test_02_net_to_gross_inversion_identity(self):
        """Verifica que la inversión (Gross-Up) cumpla f(f^-1(L)) = L de forma exacta para múltiples montos."""
        test_amounts = [500000, 650000, 780000, 850000, 950000, 1200000, 1600000, 2500000]

        for net_target in test_amounts:
            calc_net = calculate_from_net(net_target)
            assert calc_net["liquido"] == net_target, f"Fallo cuadratura para líquido {net_target}"

            # Verificación cruzada: pasando el bruto resultante al motor directo
            cross_check = calculate_from_gross(calc_net["gross"])
            assert cross_check["liquido"] == net_target, f"Fallo identidad cruzada para {net_target}"

    def test_03_job_offer_850k_liquido_preservation(self):
        """Verifica el caso reportado por el usuario: Oferta de 850.000 Líquido.
        No debe dar $688.075, sino mantener exactamente $850.000 en mano con un bruto de ~$1.050.030."""
        calc = calculate_from_net(850000)

        assert calc["liquido"] == 850000, "El trabajador debe recibir exactamente $850.000 en su cuenta."
        assert calc["gross"] == 1050031 or calc["gross"] == 1050030
        assert calc["afp"] == round(calc["gross"] * 0.1145)
        assert calc["salud"] == round(calc["gross"] * 0.07)
        assert calc["afc"] == round(calc["gross"] * 0.006)
        assert calc["gross"] - calc["total_descuentos"] == 850000

    def test_04_salary_raw_detection_rules(self):
        """Verifica que el detector reconozca automáticamente si la oferta viene en Líquido o Bruto."""
        assert detect_salary_mode("$850.000 - $950.000 Líquido") == "liquido"
        assert detect_salary_mode("$1.200.000 Líquido en bolsillo") == "liquido"
        assert detect_salary_mode("$1.000.000 Bruto") == "bruto"
        assert detect_salary_mode("Sueldo Imponible $1.500.000") == "bruto"
        assert detect_salary_mode(None) == "liquido"
        assert detect_salary_mode("") == "liquido"

    def test_05_employer_cost_calculation(self):
        """Verifica que el costo empleador incluya SIS (1.49%) y AFC empresa (2.40%)."""
        calc = calculate_from_gross(1000000)
        assert calc["sis_empresa"] == 14900
        assert calc["afc_empresa"] == 24000
        assert calc["costo_total_empresa"] == 1000000 + 14900 + 24000  # 1.038.900 CLP

    def test_06_input_sanitization_and_bounds(self):
        """Verifica la seguridad y robustez ante montos nulos, negativos o desbordados."""
        res_zero = calculate_from_gross(0)
        assert res_zero["gross"] == 0
        assert res_zero["liquido"] == 0

        res_negative = calculate_from_gross(-50000)
        assert res_negative["gross"] == 0
        assert res_negative["liquido"] == 0

        res_max = calculate_from_gross(999999999)
        assert res_max["gross"] == 50000000  # Acotado al límite superior de seguridad
