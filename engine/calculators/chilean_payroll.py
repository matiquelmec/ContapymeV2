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

# Fuente única de verdad de parámetros legales nacionales. Los defaults de
# PayrollSettings se derivan de aquí para no divergir del SSoT.
from .national_params import (
    AFP_COTIZACION_OBLIGATORIA_PCT,
    SIS_PCT,
    SALUD_LEGAL_PCT,
    TOPE_AFP_UF,
    TOPE_SALUD_UF,
    TOPE_AFC_UF,
    AFC_INDEFINIDO_TRABAJADOR_PCT,
    AFC_INDEFINIDO_EMPRESA_PCT,
    AFC_FIJO_EMPRESA_PCT,
    RETENCION_HONORARIOS_PCT,
    SUELDO_MINIMO,
)


# ═══════════════════════════════════════════════════════════════════════════════
# 1. ESTRUCTURAS DE DATOS
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class PayrollSettings:
    """Parámetros legales/previsionales configurables por organización.

    Los valores por defecto provienen de national_params (fuente única). En el
    flujo real, el router los sobrescribe con los del período desde la DB.
    """
    # AFP
    afp_tasa_cotizacion_pct: float = AFP_COTIZACION_OBLIGATORIA_PCT  # % obligatorio fondo (DL 3500)
    afp_comision_pct: float = 1.27               # % comisión afiliado (variable por AFP)
    afp_sis_pct: float = SIS_PCT                  # % SIS pagado por empresa (licitación vigente)
    uf_tope_afp: float = TOPE_AFP_UF             # UF tope imponible AFP (Sup. Pensiones)
    # Salud
    salud_pct: float = SALUD_LEGAL_PCT           # % salud obligatorio (FONASA base)
    uf_tope_salud: float = TOPE_SALUD_UF         # UF tope imponible salud (mismo que AFP)
    # AFC (Seguro Cesantía) — Ley 19.728
    afc_indefinido_trabajador_pct: float = AFC_INDEFINIDO_TRABAJADOR_PCT
    afc_indefinido_empresa_pct: float = AFC_INDEFINIDO_EMPRESA_PCT
    afc_fijo_empresa_pct: float = AFC_FIJO_EMPRESA_PCT
    uf_tope_afc: float = TOPE_AFC_UF             # UF tope imponible AFC (Ley 19.728)
    # Honorarios
    retencion_honorarios_pct: float = RETENCION_HONORARIOS_PCT  # % retención boletas (Ley 21.133)
    # Legales
    sueldo_minimo: int = SUELDO_MINIMO           # $CLP — Ingreso Mínimo Mensual (national_params)
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
    asignacion_viatico: int = 0                  # Viático (no imponible, Art. 41 CT)
    horas_extra: int = 0                         # Horas extra al 50% (Art. 32 CT)
    horas_extra_100: int = 0                      # Horas extra al 100% (domingos/festivos)
    bono_extra: int = 0                          # Bonos no habituales
    bono_fijo: int = 0                           # Bonos fijos (recurrentes) de la ficha de empleado
    # Haberes configurables por la empresa (conceptos definidos por el usuario)
    otros_haberes_imponibles: int = 0            # Imponibles y tributables
    otros_haberes_no_imponibles: int = 0         # No imponibles (Art. 41 CT)
    # Semana corrida (Art. 45 CT) — sobre remuneración variable
    tiene_semana_corrida: bool = False           # Derecho a semana corrida
    monto_variable: int = 0                      # Remuneración variable del mes (comisiones, etc.)
    festivos_en_periodo: int = 0                 # Festivos legales del período (además de domingos)
    # Control
    dias_trabajados: int = 30                    # Para cálculo proporcional
    horas_semanales: int = 42                    # Jornada semanal (Chile 2026: 42h)
    jornada_parcial: bool = False                # Jornada parcial (Art. 40 bis): prorratea piso mínimo
    family_allowances: int = 0                   # Número de cargas familiares
    afc_active: bool = True                      # Si aplica seguro de cesantía
    # Otros descuentos (no legales)
    credito_ccaf: int = 0                        # Crédito social CCAF
    anticipo: int = 0                            # Anticipo de sueldo
    prestamo: int = 0                            # Préstamo / cuota
    retencion_judicial: int = 0                  # Retención judicial / pensión de alimentos
    otros_descuentos_varios: int = 0             # Descuentos configurables por la empresa
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
    asignacion_viatico: int = 0
    horas_extra_monto: int = 0                    # Total horas extra (50% + 100%)
    horas_extra_100_monto: int = 0               # Solo el tramo al 100%
    bono_extra: int = 0
    bono_fijo: int = 0
    semana_corrida: int = 0
    otros_haberes_imponibles: int = 0
    otros_haberes_no_imponibles: int = 0
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
    retencion_honorarios: int = 0                # Retención boletas de honorarios
    total_descuentos_legales: int = 0
    # ── Otros descuentos (no legales) ──────────────────────────────────────────
    credito_ccaf: int = 0                        # Crédito social CCAF
    anticipo: int = 0                            # Anticipo de sueldo
    prestamo: int = 0                            # Préstamo / cuota
    retencion_judicial: int = 0                  # Retención judicial / alimentos
    otros_descuentos_varios: int = 0             # Descuentos configurables por la empresa
    otros_descuentos: int = 0                    # Total descuentos no legales
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
# 2. TABLA DE IMPUESTO ÚNICO (SII)
#    Fuente única: national_params.TRAMOS_IMPUESTO_UNICO (no duplicar aquí).
# ═══════════════════════════════════════════════════════════════════════════════

