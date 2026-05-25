# 🏛️ Checklist de Cumplimiento Normativo SII (DTE y Remuneraciones)
**Proyecto:** CONTAPYMEPUQ — Ecosistema Contable Magallánico  
**Fecha:** 25 de Mayo, 2026  
**Estado:** PENDIENTE DE CORRECCIÓN EN CÁLCULO DE ASIGNACIÓN FAMILIAR  

---

## 1. Módulo DTE y Firma XML
*   **Firma de Semilla y Obtención de Token:** [OK] Implementado correctamente en `engine/core/dte/sii_client.py` y `dte_signer.py`.
*   **Canonización C14N y Firma XML:** [OK] Se utiliza `lxml` con la hoja de firma oficial para asegurar la consistencia del XML firmado.
*   **Timbre Electrónico DTE (TED):** [OK] Implementado usando la clave privada RSASK extraída del archivo CAF mediante `caf_manager.py`.

---

## 2. Módulo de Gestión de Folios (CAF)
*   **Rotación de CAF:** [OK] `upload_cafs.py` desactiva automáticamente los rangos de folios antiguos de la misma empresa para evitar colisiones.
*   **Validación de Topes de Folio:** [OK] `_get_next_folio_with_caf` en `dte_logic.py` valida que no se exceda el rango superior (`range_end`) del CAF activo.

---

## 3. Módulo de Remuneraciones (Leyes de Chile 2026)

### 🔴 Hallazgo Crítico 1: Redundancia y Discrepancia de Parámetros (SSoT Violado)
Existe una discrepancia directa entre los montos de **Asignación Familiar** definidos en `engine/calculators/national_params.py` (Source of Truth de parámetros estatales) y los tramos hardcodeados en `engine/calculators/chilean_payroll.py`.

*   **Valores en `national_params.py` (Correctos):**
    *   Tramo A: Renta imponible <= $539,330 -> Monto: $21,243 por carga.
    *   Tramo B: Renta imponible <= $787,747 -> Monto: $14,516 por carga.
    *   Tramo C: Renta imponible <= $1,228,614 -> Monto: $4,590 por carga.
*   **Valores en `chilean_payroll.py` (Erróneos):**
    *   Tramo A: Renta imponible <= $539,330 -> Monto: $21,463 por carga. (Discrepancia: +$220)
    *   Tramo B: Renta imponible <= $787,747 -> Monto: $13,169 por carga. (Discrepancia: -$1,347)
    *   Tramo C: Renta imponible <= $1,228,614 -> Monto: $4,161 por carga. (Discrepancia: -$429)

**Impacto:** Los cálculos de liquidaciones de sueldo utilizando el simulador local arrojarán montos incorrectos de asignación familiar, discrepando de los pagos declarados y de los informes oficiales para Previred.

---

## 4. Plan de Remediación

### A. Corregir Asignación Familiar en `chilean_payroll.py`
Para cumplir con la regla de SSoT, la función `calcular_asignacion_familiar` de `chilean_payroll.py` debe importar y utilizar directamente la configuración de `national_params.py` en lugar de duplicar los tramos.

```python
# Modificación en engine/calculators/chilean_payroll.py:
from .national_params import ASIGNACION_FAMILIAR

def calcular_asignacion_familiar(base_imponible: int, num_cargas: int) -> int:
    """Calcula el monto de Asignación Familiar según tramos centralizados."""
    if num_cargas <= 0:
        return 0
    for tramo in ["tramo_a", "tramo_b", "tramo_c"]:
        if base_imponible <= ASIGNACION_FAMILIAR[tramo]["tope_renta"]:
            return ASIGNACION_FAMILIAR[tramo]["monto"] * num_cargas
    return 0
```
*(Nota: O bien importar la función directamente de `national_params.py` si es compatible).*
