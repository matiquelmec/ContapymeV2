"""
chilean_payroll.py — Motor de Cálculo de Remuneraciones Chile
=============================================================
Motor puro de cálculo normativo chileno para Contapyme V2.
Cumple con el Código del Trabajo y las circulares de la Superintendencia
de Pensiones vigentes para 2025.

PRINCIPIOS DE DISEÑO:
  - Funciones puras: misma entrada → misma salida (sin side effects).
  - Sin dependencias de red, base de datos ni FastAPI.
  - 100% testeable con pytest sin necesidad de mocks.
  - Cada constante es nombrada y documentada.

NORMATIVA APLICADA:
  - DL 3500: Previsión AFP (10% cotización obligatoria + comisión)
  - Ley 18.469: Cotización de Salud (7% Fonasa, variable Isapre)
  - DL 3501: AFC Seguro de Cesantía (art. 5 y 6)
  - DL 824: Impuesto Único de Segunda Categoría (tabla mensual SII)
  - Ley 20.255: Reforma Previsional (SIS - Seguro de Invalidez y Sobrevivencia)
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
from datetime import date
import calendar


# ═══════════════════════════════════════════════════════════════════════════════
# 1. ESTRUCTURAS DE DATOS
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class PayrollSettings:
    """Parámetros legales/previsionales configurables por organización."""
    # AFP
    afp_tasa_cotizacion_pct: float = 10.0        # % obligatorio fondo (DL 3500)
    afp_comision_pct: float = 1.27               # % comisión afiliado (variable por AFP)
    afp_sis_pct: float = 1.49                    # % SIS pagado por empresa (licitación vigente)
    uf_tope_afp: float = 84.3                    # UF tope imponible AFP (Sup. Pensiones 2025)
    # Salud
    salud_pct: float = 7.0                       # % salud obligatorio (FONASA base)
    uf_tope_salud: float = 84.3                  # UF tope imponible salud (mismo que AFP)
    # AFC (Seguro Cesantía) — Ley 19.728
    afc_indefinido_trabajador_pct: float = 0.6   # % trabajador contrato indefinido
    afc_indefinido_empresa_pct: float = 2.4      # % empresa contrato indefinido
    afc_fijo_empresa_pct: float = 3.0            # % empresa contrato a plazo fijo
    uf_tope_afc: float = 126.6                   # UF tope imponible AFC (Ley 19.728)
    # Legales
    sueldo_minimo: int = 529_000                 # $CLP vigente 2025
    uf_valor: float = 38_000.0                   # Valor UF del día (se actualiza desde DB)


@dataclass
class EmployeeInput:
    """Entrada de datos del empleado para el cálculo de liquidación."""
    sueldo_base: int
    tipo_contrato: str = "indefinido"            # "indefinido" | "fijo" | "honorarios"
    afp_code: str = "HABITAT"
    afp_comision_pct: float = 1.27
    salud_code: str = "FONASA"
    salud_pct: float = 7.0                       # Piso legal obligatorio
    plan_salud_uf: float = 0.0                   # Plan Isapre en UF (0 = FONASA, solo 7%)
    # Haberes adicionales
    gratificacion_legal: bool = True             # Si aplica gratificación art. 50 CT
    asignacion_movilizacion: int = 0
    asignacion_colacion: int = 0
    horas_extra: int = 0                         # Horas extra trabajadas
    bono_extra: int = 0                          # Bonos no habituales
    bono_fijo: int = 0                           # Bonos fijos (recurrentes) de la ficha de empleado
    # Control
    dias_trabajados: int = 30                    # Para cálculo proporcional
    horas_semanales: int = 42                    # Jornada semanal (Chile 2026: 42h)
    family_allowances: int = 0                   # Número de cargas familiares
    afc_active: bool = True                      # Si aplica seguro de cesantía
    mes_proceso: Optional[str] = None            # "YYYY-MM"
    es_zona_extrema: bool = False                # Para rebajas DL 889
    zona_extrema: str = ""                       # "MAGALLANES", "AYSEN", "ARICA", etc.


@dataclass
class LiquidacionResult:
    """Resultado detallado de una liquidación de sueldo."""
    # ── Haberes ────────────────────────────────────────────────────────────────
    sueldo_base: int = 0
    gratificacion: int = 0
    asignacion_movilizacion: int = 0
    asignacion_colacion: int = 0
    horas_extra_monto: int = 0
    bono_extra: int = 0
    bono_fijo: int = 0
    total_haberes_brutos: int = 0
    # ── Base imponible ─────────────────────────────────────────────────────────
    base_imponible_afp: int = 0
    base_imponible_salud: int = 0
    base_imponible_impuesto: int = 0
    # ── Descuentos legales ─────────────────────────────────────────────────────
    afp: int = 0                                 # Cotización obligatoria AFP
    afp_comision: int = 0                        # Comisión AFP
    salud: int = 0                               # Cotización salud obligatoria (7%)
    salud_voluntaria: int = 0                    # Cotización adicional Isapre (plan - 7%)
    salud_total: int = 0                         # Total descuento salud real
    afc_trabajador: int = 0                      # Seguro Cesantía (trabajador)
    impuesto_unico: int = 0                      # IRPF Segunda Categoría
    total_descuentos_legales: int = 0
    # ── Cargos empresa ─────────────────────────────────────────────────────────
    afc_empresa: int = 0
    sis_empresa: int = 0
    total_cargos_empresa: int = 0
    # ── Resultado ──────────────────────────────────────────────────────────────
    sueldo_liquido: int = 0
    asignacion_familiar: int = 0
    dias_trabajados: int = 30
    # ── Metadata ──────────────────────────────────────────────────────────────
    afp_code: str = ""
    salud_code: str = ""
    tipo_contrato: str = "indefinido"
    uf_valor_usado: float = 0.0
    advertencias: list = field(default_factory=list)
    # ── Desglose Zona Extrema (DL 889) ────────────────────────────────────────
    asignacion_zona_extrema: int = 0             # Deducción de base tributable
    impuesto_unico_sin_rebaja: int = 0           # Impuesto determinado bruto
    rebaja_zona_extrema: int = 0                 # Descuento del impuesto (ej: 98%)


# ═══════════════════════════════════════════════════════════════════════════════
# 2. TABLA DE IMPUESTO ÚNICO (SII — Circular 12 de 2024, vigente 2025)
#    Tramos mensuales en UTM. Tasa marginal + rebaja en UTM.
# ═══════════════════════════════════════════════════════════════════════════════

# Tabla IRPF mensual 2025 (expresada en pesos CLP usando UTM = 67.294 ene-2025)
# Estructura: (límite_inferior, límite_superior, tasa_marginal, rebaja_en_pesos)
# Los límites se expresan como múltiplos de UTM. Se calculan dinámicamente.
TRAMOS_IMPUESTO = [
    # (factor_utm_inf, factor_utm_sup, tasa, factor_rebaja_utm)
    (0,     13.5,  0.00,  0.000),
    (13.5,  30.0,  0.04,  0.540),
    (30.0,  50.0,  0.08,  1.740),
    (50.0,  70.0,  0.135, 4.490),
    (70.0,  90.0,  0.23,  11.140),
    (90.0,  120.0, 0.304, 17.800),
    (120.0, 310.0, 0.35,  23.320),
    (310.0, float("inf"), 0.40, 38.820),
]


def calcular_impuesto_unico(renta_imponible: int, utm_valor: float) -> int:
    """
    Calcula el Impuesto Único de Segunda Categoría (IRPF mensual).
    
    Aplica la escala progresiva del SII usando el valor de la UTM del mes.
    
    Args:
        renta_imponible: Base imponible tributaria en pesos CLP.
        utm_valor: Valor de la UTM del mes de proceso en pesos CLP.
    
    Returns:
        Monto del impuesto en pesos CLP (entero, redondeado hacia abajo).
    """
    if utm_valor <= 0 or renta_imponible <= 0:
        return 0

    renta_utm = renta_imponible / utm_valor

    for inf, sup, tasa, rebaja_utm in TRAMOS_IMPUESTO:
        if inf <= renta_utm < sup:
            impuesto = (renta_imponible * tasa) - (rebaja_utm * utm_valor)
            return max(0, int(impuesto))

    return 0


# ═══════════════════════════════════════════════════════════════════════════════
# 3. CALCULADORA DE HABERES
# ═══════════════════════════════════════════════════════════════════════════════

def calcular_gratificacion_legal(sueldo_base: int, sueldo_minimo: int) -> int:
    """
    Calcula la gratificación mensual dinámica según Art. 50 del Código del Trabajo.
    Tope mensual = (4.75 * Ingreso Mínimo Mensual) / 12.
    """
    tope_mensual = int((4.75 * sueldo_minimo) / 12)
    gratif = int(sueldo_base * 0.25)
    return min(gratif, tope_mensual)


def calcular_hora_extra(sueldo_base: int, horas: int, horas_semanales: int = 44) -> int:
    """
    Calcula el valor de horas extras (Art. 32 CT).
    Fórmula oficial Dirección del Trabajo: (Sueldo / 30) * 7 / Horas_Semanales * 1.5
    """
    if horas <= 0 or horas_semanales <= 0:
        return 0
    
    # Sueldo semanal = sueldo / 30 * 7
    sueldo_semanal = (sueldo_base / 30.0) * 7.0
    # Valor hora ordinaria
    valor_hora_ordinaria = sueldo_semanal / float(horas_semanales)
    
    # Recargo legal del 50%
    valor_hora_extra = valor_hora_ordinaria * 1.50
    return int(round(valor_hora_extra * horas))


def calcular_asignacion_familiar(base_imponible: int, num_cargas: int) -> int:
    """
    Calcula el monto de Asignación Familiar según tramo de renta (Cargas Familiares).
    Usa los parámetros centralizados en national_params.py para garantizar SSoT.
    """
    if num_cargas <= 0:
        return 0
        
    from .national_params import ASIGNACION_FAMILIAR
    
    for tramo in ["tramo_a", "tramo_b", "tramo_c"]:
        if base_imponible <= ASIGNACION_FAMILIAR[tramo]["tope_renta"]:
            return ASIGNACION_FAMILIAR[tramo]["monto"] * num_cargas
            
    return 0


# ═══════════════════════════════════════════════════════════════════════════════
# 4. CALCULADORA DE TOPES IMPONIBLES
# ═══════════════════════════════════════════════════════════════════════════════

def calcular_tope_afp(base_bruta: int, uf_tope: float, uf_valor: float) -> int:
    """Aplica el tope imponible de AFP según DL 3500."""
    tope_pesos = int(uf_tope * uf_valor)
    return min(base_bruta, tope_pesos)


def calcular_tope_salud(base_bruta: int, uf_tope: float, uf_valor: float) -> int:
    """Aplica el tope imponible de salud."""
    tope_pesos = int(uf_tope * uf_valor)
    return min(base_bruta, tope_pesos)


# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTES Y BENEFICIOS DE ZONA EXTREMA (DL 889 / Ley 19.853)
# ═══════════════════════════════════════════════════════════════════════════════

ZONAS_EXTREMAS = {
    # rebaja_impuesto: fracción a descontar del impuesto bruto determinado
    # porcentaje_asig_zona: % del sueldo escala Grado 1A a deducir de base tributable
    "ARICA":      {"rebaja_impuesto": 0.50, "porcentaje_asig_zona": 0.0},
    "TARAPACA":   {"rebaja_impuesto": 0.50, "porcentaje_asig_zona": 0.0},
    "AYSEN":      {"rebaja_impuesto": 0.98, "porcentaje_asig_zona": 0.0},
    "MAGALLANES": {"rebaja_impuesto": 0.98, "porcentaje_asig_zona": 0.875},
    "CHILOE":     {"rebaja_impuesto": 0.98, "porcentaje_asig_zona": 0.0},
    "PALENA":     {"rebaja_impuesto": 0.98, "porcentaje_asig_zona": 0.0},
}


def obtener_grado_1a(mes_proceso: Optional[str]) -> int:
    """Retorna el valor base de sueldo escala Grado 1A (EUS) según el año."""
    if not mes_proceso:
        return 535000
    try:
        anio = mes_proceso[:4]
        if anio == "2024":
            return 485584
        elif anio == "2025":
            return 510000
        else:
            return 535000
    except Exception:
        return 535000


# ═══════════════════════════════════════════════════════════════════════════════
# 5. MOTOR PRINCIPAL DE LIQUIDACIÓN
# ═══════════════════════════════════════════════════════════════════════════════

def calcular_liquidacion(
    emp: EmployeeInput,
    settings: PayrollSettings,
    utm_valor: float = 67_294.0,
) -> LiquidacionResult:
    """
    Calcula la liquidación de sueldo completa de un empleado.
    
    Esta es la función central del motor matemático. Aplica:
      1. Haberes: sueldo + gratificación + colación + movilización + HH.EE + bonos
      2. Descuentos legales: AFP, Salud, AFC, Impuesto Único
      3. Cargos empresa: AFC empresa, SIS
      4. Cálculo proporcional si días < 30
    
    Args:
        emp: Datos del empleado.
        settings: Parámetros legales/previsionales de la organización.
        utm_valor: Valor UTM vigente del mes (para tabla de impuesto).
    
    Returns:
        LiquidacionResult con el desglose completo y el sueldo líquido.
    """
    res = LiquidacionResult(
        afp_code=emp.afp_code,
        salud_code=emp.salud_code,
        tipo_contrato=emp.tipo_contrato,
        uf_valor_usado=settings.uf_valor,
        dias_trabajados=emp.dias_trabajados,
    )

    # ── 1. CÁLCULO DE HABERES ──────────────────────────────────────────────────
    
    # Proporcional si no se trabajó el mes completo
    factor_dias = emp.dias_trabajados / 30.0
    
    sueldo_base = int(emp.sueldo_base * factor_dias)
    
    # Validación: no puede ser inferior al sueldo mínimo (si trabajó mes completo)
    if emp.dias_trabajados == 30 and sueldo_base < settings.sueldo_minimo:
        res.advertencias.append(
            f"⚠️ Sueldo base ${sueldo_base:,} inferior al mínimo legal ${settings.sueldo_minimo:,}"
        )

    gratificacion = 0
    if emp.gratificacion_legal:
        gratificacion = int(calcular_gratificacion_legal(emp.sueldo_base, settings.sueldo_minimo) * factor_dias)

    horas_extra_monto = calcular_hora_extra(emp.sueldo_base, emp.horas_extra, emp.horas_semanales)
    
    # Colación y movilización: NO son imponibles (Art. 41 CT), se suman al final
    colacion = emp.asignacion_colacion
    movilizacion = emp.asignacion_movilizacion
    
    # Bono fijo recurrente (proporcional a los días trabajados)
    bono_fijo_monto = int(emp.bono_fijo * factor_dias)

    # Base bruta imponible (sin ingresos NO imponibles)
    base_bruta_imponible = sueldo_base + gratificacion + horas_extra_monto + emp.bono_extra + bono_fijo_monto

    # Asignación familiar (No imponible)
    # Se calcula sobre la renta del mes ANTERIOR legalmente, pero aquí usamos la actual
    # como aproximación si no hay histórico.
    asig_familiar = calcular_asignacion_familiar(base_bruta_imponible, emp.family_allowances)

    res.sueldo_base = sueldo_base
    res.gratificacion = gratificacion
    res.horas_extra_monto = horas_extra_monto
    res.asignacion_colacion = colacion
    res.asignacion_movilizacion = movilizacion
    res.asignacion_familiar = asig_familiar
    res.bono_extra = emp.bono_extra
    res.bono_fijo = bono_fijo_monto
    res.total_haberes_brutos = base_bruta_imponible + colacion + movilizacion + asig_familiar

    # ── 2. BASES IMPONIBLES ────────────────────────────────────────────────────

    base_afp = calcular_tope_afp(base_bruta_imponible, settings.uf_tope_afp, settings.uf_valor)
    base_salud = calcular_tope_salud(base_bruta_imponible, settings.uf_tope_salud, settings.uf_valor)

    res.base_imponible_afp = base_afp
    res.base_imponible_salud = base_salud

    # ── 3. DESCUENTOS LEGALES ─────────────────────────────────────────────────

    # AFP: Cotización obligatoria 10%
    descuento_afp = int(base_afp * (settings.afp_tasa_cotizacion_pct / 100))
    # Comisión AFP (variable por AFP)
    descuento_afp_comision = int(base_afp * (emp.afp_comision_pct / 100))
    
    # Salud: Lógica dual FONASA vs Isapre
    # - FONASA: siempre 7% del imponible topado
    # - ISAPRE: max(7% del imponible, plan_uf × valor_uf), topado al imponible salud
    descuento_salud_legal = int(base_salud * (7.0 / 100))  # Piso obligatorio 7%
    descuento_salud_voluntaria = 0
    
    if emp.plan_salud_uf > 0 and emp.salud_code != "FONASA":
        # Trabajador con Isapre: el descuento real es el plan en UF
        plan_en_pesos = int(emp.plan_salud_uf * settings.uf_valor)
        # TOPE: El descuento total de salud no puede superar la base imponible de salud
        # En la práctica, si el plan excede el imponible, el empleador asume la diferencia
        plan_en_pesos = min(plan_en_pesos, base_salud)
        if plan_en_pesos > descuento_salud_legal:
            descuento_salud_voluntaria = plan_en_pesos - descuento_salud_legal
        descuento_salud = max(descuento_salud_legal, plan_en_pesos)
    else:
        # FONASA o sin plan pactado: solo el 7%
        descuento_salud = descuento_salud_legal

    # AFC: Seguro de Cesantía (trabajador)
    # La base AFC tiene su propio tope legal: 126.6 UF (Ley 19.728)
    tope_afc_pesos = int(settings.uf_tope_afc * settings.uf_valor)
    base_afc = min(base_bruta_imponible, tope_afc_pesos)
    
    descuento_afc_trab = 0
    if emp.afc_active:
        if emp.tipo_contrato == "indefinido":
            descuento_afc_trab = int(base_afc * (settings.afc_indefinido_trabajador_pct / 100))
        # Contrato fijo: solo paga la empresa (0% trabajador)
    
    # Base imponible para impuesto = bruto - AFP - Salud Legal (7%) - AFC
    # NOTA LEGAL (SII): La cotización voluntaria de Isapre (adicional al 7%) NO rebaja la base tributable
    base_impuesto = base_bruta_imponible - descuento_afp - descuento_afp_comision - descuento_salud_legal - descuento_afc_trab
    
    asignacion_zona = 0
    impuesto_bruto = 0
    rebaja_monto = 0

    if emp.es_zona_extrema and emp.zona_extrema:
        zona_upper = emp.zona_extrema.upper()
        if zona_upper in ZONAS_EXTREMAS:
            porcentaje_asig_zona = ZONAS_EXTREMAS[zona_upper]["porcentaje_asig_zona"]
            if porcentaje_asig_zona > 0:
                grado_1a = obtener_grado_1a(emp.mes_proceso)
                asignacion_zona = int(round(grado_1a * porcentaje_asig_zona))
                base_impuesto = max(0, base_impuesto - asignacion_zona)

    base_impuesto = max(0, base_impuesto)
    res.base_imponible_impuesto = base_impuesto

    # Impuesto Único Segunda Categoría
    impuesto_bruto = calcular_impuesto_unico(base_impuesto, utm_valor)
    impuesto = impuesto_bruto

    if emp.es_zona_extrema and emp.zona_extrema:
        zona_upper = emp.zona_extrema.upper()
        if zona_upper in ZONAS_EXTREMAS:
            rebaja_pct = ZONAS_EXTREMAS[zona_upper]["rebaja_impuesto"]
            if rebaja_pct > 0 and impuesto_bruto > 0:
                rebaja_monto = int(round(impuesto_bruto * rebaja_pct))
                impuesto = impuesto_bruto - rebaja_monto

    res.afp = descuento_afp
    res.afp_comision = descuento_afp_comision
    res.salud = descuento_salud_legal
    res.salud_voluntaria = descuento_salud_voluntaria
    res.salud_total = descuento_salud
    res.afc_trabajador = descuento_afc_trab
    res.impuesto_unico = impuesto
    
    # Rellenar desglose de Zona Extrema
    res.asignacion_zona_extrema = asignacion_zona
    res.impuesto_unico_sin_rebaja = impuesto_bruto
    res.rebaja_zona_extrema = rebaja_monto

    res.total_descuentos_legales = (
        descuento_afp + descuento_afp_comision +
        descuento_salud + descuento_afc_trab + impuesto
    )

    # ── 4. CARGOS EMPRESA ─────────────────────────────────────────────────────

    # AFC empresa (misma base topada a 126.6 UF)
    afc_empresa = 0
    if emp.afc_active:
        if emp.tipo_contrato == "indefinido":
            afc_empresa = int(base_afc * (settings.afc_indefinido_empresa_pct / 100))
        else:
            afc_empresa = int(base_afc * (settings.afc_fijo_empresa_pct / 100))

    # SIS — Seguro de Invalidez y Sobrevivencia (pagado 100% por empresa)
    sis_empresa = int(base_afp * (settings.afp_sis_pct / 100))

    res.afc_empresa = afc_empresa
    res.sis_empresa = sis_empresa
    res.total_cargos_empresa = afc_empresa + sis_empresa

    # ── 5. SUELDO LÍQUIDO ─────────────────────────────────────────────────────
    liquido = res.total_haberes_brutos - res.total_descuentos_legales
    
    # PROTECCIÓN: El sueldo líquido no puede ser negativo. Si lo es,
    # se genera una advertencia (puede indicar un plan de Isapre desproporcionado
    # o muy pocos días trabajados). En producción, el empleador debe revisar.
    if liquido < 0:
        res.advertencias.append(
            f"⚠️ Líquido negativo (${liquido:,}). Descuentos exceden haberes. "
            f"Posible causa: plan de salud elevado ({emp.plan_salud_uf} UF) con pocos días ({emp.dias_trabajados})."
        )
        liquido = 0
    
    res.sueldo_liquido = liquido


    return res


def to_db_dict(res: LiquidacionResult, org_id: str, emp_id: str, periodo: str) -> dict:
    """
    Convierte un LiquidacionResult al dict listo para insertar en la tabla
    `liquidations` de Supabase. Centraliza el mapeo de campos siguiendo
    estrictamente el esquema de producción.
    """
    return {
        "organization_id": org_id,
        "employee_id": emp_id,
        "periodo": periodo,
        "sueldo_base": res.sueldo_base,
        "gratificacion": res.gratificacion,
        "asignacion_colacion": res.asignacion_colacion,
        "asignacion_movilizacion": res.asignacion_movilizacion,
        "bono_colacion": res.asignacion_colacion,  # Redundancia por compatibilidad
        "bono_movilizacion": res.asignacion_movilizacion, # Redundancia por compatibilidad
        "asignacion_familiar": res.asignacion_familiar,
        "horas_extra_monto": res.horas_extra_monto,
        "bono_extra": res.bono_extra + res.bono_fijo, # Sumar bono fijo a bono extra para almacenamiento en DB sin alterar el esquema
        "bono_fijo": res.bono_fijo,                  # Mapear bono fijo directamente
        "total_haberes_brutos": res.total_haberes_brutos,
        "base_imponible_afp": res.base_imponible_afp,
        "base_imponible_salud": res.base_imponible_salud,
        "base_imponible_impuesto": res.base_imponible_impuesto,
        "afp": res.afp,
        "afp_comision": res.afp_comision,
        "salud": res.salud,
        "salud_voluntaria": res.salud_voluntaria,
        "salud_total": res.salud_total,
        "afc_trabajador": res.afc_trabajador,
        "impuesto_unico": res.impuesto_unico,
        "total_descuentos": res.total_descuentos_legales,
        "afc_empresa": res.afc_empresa,
        "seguro_invalidez": res.sis_empresa,
        "sis_empresa": res.sis_empresa,       # Redundancia por compatibilidad
        "sueldo_liquido": res.sueldo_liquido,
        "afp_code": res.afp_code,
        "salud_code": res.salud_code,
        "uf_valor_usado": res.uf_valor_usado,
        "dias_trabajados": res.dias_trabajados,
        "status": "borrador",
        "calculation_snapshot": {
            "uf": res.uf_valor_usado,
            "tipo_contrato": res.tipo_contrato,
            "afp_code": res.afp_code,
            "es_zona_extrema": res.asignacion_zona_extrema > 0 or res.rebaja_zona_extrema > 0,
            "asignacion_zona_extrema": res.asignacion_zona_extrema,
            "impuesto_unico_sin_rebaja": res.impuesto_unico_sin_rebaja,
            "rebaja_zona_extrema": res.rebaja_zona_extrema
        },
        "folio_number": f"LIQ-{periodo.replace('-', '')}-{str(emp_id)[:8].upper()}"
    }
