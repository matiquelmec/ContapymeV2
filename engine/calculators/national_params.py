"""
national_params.py — Parámetros Legales Nacionales de Chile
============================================================
Este módulo centraliza TODOS los valores que son definidos por ley,
decreto o licitación y que NO cambian por empresa.

REGLA DE ORO: Si el valor lo define el Estado, va aquí.
              Si el valor lo define la empresa, va en organization_payroll_settings.

ACTUALIZACIÓN: Estos valores se actualizan 1-2 veces al año.
               Al cambiar, se modifica SOLO este archivo y todo el sistema
               se recalibra automáticamente.

FUENTES OFICIALES:
  - Superintendencia de Pensiones (www.spensiones.cl)
  - Previred (www.previred.com)
  - Servicio de Impuestos Internos (www.sii.cl)
  - Ministerio del Trabajo
"""

# ═══════════════════════════════════════════════════════════════════════════════
# 1. TOPES IMPONIBLES (Actualizados anualmente por la Sup. de Pensiones)
#    Fuente: Circular SP, vigente desde febrero 2026
# ═══════════════════════════════════════════════════════════════════════════════
TOPE_AFP_UF = 90.0          # UF — Tope imponible para AFP y Salud
TOPE_SALUD_UF = 90.0        # UF — Mismo tope (DL 3500, Art. 16)
TOPE_AFC_UF = 135.2         # UF — Tope Seguro de Cesantía (Ley 19.728, Art. 5)
TOPE_APV_UF = 600.0         # UF — Tope anual APV con beneficio tributario

# ═══════════════════════════════════════════════════════════════════════════════
# 2. TASAS PREVISIONALES (Vigentes desde abril 2026)
# ═══════════════════════════════════════════════════════════════════════════════
AFP_COTIZACION_OBLIGATORIA_PCT = 10.0   # % fondo obligatorio (DL 3500)
SIS_PCT = 1.62                          # % Seguro Invalidez y Sobrevivencia (vigente 2026)
SALUD_LEGAL_PCT = 7.0                   # % cotización obligatoria de salud
# Retención de boletas de honorarios (Ley 21.133, alza gradual):
# 2024=13.75 · 2025=14.5 · 2026=15.25 · 2027=16 · 2028=17
RETENCION_HONORARIOS_PCT = 15.25       # % retención boletas de honorarios (2026)

# Comisiones AFP (variables por administradora, vigentes 2025)
AFP_COMISIONES = {
    "CAPITAL":   1.44,
    "CUPRUM":    1.44,
    "HABITAT":   1.27,
    "PLANVITAL": 1.16,
    "PROVIDA":   1.45,
    "MODELO":    0.58,
    "UNO":       0.49,
}

# ═══════════════════════════════════════════════════════════════════════════════
# 3. SUELDO MÍNIMO Y ASIGNACIONES FAMILIARES
#    Fuente: Ley vigente + Decreto Hacienda
# ═══════════════════════════════════════════════════════════════════════════════
SUELDO_MINIMO = 539_000     # $CLP — Ingreso Mínimo Mensual vigente desde enero 2026

# Asignación Familiar por carga (montos mensuales en $CLP, vigentes 2025)
ASIGNACION_FAMILIAR = {
    "tramo_a": {"monto": 21_243, "tope_renta": 539_330},
    "tramo_b": {"monto": 14_516, "tope_renta": 787_747},
    "tramo_c": {"monto": 4_590,  "tope_renta": 1_228_614},
    "tramo_d": {"monto": 0,      "tope_renta": float("inf")},  # Sin derecho
}

# ═══════════════════════════════════════════════════════════════════════════════
# 4. AFC — SEGURO DE CESANTÍA (Ley 19.728)
# ═══════════════════════════════════════════════════════════════════════════════
AFC_INDEFINIDO_TRABAJADOR_PCT = 0.6     # % aporte trabajador (indefinido)
AFC_INDEFINIDO_EMPRESA_PCT = 2.4        # % aporte empresa (indefinido)
AFC_FIJO_EMPRESA_PCT = 3.0             # % aporte empresa (plazo fijo)
# Nota: En contrato a plazo fijo, el trabajador NO cotiza (0%).

# ═══════════════════════════════════════════════════════════════════════════════
# 5. IMPUESTO ÚNICO DE SEGUNDA CATEGORÍA (SII — Tabla mensual vigente)
#    Tramos en UTM. Se calculan dinámicamente con el valor UTM del mes.
# ═══════════════════════════════════════════════════════════════════════════════
TRAMOS_IMPUESTO_UNICO = [
    # (factor_utm_inf, factor_utm_sup, tasa_marginal, factor_rebaja_utm)
    (0,     13.5,  0.00,  0.000),
    (13.5,  30.0,  0.04,  0.540),
    (30.0,  50.0,  0.08,  1.740),
    (50.0,  70.0,  0.135, 4.490),
    (70.0,  90.0,  0.23,  11.140),
    (90.0,  120.0, 0.304, 17.800),
    (120.0, 310.0, 0.35,  23.320),
    (310.0, float("inf"), 0.40, 38.820),
]

# ═══════════════════════════════════════════════════════════════════════════════
# 6. JORNADA LABORAL
# ═══════════════════════════════════════════════════════════════════════════════
JORNADA_SEMANAL_HORAS = 42  # Horas semanales (Chile 2026, Ley 40 horas progresiva)


def get_afp_comision(afp_code: str) -> float:
    """Retorna la comisión de la AFP según su código. Default: Hábitat."""
    return AFP_COMISIONES.get(afp_code.upper(), 1.27)


def get_asignacion_familiar(renta_imponible: int, num_cargas: int) -> int:
    """Calcula la asignación familiar según tramo de renta."""
    if num_cargas <= 0:
        return 0
    for tramo in ["tramo_a", "tramo_b", "tramo_c"]:
        if renta_imponible <= ASIGNACION_FAMILIAR[tramo]["tope_renta"]:
            return ASIGNACION_FAMILIAR[tramo]["monto"] * num_cargas
    return 0


def get_tramo_asignacion(renta_imponible: int) -> str:
    """
    Letra del tramo de asignación familiar (A/B/C/D) según la renta imponible.
    Usa los MISMOS topes que el monto, para que lo informado en Previred/LRE
    coincida con lo pagado.
    """
    if renta_imponible <= ASIGNACION_FAMILIAR["tramo_a"]["tope_renta"]:
        return "A"
    if renta_imponible <= ASIGNACION_FAMILIAR["tramo_b"]["tope_renta"]:
        return "B"
    if renta_imponible <= ASIGNACION_FAMILIAR["tramo_c"]["tope_renta"]:
        return "C"
    return "D"
