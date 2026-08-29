import pytest
from engine.calculators.national_params import (
    SUELDO_MINIMO,
    TOPE_AFP_UF,
    TOPE_SALUD_UF,
    TOPE_AFC_UF,
    AFP_COMISIONES,
    RETENCION_HONORARIOS_PCT,
)
from engine.calculators.chilean_payroll import (
    calcular_liquidacion,
    EmployeeInput,
    PayrollSettings,
)


def test_national_params_integrity():
    assert SUELDO_MINIMO >= 500000, 'El sueldo minimo debe ser >= 500.000 CLP'
    assert TOPE_AFP_UF >= 80.0, 'El tope imponible de AFP debe ser acorde a UF'
    assert TOPE_SALUD_UF == TOPE_AFP_UF, 'El tope de salud debe ser identico al de AFP'
    assert TOPE_AFC_UF >= 120.0, 'El tope de AFC debe ser mayor al de AFP'
    assert RETENCION_HONORARIOS_PCT == 15.25, 'La retencion de honorarios 2026 debe ser 15.25%'


def test_afp_commissions_coverage():
    expected_afps = {'HABITAT', 'CAPITAL', 'CUPRUM', 'MODELO', 'PLANVITAL', 'UNO', 'PROVIDA'}
    assert set(AFP_COMISIONES.keys()) == expected_afps
    for afp, com in AFP_COMISIONES.items():
        assert 0.40 <= com <= 2.00, f'Comision de AFP {afp} fuera de rango legal ({com}%)'


def test_liquidation_calculation_flow():
    emp = EmployeeInput(
        sueldo_base=1000000,
        tipo_contrato='indefinido',
        afp_code='UNO',
        afp_comision_pct=0.49,
        salud_code='FONASA',
        salud_pct=7.0,
        gratificacion_legal=True,
    )
    settings = PayrollSettings(
        uf_valor=39500.0,
    )
    result = calcular_liquidacion(emp=emp, settings=settings, utm_valor=68500.0)
    assert result.total_haberes_brutos > 1000000
    assert result.sueldo_liquido > 0
    assert result.sueldo_liquido < result.total_haberes_brutos
    assert result.afp > 0
    assert result.salud > 0
