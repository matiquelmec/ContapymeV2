"""Contrato del motor: viáticos (haber no imponible) y honorarios (retención).

Honorarios: el trabajador a honorarios NO cotiza AFP/salud/AFC ni recibe
gratificación. Solo se le aplica la retención de boletas (Ley 21.133, 15,25%
en 2026) sobre el bruto.
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


# ── Viáticos (no imponible) ─────────────────────────────────────────────────

def test_viatico_es_no_imponible():
    base = EmployeeInput(sueldo_base=700000, gratificacion_legal=False, mes_proceso="2026-05")
    sin = calcular_liquidacion(base, _settings())

    con = EmployeeInput(
        sueldo_base=700000, gratificacion_legal=False, mes_proceso="2026-05",
        asignacion_viatico=40000,
    )
    res = calcular_liquidacion(con, _settings())

    assert res.asignacion_viatico == 40000
    # No imponible: no cambia la base de AFP ni los descuentos legales.
    assert res.base_imponible_afp == sin.base_imponible_afp
    assert res.total_descuentos_legales == sin.total_descuentos_legales
    # Sube haberes brutos y líquido en el monto del viático.
    assert res.total_haberes_brutos == sin.total_haberes_brutos + 40000
    assert res.sueldo_liquido == sin.sueldo_liquido + 40000


# ── Honorarios ──────────────────────────────────────────────────────────────

def test_honorarios_no_cotiza_y_aplica_retencion():
    bruto = 1_000_000
    s = _settings()
    emp = EmployeeInput(
        sueldo_base=bruto,
        tipo_contrato="honorarios",
        gratificacion_legal=True,  # debe ignorarse en honorarios
        mes_proceso="2026-05",
    )
    res = calcular_liquidacion(emp, s)

    # Sin cotizaciones legales ni gratificación.
    assert res.afp == 0
    assert res.afp_comision == 0
    assert res.salud == 0
    assert res.afc_trabajador == 0
    assert res.sis_empresa == 0
    assert res.gratificacion == 0
    # Retención = bruto × tasa (15,25% en 2026 por defecto).
    esperado = int(round(bruto * s.retencion_honorarios_pct / 100))
    assert res.retencion_honorarios == esperado
    assert res.total_descuentos_legales == esperado
    assert res.sueldo_liquido == bruto - esperado


def test_honorarios_resta_otros_descuentos():
    bruto = 800_000
    s = _settings()
    emp = EmployeeInput(
        sueldo_base=bruto,
        tipo_contrato="honorarios",
        mes_proceso="2026-05",
        anticipo=50000,
    )
    res = calcular_liquidacion(emp, s)
    ret = int(round(bruto * s.retencion_honorarios_pct / 100))
    assert res.sueldo_liquido == bruto - ret - 50000
