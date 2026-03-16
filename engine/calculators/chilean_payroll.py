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
    afp_sis_pct: float = 1.49                    # % SIS pagado por empresa (reforma 2008)
    uf_tope_afp: float = 87.8                    # UF tope imponible AFP
    # Salud
    salud_pct: float = 7.0                       # % salud obligatorio (FONASA base)
    uf_tope_salud: float = 83.3                  # UF tope imponible salud
    # AFC (Seguro Cesantía) — Ley 19.728
    afc_indefinido_trabajador_pct: float = 0.6   # % trabajador contrato indefinido
    afc_indefinido_empresa_pct: float = 2.4      # % empresa contrato indefinido
    afc_fijo_empresa_pct: float = 3.0            # % empresa contrato a plazo fijo
    # Legales
    sueldo_minimo: int = 529_000                 # $CLP Agosto 2025
    uf_valor: float = 38_000.0                   # Valor UF del día (se actualiza desde DB)


@dataclass
class EmployeeInput:
    """Entrada de datos del empleado para el cálculo de liquidación."""
    sueldo_base: int
    tipo_contrato: str = "indefinido"            # "indefinido" | "fijo" | "honorarios"
    afp_code: str = "HABITAT"
    afp_comision_pct: float = 1.27
    salud_code: str = "FONASA"
    salud_pct: float = 7.0
    # Haberes adicionales
    gratificacion_legal: bool = True             # Si aplica gratificación art. 50 CT
    asignacion_movilizacion: int = 0
    asignacion_colacion: int = 0
    horas_extra: int = 0                         # Horas extra trabajadas
    bono_extra: int = 0                          # Bonos no habituales
    # Control
    dias_trabajados: int = 30                    # Para cálculo proporcional
    mes_proceso: Optional[str] = None            # "YYYY-MM"


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
    total_haberes_brutos: int = 0
    # ── Base imponible ─────────────────────────────────────────────────────────
    base_imponible_afp: int = 0
    base_imponible_salud: int = 0
    base_imponible_impuesto: int = 0
    # ── Descuentos legales ─────────────────────────────────────────────────────
    afp: int = 0                                 # Cotización obligatoria AFP
    afp_comision: int = 0                        # Comisión AFP
    salud: int = 0                               # Cotización salud
    afc_trabajador: int = 0                      # Seguro Cesantía (trabajador)
    impuesto_unico: int = 0                      # IRPF Segunda Categoría
    total_descuentos_legales: int = 0
    # ── Cargos empresa ─────────────────────────────────────────────────────────
    afc_empresa: int = 0
    sis_empresa: int = 0
    total_cargos_empresa: int = 0
    # ── Resultado ──────────────────────────────────────────────────────────────
    sueldo_liquido: int = 0
    dias_trabajados: int = 30
    # ── Metadata ──────────────────────────────────────────────────────────────
    afp_code: str = ""
    salud_code: str = ""
    tipo_contrato: str = "indefinido"
    uf_valor_usado: float = 0.0
    advertencias: list = field(default_factory=list)


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

def calcular_gratificacion_legal(sueldo_base: int) -> int:
    """
    Calcula la gratificación mensual según Art. 50 del Código del Trabajo.
    
    El empleador paga el 25% del sueldo base mensual como gratificación,
    con tope de 4.75 IMM (Ingreso Mínimo Mensual) anuales = ~396.75 UF/año.
    El tope mensual simple = (4.75 * IMM) / 12. Para 2025 con IMM=529.000:
    tope_mensual = (4.75 * 529.000) / 12 ≈ 209.437 CLP/mes.
    
    Returns:
        Gratificación en CLP, topada según ley.
    """
    TOPE_MENSUAL_2025 = 209_437  # (4.75 * 529.000) / 12
    gratif = int(sueldo_base * 0.25)
    return min(gratif, TOPE_MENSUAL_2025)


