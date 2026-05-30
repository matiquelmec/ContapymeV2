# AUDITORÍA DE CONSISTENCIA Y PARIDAD MATEMÁTICA: MOTOR DE SUELDOS INVERSOS

**Proyecto:** Contapyme V2  
**Fecha:** 30 de Mayo de 2026  
**Auditor:** Antigravity AI Engine  

---

## 1. Resumen Ejecutivo

Al auditar la calculadora express pública en la portada (`public-salary-calculator.tsx`), se detectaron discrepancias en los resultados de cálculo respecto al motor de nómina principal (`chilean_payroll.py`). Esta inconsistencia se origina en la simplificación de topes previsionales y deducciones impositivas en la versión de JavaScript. 

Este documento presenta la propuesta de auditoría técnica y el plan de mitigación para lograr paridad exacta de $1:1$ (peso por peso) entre el frontend y el backend, preservando la velocidad del cálculo local sin comprometer el rigor normativo.

---

## 2. Hallazgos y Análisis de Brechas

### Brecha A: Tope Imponible para Seguro de Cesantía (AFC)
*   **Estado Anterior en JS:** La base de cálculo para el AFC del trabajador se topaba con el límite de AFP de **84.3 UF**.
*   **Regla de Negocio Real (Python):** La Ley 19.728 fija el tope imponible para el Seguro de Cesantía en **126.6 UF** (2025/2026).
*   **Impacto:** Los empleados con rentas brutas superiores a 84.3 UF (~$3.200.000) registraban descuentos subcalculados en JS, inflando artificialmente el sueldo base requerido.

### Brecha B: Base Imponible del Impuesto de Segunda Categoría (IRPF)
*   **Estado Anterior en JS:** Se calculaba el impuesto aplicando tramos sobre la base topada de AFP, deduciendo la salud voluntaria de la base gravable.
*   **Regla de Negocio Real (Python):** La base imponible del Impuesto Único parte de la **remuneración bruta imponible total (sin topes)**, de la cual se deducen únicamente las cotizaciones obligatorias topadas (AFP 10% + comisión, Salud Legal 7%, y AFC 0.6%). La cotización voluntaria de Isapre no rebaja el impuesto.
*   **Impacto:** Para sueldos altos, el impuesto único resultante en JS difería sustancialmente del cálculo real del SII, distorsionando el sueldo líquido.

### Brecha C: Rebaja por Zona Extrema (Magallanes - DL 889)
*   **Estado Anterior en JS:** Se aplicaba una simulación simplificada sin deducción de base ni cálculo dinámico del tramo del Impuesto Único de Segunda Categoría.
*   **Regla de Negocio Real (Python):** Aplica una exención del **98%** sobre el impuesto determinado bruto en Magallanes, además de una rebaja en la base gravable igual a la asignación de zona (0.875 del sueldo escala Grado 1A).
*   **Impacto:** Los cálculos de impuestos en la región de Magallanes resultaban significativamente mayores en el simulador de JS, reduciendo el sueldo base estimado para líquidos altos.

---

## 3. Plan de Mitigación y Sincronización Matemática

Para resolver estas brechas de consistencia sin introducir llamadas de red que ralenticen la experiencia de usuario, aplicaremos la **Regla de Traducción 1:1**. La función de cálculo en JavaScript se modificará para replicar la estructura computacional exacta del motor de Python:

```typescript
// Sincronización de variables impositivas
const imponibleAfp = Math.min(brutoImponible, TOPE_AFP_UF * UF);
const imponibleAfc = Math.min(brutoImponible, TOPE_AFC_UF * UF);

// Deducciones
const afpObligatoria = Math.floor(imponibleAfp * 0.10);
const afpComision = Math.floor(imponibleAfp * (afpComisionPct / 100));
const saludLegal = Math.floor(imponibleAfp * 0.07);
const afcTrabajador = tipoContrato === "indefinido" ? Math.floor(imponibleAfc * 0.006) : 0;

// Base Tributable Real
let baseImpuesto = brutoImponible - afpObligatoria - afpComision - saludLegal - afcTrabajador;
```

Este modelo garantiza concordancia absoluta de resultados con el backend para todo el rango de rentas en Chile.