from .national_params import TRAMOS_IMPUESTO_UNICO as TRAMOS_IMPUESTO


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


JORNADA_COMPLETA_HORAS = 44  # Jornada ordinaria máxima legal (Art. 22 CT), divisor del piso parcial


def calcular_semana_corrida(monto_variable: int, dias_trabajados: int, dias_no_laborales: int) -> int:
    """
    Calcula el pago de semana corrida (Art. 45 CT) sobre la remuneración variable.

    El trabajador con remuneración variable (comisiones, trato, etc.) tiene derecho
    a que los días domingo y festivos se paguen según el promedio diario de lo
    devengado en el período.

    Fórmula: (remuneración_variable / días_trabajados) × (domingos + festivos del período)

    Args:
        monto_variable: Remuneración variable devengada en el período (CLP).
        dias_trabajados: Días efectivamente trabajados en el período.
        dias_no_laborales: Domingos + festivos legales del período.

    Returns:
        Monto de semana corrida en pesos CLP (imponible).
    """
    if monto_variable <= 0 or dias_trabajados <= 0 or dias_no_laborales <= 0:
        return 0
    promedio_diario = monto_variable / float(dias_trabajados)
    return int(round(promedio_diario * dias_no_laborales))


def _domingos_en_periodo(mes_proceso: Optional[str]) -> int:
    """Cuenta los domingos del mes de proceso ("YYYY-MM"). Pura (sin I/O)."""
    if not mes_proceso:
        return 0
    try:
        anio = int(mes_proceso[:4])
        mes = int(mes_proceso[5:7])
        ndays = calendar.monthrange(anio, mes)[1]
        return sum(1 for d in range(1, ndays + 1) if date(anio, mes, d).weekday() == 6)
    except (ValueError, IndexError):
        return 0


def calcular_hora_extra(sueldo_base: int, horas: int, horas_semanales: int = 42, recargo: float = 1.5) -> int:
    """
    Calcula el valor de horas extras (Art. 32 CT).
    Fórmula oficial Dirección del Trabajo: (Sueldo / 30) * 7 / Horas_Semanales * recargo

    Args:
        recargo: Factor de recargo. 1.5 = 50% (ordinario), 2.0 = 100% (domingos/festivos).
    """
    if horas <= 0 or horas_semanales <= 0:
        return 0

    # Sueldo semanal = sueldo / 30 * 7
    sueldo_semanal = (sueldo_base / 30.0) * 7.0
    # Valor hora ordinaria
    valor_hora_ordinaria = sueldo_semanal / float(horas_semanales)

    valor_hora_extra = valor_hora_ordinaria * recargo
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


