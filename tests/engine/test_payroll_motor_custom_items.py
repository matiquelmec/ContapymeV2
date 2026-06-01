"""Contrato del motor: haberes y descuentos configurables (genéricos).

El motor expone tres cubos para conceptos definidos por la empresa:
  - otros_haberes_imponibles  → imponibles y tributables (engrosan base AFP/salud/impuesto)
  - otros_haberes_no_imponibles → no imponibles (suben líquido sin cotizar)
  - otros_descuentos_varios   → descuentos no legales (bajan líquido)
"""

import sys

sys.path.append("engine")

from calculators.chilean_payroll import (
    EmployeeInput,
    PayrollSettings,
    calcular_liquidacion,
)


def _settings() -> PayrollSettings:
    return PayrollSettings()


def test_haber_imponible_engrosa_base():
    base = EmployeeInput(sueldo_base=700000, gratificacion_legal=False, mes_proceso="2026-06")
    sin = calcular_liquidacion(base, _settings())

    con = EmployeeInput(
        sueldo_base=700000, gratificacion_legal=False, mes_proceso="2026-06",
        otros_haberes_imponibles=50000,
    )
    res = calcular_liquidacion(con, _settings())

    assert res.otros_haberes_imponibles == 50000
    assert res.base_imponible_afp == sin.base_imponible_afp + 50000
    assert res.total_haberes_brutos == sin.total_haberes_brutos + 50000


def test_haber_no_imponible_sube_liquido_sin_cotizar():
    base = EmployeeInput(sueldo_base=700000, gratificacion_legal=False, mes_proceso="2026-06")
    sin = calcular_liquidacion(base, _settings())

    con = EmployeeInput(
        sueldo_base=700000, gratificacion_legal=False, mes_proceso="2026-06",
        otros_haberes_no_imponibles=40000,
    )
    res = calcular_liquidacion(con, _settings())

    assert res.otros_haberes_no_imponibles == 40000
    assert res.base_imponible_afp == sin.base_imponible_afp  # no cotiza
    assert res.total_haberes_brutos == sin.total_haberes_brutos + 40000
    assert res.sueldo_liquido == sin.sueldo_liquido + 40000


def test_descuento_vario_baja_liquido():
    base = EmployeeInput(sueldo_base=700000, gratificacion_legal=False, mes_proceso="2026-06")
    sin = calcular_liquidacion(base, _settings())

    con = EmployeeInput(
        sueldo_base=700000, gratificacion_legal=False, mes_proceso="2026-06",
        otros_descuentos_varios=25000,
    )
    res = calcular_liquidacion(con, _settings())

    assert res.otros_descuentos_varios == 25000
    assert res.otros_descuentos >= 25000
    assert res.base_imponible_afp == sin.base_imponible_afp
    assert res.sueldo_liquido == sin.sueldo_liquido - 25000


def test_honorarios_incluye_haberes_y_descuentos_configurables():
    s = _settings()
    emp = EmployeeInput(
        sueldo_base=1000000, tipo_contrato="honorarios", mes_proceso="2026-06",
        otros_haberes_imponibles=100000,   # parte del honorario
        otros_descuentos_varios=30000,
    )
    res = calcular_liquidacion(emp, s)
    bruto = 1000000 + 100000
    ret = int(round(bruto * s.retencion_honorarios_pct / 100))
    assert res.total_haberes_brutos == bruto
    assert res.retencion_honorarios == ret
    assert res.sueldo_liquido == bruto - ret - 30000