def calcular_hora_extra(sueldo_base: int, horas: int, dias_mes: int = 30) -> int:
    """
    Calcula el valor de horas extras (Art. 32 CT: 50% recargo sobre hora ordinaria).
    
    Returns:
        Monto total de horas extras en CLP.
    """
    if horas <= 0:
        return 0
    valor_hora_ordinaria = sueldo_base / (dias_mes * 8)  # Jornada 8 horas
    valor_hora_extra = valor_hora_ordinaria * 1.50
    return int(valor_hora_extra * horas)


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
        gratificacion = int(calcular_gratificacion_legal(emp.sueldo_base) * factor_dias)

    horas_extra_monto = calcular_hora_extra(emp.sueldo_base, emp.horas_extra)
    
    # Colación y movilización: NO son imponibles (Art. 41 CT), se suman al final
    colacion = emp.asignacion_colacion
    movilizacion = emp.asignacion_movilizacion

    # Base bruta imponible (sin ingresos NO imponibles)
    base_bruta_imponible = sueldo_base + gratificacion + horas_extra_monto + emp.bono_extra

    res.sueldo_base = sueldo_base
    res.gratificacion = gratificacion
    res.horas_extra_monto = horas_extra_monto
    res.asignacion_colacion = colacion
    res.asignacion_movilizacion = movilizacion
    res.bono_extra = emp.bono_extra
    res.total_haberes_brutos = base_bruta_imponible + colacion + movilizacion

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
    
    # Salud: 7% FONASA o % Isapre
    descuento_salud = int(base_salud * (emp.salud_pct / 100))

    # AFC: Seguro de Cesantía (trabajador)
    if emp.tipo_contrato == "indefinido":
        descuento_afc_trab = int(base_bruta_imponible * (settings.afc_indefinido_trabajador_pct / 100))
    else:
        descuento_afc_trab = 0  # Contrato fijo: solo paga la empresa

    # Base imponible para impuesto = bruto - AFP - Salud - AFC
    base_impuesto = base_bruta_imponible - descuento_afp - descuento_afp_comision - descuento_salud - descuento_afc_trab
    base_impuesto = max(0, base_impuesto)
    res.base_imponible_impuesto = base_impuesto

    # Impuesto Único Segunda Categoría
    impuesto = calcular_impuesto_unico(base_impuesto, utm_valor)

    res.afp = descuento_afp
    res.afp_comision = descuento_afp_comision
    res.salud = descuento_salud
    res.afc_trabajador = descuento_afc_trab
    res.impuesto_unico = impuesto
    res.total_descuentos_legales = (
        descuento_afp + descuento_afp_comision +
        descuento_salud + descuento_afc_trab + impuesto
    )

    # ── 4. CARGOS EMPRESA ─────────────────────────────────────────────────────

    # AFC empresa
    if emp.tipo_contrato == "indefinido":
        afc_empresa = int(base_bruta_imponible * (settings.afc_indefinido_empresa_pct / 100))
    else:
        afc_empresa = int(base_bruta_imponible * (settings.afc_fijo_empresa_pct / 100))

    # SIS — Seguro de Invalidez y Sobrevivencia (pagado 100% por empresa)
    sis_empresa = int(base_afp * (settings.afp_sis_pct / 100))

    res.afc_empresa = afc_empresa
    res.sis_empresa = sis_empresa
    res.total_cargos_empresa = afc_empresa + sis_empresa

    # ── 5. SUELDO LÍQUIDO ─────────────────────────────────────────────────────
    res.sueldo_liquido = res.total_haberes_brutos - res.total_descuentos_legales

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
        "horas_extra_monto": res.horas_extra_monto,
        "bono_extra": res.bono_extra,
        "total_haberes_brutos": res.total_haberes_brutos,
        "base_imponible_afp": res.base_imponible_afp,
        "base_imponible_salud": res.base_imponible_salud,
        "base_imponible_impuesto": res.base_imponible_impuesto,
        "afp": res.afp,
        "afp_comision": res.afp_comision,
        "salud": res.salud,
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
            "afp_code": res.afp_code
        }
    }