def _otros_descuentos(emp: EmployeeInput) -> tuple[int, int, int, int, int, int]:
    """Calcula los descuentos no legales y su total. Compartido entre regímenes."""
    credito_ccaf = max(0, emp.credito_ccaf)
    anticipo = max(0, emp.anticipo)
    prestamo = max(0, emp.prestamo)
    retencion_judicial = max(0, emp.retencion_judicial)
    varios = max(0, emp.otros_descuentos_varios)
    total = credito_ccaf + anticipo + prestamo + retencion_judicial + varios
    return credito_ccaf, anticipo, prestamo, retencion_judicial, varios, total


def _calcular_honorarios(
    emp: EmployeeInput, settings: PayrollSettings, res: LiquidacionResult
) -> LiquidacionResult:
    """
    Liquidación para trabajador a honorarios.

    No cotiza AFP/salud/AFC ni recibe gratificación. Se le aplica la retención
    de boletas de honorarios (Ley 21.133) sobre el honorario bruto y se
    descuentan los otros conceptos no legales (anticipos, préstamos, etc.).
    """
    haberes_imp = max(0, emp.otros_haberes_imponibles)
    haberes_no_imp = max(0, emp.otros_haberes_no_imponibles)

    # Proporcional según los días efectivamente trabajados en el periodo (base mensual de 30 días)
    factor_dias = (emp.dias_trabajados / 30.0) if emp.dias_trabajados > 0 else 1.0
    sueldo_base = int(round(max(0, emp.sueldo_base) * factor_dias))

    bruto = (
        sueldo_base + max(0, emp.bono_extra) + max(0, emp.bono_fijo)
        + haberes_imp + haberes_no_imp
    )
    # La retención aplica sobre el honorario (no sobre haberes no imponibles).
    base_retencion = bruto - haberes_no_imp
    retencion = int(round(base_retencion * settings.retencion_honorarios_pct / 100.0))

    credito_ccaf, anticipo, prestamo, retencion_judicial, varios, otros = _otros_descuentos(emp)

    res.sueldo_base = sueldo_base
    res.bono_extra = max(0, emp.bono_extra)
    res.bono_fijo = max(0, emp.bono_fijo)
    res.otros_haberes_imponibles = haberes_imp
    res.otros_haberes_no_imponibles = haberes_no_imp
    res.total_haberes_brutos = bruto
    res.retencion_honorarios = retencion
    res.total_descuentos_legales = retencion
    res.credito_ccaf = credito_ccaf
    res.anticipo = anticipo
    res.prestamo = prestamo
    res.retencion_judicial = retencion_judicial
    res.otros_descuentos_varios = varios
    res.otros_descuentos = otros
    res.sueldo_liquido = max(0, bruto - retencion - otros)
    return res


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

    # ── HONORARIOS: sin cotizaciones; solo retención de boletas (Ley 21.133) ────
    if emp.tipo_contrato == "honorarios":
        return _calcular_honorarios(emp, settings, res)

    # ── 1. CÁLCULO DE HABERES ──────────────────────────────────────────────────
    
    # Proporcional si no se trabajó el mes completo
    factor_dias = emp.dias_trabajados / 30.0
    
    sueldo_base = int(round(emp.sueldo_base * factor_dias))

    # Validación: no puede ser inferior al sueldo mínimo (si trabajó mes completo).
    # En jornada parcial (Art. 40 bis) el piso se prorratea por la jornada pactada.
    piso_minimo = settings.sueldo_minimo
    if emp.jornada_parcial and emp.horas_semanales < JORNADA_COMPLETA_HORAS:
        piso_minimo = int(settings.sueldo_minimo * emp.horas_semanales / JORNADA_COMPLETA_HORAS)
    if emp.dias_trabajados == 30 and sueldo_base < piso_minimo:
        res.advertencias.append(
            f"⚠️ Sueldo base ${sueldo_base:,} inferior al mínimo legal ${piso_minimo:,}"
        )

    # 1. Calcular otros haberes imponibles (horas extras, bonos, semana corrida) que van en la base de gratificación
    horas_extra_50_monto = calcular_hora_extra(emp.sueldo_base, emp.horas_extra, emp.horas_semanales, recargo=1.5)
    horas_extra_100_monto = calcular_hora_extra(emp.sueldo_base, emp.horas_extra_100, emp.horas_semanales, recargo=2.0)
    horas_extra_monto = horas_extra_50_monto + horas_extra_100_monto

    # Bono fijo recurrente (proporcional a los días trabajados)
    bono_fijo_monto = int(round(emp.bono_fijo * factor_dias))

    # Semana corrida (Art. 45 CT): pago de domingos/festivos sobre lo variable. Imponible.
    semana_corrida = 0
    if emp.tiene_semana_corrida:
        dias_no_laborales = _domingos_en_periodo(emp.mes_proceso) + max(0, emp.festivos_en_periodo)
        semana_corrida = calcular_semana_corrida(emp.monto_variable, emp.dias_trabajados, dias_no_laborales)

    # Haberes imponibles configurables por la empresa
    otros_haberes_imp = max(0, emp.otros_haberes_imponibles)

    # 2. Calcular la base de Gratificación Legal (Suma de imponibles antes de gratificación)
    base_para_grat = (
        sueldo_base + horas_extra_monto + emp.bono_extra + bono_fijo_monto + semana_corrida + otros_haberes_imp
    )

    gratificacion = 0
    if emp.gratificacion_legal:
        gratif_calculada = int(base_para_grat * 0.25)
        # Proratear el tope mensual por los días trabajados
        tope_mensual_prop = int(((4.75 * settings.sueldo_minimo) / 12) * factor_dias)
        gratificacion = min(gratif_calculada, tope_mensual_prop)

    # Colación, movilización y viáticos: NO son imponibles (Art. 41 CT), se suman al final
    colacion = emp.asignacion_colacion
    movilizacion = emp.asignacion_movilizacion
    viatico = emp.asignacion_viatico
    
    otros_haberes_no_imp = max(0, emp.otros_haberes_no_imponibles)

    # Base bruta imponible (sin ingresos NO imponibles)
    base_bruta_imponible = base_para_grat + gratificacion

    # Asignación familiar (No imponible)
    # Se calcula sobre la renta del mes ANTERIOR legalmente, pero aquí usamos la actual
    # como aproximación si no hay histórico.
    asig_familiar = calcular_asignacion_familiar(base_bruta_imponible, emp.family_allowances)

    res.sueldo_base = sueldo_base
    res.gratificacion = gratificacion
    res.horas_extra_monto = horas_extra_monto
    res.horas_extra_100_monto = horas_extra_100_monto
    res.asignacion_colacion = colacion
    res.asignacion_movilizacion = movilizacion
    res.asignacion_viatico = viatico
    res.asignacion_familiar = asig_familiar
    res.bono_extra = emp.bono_extra
    res.bono_fijo = bono_fijo_monto
    res.semana_corrida = semana_corrida
    res.otros_haberes_imponibles = otros_haberes_imp
    res.otros_haberes_no_imponibles = otros_haberes_no_imp
    res.total_haberes_brutos = (
        base_bruta_imponible + colacion + movilizacion + viatico
        + asig_familiar + otros_haberes_no_imp
    )

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

    # ── 4.b OTROS DESCUENTOS (no legales) ──────────────────────────────────────
    # Crédito CCAF, anticipos, préstamos y retenciones judiciales. Los retiene el
    # empleador del líquido; no afectan bases imponibles ni descuentos legales.
    credito_ccaf, anticipo, prestamo, retencion_judicial, varios, otros_descuentos = _otros_descuentos(emp)
    res.credito_ccaf = credito_ccaf
    res.anticipo = anticipo
    res.prestamo = prestamo
    res.retencion_judicial = retencion_judicial
    res.otros_descuentos_varios = varios
    res.otros_descuentos = otros_descuentos

    # ── 5. SUELDO LÍQUIDO ─────────────────────────────────────────────────────
    liquido = res.total_haberes_brutos - res.total_descuentos_legales - res.otros_descuentos

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


