import sys
sys.path.append("engine")

from calculators.chilean_payroll import (
    EmployeeInput,
    PayrollSettings,
    calcular_liquidacion,
    to_db_dict
)

# Simulamos la empresa (Settings Nacionales y de Empresa en 2026)
# UF aprox 38000, UTM aprox 67000
settings = PayrollSettings(
    uf_valor=38000.0,
    uf_tope_afp=87.8,
    uf_tope_salud=83.3,
    uf_tope_afc=126.6,
    sueldo_minimo=529000
)
utm_valor = 67294.0

print("=== SHADOW TEST LRE: ESCENARIOS EXTREMOS ===")

# Escenario 1: Sueldo alto con Isapre Cara
print("\n[TEST 1] Trabajador Alta Renta + Isapre Cara")
emp1 = EmployeeInput(
    sueldo_base=3_500_000,   # Alto sueldo base
    tipo_contrato="indefinido",
    afp_code="HABITAT",
    afp_comision_pct=1.27,
    salud_code="CONSALUD",
    plan_salud_uf=7.5,       # Plan muy alto (7.5 * 38000 = 285.000)
    gratificacion_legal=True,
    horas_semanales=44,
    horas_extra=0,
    dias_trabajados=30
)

res1 = calcular_liquidacion(emp1, settings, utm_valor)
db_dict = to_db_dict(res1, "org-1", "emp-1", "2026-03")

print(f"Sueldo Base: ${res1.sueldo_base:,}")
print(f"Base Imponible AFP: ${res1.base_imponible_afp:,}")
print(f"Base Imponible Salud: ${res1.base_imponible_salud:,}")
print(f"AFP Legal (10%): ${res1.afp:,}")
print(f"Salud Legal (7% topado): ${res1.salud:,} (Campo LRE 3143)")
print(f"Salud Voluntaria (Exceso Isapre): ${res1.salud_voluntaria:,} (Campo LRE 3144)")
print(f"Base TRIBUTABLE (Impuesto Único): ${res1.base_imponible_impuesto:,}")
print(f"Impuesto a pagar: ${res1.impuesto_unico:,} (Campo LRE 3161)")

# Escenario 2: Sueldo Mínimo con Horas Extras (Factor 0.007777 / 0.007954)
print("\n[TEST 2] Trabajador Renta Mínima + Horas Extras")
emp2 = EmployeeInput(
    sueldo_base=529_000,
    tipo_contrato="indefinido",
    afp_code="MODELO",
    afp_comision_pct=0.58,
    salud_code="FONASA",
    plan_salud_uf=0,
    gratificacion_legal=True,
    horas_semanales=44,
    horas_extra=10,  # 10 horas extras
    dias_trabajados=30
)

res2 = calcular_liquidacion(emp2, settings, utm_valor)

print(f"Sueldo Base: ${res2.sueldo_base:,}")
print(f"Horas semanales de contrato: 44")
print(f"Monto Horas Extras (10 hrs): ${res2.horas_extra_monto:,} (Debería ser exacto matemáticamente)")
print(f"Gratificación: ${res2.gratificacion:,}")
print(f"Salud Fonasa 7%: ${res2.salud:,}")
print(f"Voluntaria (debe ser 0): ${res2.salud_voluntaria:,}")
