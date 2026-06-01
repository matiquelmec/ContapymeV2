"""Contrato del motor: semana corrida (Art. 45 CT) y jornada parcial.

Fija el comportamiento esperado del motor de cálculo para:
  - Semana corrida sobre remuneración variable (comisiones/bonos variables).
  - Jornada parcial: prorrateo del piso de sueldo mínimo.
"""

import calendar
import sys
from datetime import date

sys.path.append("engine")

from calculators.chilean_payroll import (
    EmployeeInput,
    PayrollSettings,
    calcular_liquidacion,
    calcular_semana_corrida,
)


def _domingos(year: int, month: int) -> int:
    ndays = calendar.monthrange(year, month)[1]
    return sum(1 for d in range(1, ndays + 1) if date(year, month, d).weekday() == 6)


def _settings() -> PayrollSettings:
    return PayrollSettings()


# ── Semana corrida ──────────────────────────────────────────────────────────

def test_semana_corrida_helper_promedio_por_dias_no_laborales():
    # promedio diario = 300000 / 30 = 10000 ; con 4 domingos => 40000
    assert calcular_semana_corrida(300000, 30, 4) == 40000


def test_semana_corrida_helper_returns_zero_without_inputs():
    assert calcular_semana_corrida(0, 30, 4) == 0
    assert calcular_semana_corrida(300000, 0, 4) == 0
    assert calcular_semana_corrida(300000, 30, 0) == 0


def test_motor_no_semana_corrida_by_default():
    emp = EmployeeInput(sueldo_base=600000, gratificacion_legal=False, mes_proceso="2026-05")
    res = calcular_liquidacion(emp, _settings())
    assert res.semana_corrida == 0


def test_motor_semana_corrida_is_imponible_and_added():
    # Uso real: la comisión (300000) entra como haber imponible (bono_extra) y a la vez
    # es la base de referencia de la semana corrida (monto_variable).
    domingos = _domingos(2026, 5)
    esperado = int(round((300000 / 30) * domingos))
    emp = EmployeeInput(
        sueldo_base=600000,
        gratificacion_legal=False,
        bono_extra=300000,
        tiene_semana_corrida=True,
        monto_variable=300000,
        dias_trabajados=30,
        mes_proceso="2026-05",
    )
    res = calcular_liquidacion(emp, _settings())
    assert res.semana_corrida == esperado
    # Es imponible: forma parte de la base de AFP y de los haberes brutos.
    assert res.base_imponible_afp == 600000 + 300000 + esperado
    assert res.semana_corrida <= res.total_haberes_brutos


def test_motor_semana_corrida_includes_festivos():
    domingos = _domingos(2026, 5)
    con_festivo = int(round((300000 / 30) * (domingos + 1)))
    emp = EmployeeInput(
        sueldo_base=600000,
        gratificacion_legal=False,
        tiene_semana_corrida=True,
        monto_variable=300000,
        dias_trabajados=30,
        festivos_en_periodo=1,
        mes_proceso="2026-05",
    )
    res = calcular_liquidacion(emp, _settings())
    assert res.semana_corrida == con_festivo


# ── Jornada parcial ─────────────────────────────────────────────────────────

def test_jornada_parcial_no_falsa_advertencia_minimo():
    # Media jornada (22h/44): el piso mínimo se prorratea, no debe advertir.
    emp = EmployeeInput(
        sueldo_base=280000,
        gratificacion_legal=False,
        dias_trabajados=30,
        horas_semanales=22,
        jornada_parcial=True,
        mes_proceso="2026-05",
    )
    res = calcular_liquidacion(emp, _settings())
    assert not any("inferior al m" in a.lower() for a in res.advertencias)


def test_jornada_completa_bajo_minimo_si_advierte():
    emp = EmployeeInput(
        sueldo_base=300000,
        gratificacion_legal=False,
        dias_trabajados=30,
        horas_semanales=44,
        jornada_parcial=False,
        mes_proceso="2026-05",
    )
    res = calcular_liquidacion(emp, _settings())
    assert any("inferior al m" in a.lower() for a in res.advertencias)
