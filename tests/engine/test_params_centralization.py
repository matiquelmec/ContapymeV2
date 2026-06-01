"""Contrato de centralización: los parámetros legales tienen una sola fuente.

Blinda que PayrollSettings (motor) y la tabla de impuesto no divergen de
national_params (SSoT), y que el tramo de asignación familiar usa los mismos
topes para el monto y para la letra informada en Previred/LRE.
"""

import sys

sys.path.append("engine")

from calculators import national_params as NP
from calculators.chilean_payroll import PayrollSettings, TRAMOS_IMPUESTO, calcular_asignacion_familiar


def test_payroll_settings_defaults_match_ssot():
    s = PayrollSettings()
    assert s.afp_sis_pct == NP.SIS_PCT
    assert s.uf_tope_afp == NP.TOPE_AFP_UF
    assert s.uf_tope_salud == NP.TOPE_SALUD_UF
    assert s.uf_tope_afc == NP.TOPE_AFC_UF
    assert s.sueldo_minimo == NP.SUELDO_MINIMO
    assert s.retencion_honorarios_pct == NP.RETENCION_HONORARIOS_PCT
    assert s.afc_indefinido_trabajador_pct == NP.AFC_INDEFINIDO_TRABAJADOR_PCT


def test_tax_brackets_are_single_source():
    # El motor usa exactamente la tabla de national_params (sin copia divergente).
    assert TRAMOS_IMPUESTO is NP.TRAMOS_IMPUESTO_UNICO


def test_tramo_letter_matches_payment_thresholds():
    # La letra del tramo se decide con los mismos topes que el monto.
    tope_a = NP.ASIGNACION_FAMILIAR["tramo_a"]["tope_renta"]
    tope_b = NP.ASIGNACION_FAMILIAR["tramo_b"]["tope_renta"]

    assert NP.get_tramo_asignacion(tope_a) == "A"
    assert NP.get_tramo_asignacion(tope_a + 1) == "B"
    assert NP.get_tramo_asignacion(tope_b + 1) == "C"
    # En el tramo A hay monto > 0; en D no.
    assert calcular_asignacion_familiar(tope_a, 1) > 0
    assert calcular_asignacion_familiar(99_999_999, 1) == 0
