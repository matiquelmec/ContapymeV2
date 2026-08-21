"""
test_fuzz_1000_scenarios.py — Prueba de Estrés de 1.000 Escenarios Aleatorios
=============================================================================
Auditoría masiva del motor de cálculo de remuneraciones de Contapymepuq.
Genera 1.000 combinaciones aleatorias de contratos, sueldos, AFPs, Isapres y
zonas extremas para certificar tasa de error 0% y cumplimiento normativo.
"""

import random
import pytest
from engine.calculators.chilean_payroll import (
    calcular_liquidacion,
    EmployeeInput,
    PayrollSettings
)

AFPS = [
    ("CAPITAL", 1.44),
    ("CUPRUM", 1.44),
    ("HABITAT", 1.27),
    ("MODELO", 0.58),
    ("PLANVITAL", 1.16),
    ("PROVIDA", 1.45),
    ("UNO", 0.49),
]

SALUD_OPTIONS = [
    ("FONASA", 7.0, 0.0),
    ("ISAPRE COLMENA", 7.0, 2.5),
    ("ISAPRE BANMEDICA", 7.0, 4.2),
    ("ISAPRE CRUZ BLANCA", 7.0, 6.0),
    ("ISAPRE CONSALUD", 7.0, 8.5),
]

CONTRATOS = ["indefinido", "fijo", "honorarios"]
ZONAS = ["", "MAGALLANES", "AYSEN", "ARICA", "TARAPACA"]


def test_fuzz_1000_payroll_calculations():
    """Ejecuta 1.000 liquidaciones aleatorias y verifica invariantes legales."""
    random.seed(2026)  # Reproducibilidad
    settings = PayrollSettings(
        uf_valor=38000.0,
        sueldo_minimo=500000
    )
    utm_valor = 67294.0

    errores = []

    for i in range(1000):
        sueldo_base = random.randint(500000, 15000000)
        tipo_contrato = random.choice(CONTRATOS)
        afp_code, afp_comision = random.choice(AFPS)
        salud_code, salud_pct, plan_uf = random.choice(SALUD_OPTIONS)
        dias = random.choice([30, 25, 15, 10, 1])
        cargas = random.randint(0, 5)
        zona = random.choice(ZONAS)
        es_zona = bool(zona)

        emp = EmployeeInput(
            sueldo_base=sueldo_base,
            tipo_contrato=tipo_contrato,
            afp_code=afp_code,
            afp_comision_pct=afp_comision,
            salud_code=salud_code,
            salud_pct=salud_pct,
            plan_salud_uf=plan_uf,
            gratificacion_legal=True,
            asignacion_movilizacion=random.choice([0, 30000, 50000]),
            asignacion_colacion=random.choice([0, 40000, 60000]),
            horas_extra=random.choice([0, 5, 10, 20]),
            bono_extra=random.choice([0, 50000, 200000]),
            dias_trabajados=dias,
            family_allowances=cargas,
            es_zona_extrema=es_zona,
            zona_extrema=zona
        )

        try:
            res = calcular_liquidacion(emp, settings, utm_valor=utm_valor)

            # --- INVARIANTES LEGALES Y MATEMÁTICAS ---
            # 1. El sueldo líquido nunca puede ser negativo ni mayor que los haberes totales
            assert res.sueldo_liquido >= 0, f"Escenario {i}: Líquido negativo ({res.sueldo_liquido})"
            assert res.sueldo_liquido <= res.total_haberes_brutos, f"Escenario {i}: Líquido > Bruto"

            # 2. Si es honorarios, no debe tener cotización de AFP ni Salud obligatoria tradicional
            if tipo_contrato == "honorarios":
                assert res.afp == 0, f"Escenario {i}: Honorarios con AFP"
                assert res.salud == 0, f"Escenario {i}: Honorarios con Salud"
                assert res.retencion_honorarios > 0, f"Escenario {i}: Honorarios sin retención"

            # 3. Los haberes brutos deben sumar exactamente imponibles + no imponibles + asignación familiar
            assert res.total_haberes_brutos == (res.sueldo_base + res.gratificacion + res.asignacion_movilizacion +
                                                res.asignacion_colacion + res.asignacion_viatico + res.horas_extra_monto +
                                                res.bono_extra + res.bono_fijo + res.semana_corrida +
                                                res.otros_haberes_imponibles + res.otros_haberes_no_imponibles +
                                                res.asignacion_familiar)

            # 4. Los descuentos legales deben ser <= total de haberes, salvo en casos extremos de plan Isapre fijo en UF con pocos días
            if not any("Líquido negativo" in adv for adv in res.advertencias):
                assert res.total_descuentos_legales <= res.total_haberes_brutos

        except Exception as e:
            errores.append(f"Error en iteración {i} [Sueldo: {sueldo_base}, Contrato: {tipo_contrato}]: {str(e)}")

    assert len(errores) == 0, f"Se encontraron {len(errores)} errores en 1.000 pruebas:\n" + "\n".join(errores[:5])
