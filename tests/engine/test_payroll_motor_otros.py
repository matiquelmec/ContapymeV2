"""Contrato del motor: otros descuentos (anticipo/préstamo/retención judicial)
y horas extra al 100% (Art. 32 CT, recargo en domingos/festivos).
"""

import sys

sys.path.append("engine")

from calculators.chilean_payroll import (
    EmployeeInput,
    PayrollSettings,
    calcular_hora_extra,
    calcular_liquidacion,
    to_db_dict,
)


def _settings() -> PayrollSettings:
    return PayrollSettings()


# ── Otros descuentos (no legales) ───────────────────────────────────────────

def test_otros_descuentos_suman_y_rebajan_liquido():
    base = EmployeeInput(sueldo_base=800000, gratificacion_legal=False, mes_proceso="2026-05")
    sin = calcular_liquidacion(base, _settings())

    con = EmployeeInput(
        sueldo_base=800000,
        gratificacion_legal=False,
        mes_proceso="2026-05",
        credito_ccaf=10000,
        anticipo=20000,
        prestamo=15000,
        retencion_judicial=30000,
    )
    res = calcular_liquidacion(con, _settings())

    total_otros = 10000 + 20000 + 15000 + 30000
    assert res.otros_descuentos == total_otros
    assert res.anticipo == 20000
    assert res.prestamo == 15000
    assert res.retencion_judicial == 30000
    # No tocan bases imponibles ni descuentos legales.
    assert res.base_imponible_afp == sin.base_imponible_afp
    assert res.total_descuentos_legales == sin.total_descuentos_legales
    # Rebajan el líquido exactamente por la suma.
    assert res.sueldo_liquido == sin.sueldo_liquido - total_otros


def test_to_db_dict_otros_descuentos_en_total():
    emp = EmployeeInput(
        sueldo_base=800000, gratificacion_legal=False, mes_proceso="2026-05",
        anticipo=20000, prestamo=15000,
    )
    res = calcular_liquidacion(emp, _settings())
    d = to_db_dict(res, "org", "emp", "2026-05-01")
    assert d["otros_descuentos"] == 35000
    assert d["total_descuentos"] == res.total_descuentos_legales + 35000


# ── Horas extra al 100% ─────────────────────────────────────────────────────

def test_hora_extra_recargo_100_doble_de_50():
    he50 = calcular_hora_extra(900000, 10, 44, recargo=1.5)
    he100 = calcular_hora_extra(900000, 10, 44, recargo=2.0)
    # El 100% paga el doble del recargo respecto al ordinario; ratio 2.0/1.5.
    assert he100 > he50
    assert abs(he100 / he50 - (2.0 / 1.5)) < 0.01


def test_motor_incluye_horas_extra_100_imponible():
    base = EmployeeInput(sueldo_base=900000, gratificacion_legal=False, mes_proceso="2026-05")
    sin = calcular_liquidacion(base, _settings())

    con = EmployeeInput(
        sueldo_base=900000, gratificacion_legal=False, mes_proceso="2026-05",
        horas_extra_100=10,
    )
    res = calcular_liquidacion(con, _settings())
    esperado = calcular_hora_extra(900000, 10, 42, recargo=2.0)
    assert res.horas_extra_100_monto == esperado
    # Imponible: el 100% engrosa la base de AFP.
    assert res.base_imponible_afp == sin.base_imponible_afp + esperado
