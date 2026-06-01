"""Contrato del motor: crédito social CCAF como otro descuento (no legal).

El crédito CCAF lo descuenta el empleador del líquido y lo entera a la Caja.
Debe rebajar el sueldo líquido sin afectar las bases imponibles ni los
descuentos legales.
"""

import sys

sys.path.append("engine")

from calculators.chilean_payroll import (
    EmployeeInput,
    PayrollSettings,
    calcular_liquidacion,
    to_db_dict,
)


def _settings() -> PayrollSettings:
    return PayrollSettings()


def test_credito_ccaf_rebaja_liquido_sin_tocar_imponible():
    base = EmployeeInput(sueldo_base=700000, gratificacion_legal=False, mes_proceso="2026-05")
    sin = calcular_liquidacion(base, _settings())

    con = EmployeeInput(
        sueldo_base=700000, gratificacion_legal=False, mes_proceso="2026-05", credito_ccaf=25000
    )
    res = calcular_liquidacion(con, _settings())

    assert res.credito_ccaf == 25000
    assert res.otros_descuentos == 25000
    # No altera bases imponibles ni descuentos legales.
    assert res.base_imponible_afp == sin.base_imponible_afp
    assert res.total_descuentos_legales == sin.total_descuentos_legales
    # Rebaja el líquido exactamente en el crédito.
    assert res.sueldo_liquido == sin.sueldo_liquido - 25000


def test_to_db_dict_incluye_credito_ccaf():
    emp = EmployeeInput(sueldo_base=700000, gratificacion_legal=False, mes_proceso="2026-05", credito_ccaf=25000)
    res = calcular_liquidacion(emp, _settings())
    d = to_db_dict(res, "org", "emp", "2026-05-01")
    assert d["credito_ccaf"] == 25000
    assert d["otros_descuentos"] == 25000
    # total_descuentos = legales + otros
    assert d["total_descuentos"] == res.total_descuentos_legales + 25000