def calcular_sueldo_base_desde_liquido(
    target_liquido: int,
    gratificacion_legal: bool,
    afp_code: str,
    afp_comision_pct: float,
    salud_code: str,
    plan_salud_uf: float,
    tipo_contrato: str,
    asignacion_movilizacion: int,
    asignacion_colacion: int,
    settings: PayrollSettings,
    utm_valor: float,
    es_zona_extrema: bool = False,
    zona_extrema: str = ""
) -> LiquidacionResult:
    """
    Calcula el sueldo base y la liquidación detallada correspondiente
    para alcanzar un sueldo líquido objetivo (target_liquido) mediante bisección.
    """
    # Rango inicial para la búsqueda por bisección del sueldo base.
    # El sueldo base no puede ser negativo, y raramente excederá el sueldo líquido * 3.
    low = 0.0
    high = max(100000000.0, float(target_liquido) * 3.0)
    best_res = None

    # Con 40 iteraciones la precisión numérica llega a menos de 1 peso (2^-40 de 100M es ~0.0001)
    for _ in range(40):
        mid = (low + high) / 2.0
        emp_input = EmployeeInput(
            sueldo_base=int(mid),
            tipo_contrato=tipo_contrato,
            afp_code=afp_code,
            afp_comision_pct=afp_comision_pct,
            salud_code=salud_code,
            plan_salud_uf=plan_salud_uf,
            gratificacion_legal=gratificacion_legal,
            asignacion_movilizacion=asignacion_movilizacion,
            asignacion_colacion=asignacion_colacion,
            dias_trabajados=30,
            es_zona_extrema=es_zona_extrema,
            zona_extrema=zona_extrema
        )
        res = calcular_liquidacion(emp_input, settings, utm_valor)
        best_res = res

        if res.sueldo_liquido < target_liquido:
            low = mid
        else:
            high = mid

    # Asegurar que el sueldo base en el resultado sea el entero final redondeado
    if best_res:
        # Volvemos a calcular una última vez con el sueldo_base redondeado a entero
        final_base = int(round(low))
        emp_input = EmployeeInput(
            sueldo_base=final_base,
            tipo_contrato=tipo_contrato,
            afp_code=afp_code,
            afp_comision_pct=afp_comision_pct,
            salud_code=salud_code,
            plan_salud_uf=plan_salud_uf,
            gratificacion_legal=gratificacion_legal,
            asignacion_movilizacion=asignacion_movilizacion,
            asignacion_colacion=asignacion_colacion,
            dias_trabajados=30,
            es_zona_extrema=es_zona_extrema,
            zona_extrema=zona_extrema
        )
        best_res = calcular_liquidacion(emp_input, settings, utm_valor)

    return best_res


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
        "credito_ccaf": res.credito_ccaf,
        "otros_descuentos": res.otros_descuentos,
        "total_descuentos": res.total_descuentos_legales + res.otros_descuentos,
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
            "rebaja_zona_extrema": res.rebaja_zona_extrema,
            "semana_corrida": res.semana_corrida,
            "horas_extra_100_monto": res.horas_extra_100_monto,
            "asignacion_viatico": res.asignacion_viatico,
            "otros_haberes_imponibles": res.otros_haberes_imponibles,
            "otros_haberes_no_imponibles": res.otros_haberes_no_imponibles,
            "anticipo": res.anticipo,
            "prestamo": res.prestamo,
            "retencion_judicial": res.retencion_judicial,
            "otros_descuentos_varios": res.otros_descuentos_varios,
            "retencion_honorarios": res.retencion_honorarios
        },
        "folio_number": f"LIQ-{periodo.replace('-', '')}-{str(emp_id)[:8].upper()}"
    }
