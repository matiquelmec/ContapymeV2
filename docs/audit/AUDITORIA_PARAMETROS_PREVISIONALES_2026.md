# Auditoría de Parámetros Previsionales y Legales 2026 — ContaPymePuq

Este documento presenta los resultados del análisis detallado de los parámetros previsionales y legales de Chile vigentes para el año **2026** frente a los valores actuales almacenados en la base de datos y en el código del sistema (Frontend Next.js y Backend FastAPI).

---

## 1. Diagnóstico Actual vs. Valores Oficiales (Chile 2026)

Tras auditar la base de datos Supabase, el código del calculador de sueldos de FastAPI (`engine/`) y las calculadoras del frontend (`app/`), se identificaron las siguientes discrepancias:

| Parámetro Previsional | Valor en Sistema (Actual) | Valor Oficial Vigente (2026) | Estado | Impacto / Nota |
| :--- | :---: | :---: | :---: | :--- |
| **Sueldo Mínimo Legal** | `$539.000` | **`$539.000`** | **Vigente (OK)** | Correcto para el primer semestre de 2026 (aumentó en enero). Hay un proyecto de ley en trámite para reajustarlo a `$546.546` a partir de mayo de 2026. |
| **Tope AFP / Salud (UF)** | `84.3 UF` | **`89.9 UF`** (Ene 2026)<br>**`90.0 UF`** (Feb 2026+) | ❌ **Desactualizado** | Limita incorrectamente las cotizaciones previsionales de sueldos altos, generando cálculos erróneos en el descuento imponible de salud y pensión. |
| **Tope Imponible AFC (UF)** | `126.6 UF` | **`135.1 UF`** (Ene 2026)<br>**`135.2 UF`** (Feb 2026+) | ❌ **Desactualizado** | Afecta el cálculo del Seguro de Cesantía para saldos que superan el tope histórico. |
| **Jornada Laboral Progresiva** | `42 horas` | **`42 horas`** | **Vigente (OK)** | Reducción obligatoria según la Ley de 40 Horas de Chile, vigente a partir del **26 de abril de 2026**. El sistema ya cuenta con la variable configurada en `42`. |
| **Asignación Familiar (Tramos)** | Tramo A: `$21.243` (Tope renta: `$539.330`) | Tramo A: `$21.243` (Tope renta: `$539.330`) | **Vigente (OK)** | Coincide con la resolución del Ministerio de Hacienda vigente para el inicio de 2026. |

---

## 2. Hallazgos en la Arquitectura de Datos

1. **Tabla `public.national_payroll_params` en Supabase:**
   - La tabla solo posee **un único registro** correspondiente a `2026-01-01` con los valores obsoletos (`tope_afp_uf = 84.3000` y `tope_afc_uf = 126.6000`).
   - Los valores por defecto (`DEFAULT`) definidos en la estructura DDL de la tabla también apuntan a los valores antiguos de `84.3` y `126.6`.
2. **Backend FastAPI (`engine/`):**
   - El archivo `engine/calculators/national_params.py` tiene definidos de forma estática (hardcoded) `TOPE_AFP_UF = 84.3` y `TOPE_AFC_UF = 126.6`.
   - Si no se encuentra un registro en la base de datos para el mes corriente, el sistema cae en estos fallbacks obsoletos.
3. **Frontend Next.js (`app/`):**
   - El endpoint del API `app/src/app/api/public/payroll-params/route.ts` y el calculador público de sueldos `public-salary-calculator.tsx` tienen hardcoded `tope_afp_uf: 84.3`.

---

## 3. Plan de Acción Propuesto (Remediación)

Para garantizar la precisión de los cálculos de liquidaciones de sueldo de tu software, proponemos realizar la siguiente actualización integral:

### Paso 1: Migración SQL de Parámetros Históricos (Supabase)
Insertar de forma definitiva los dos registros para el año 2026 en la base de datos remota para reflejar la actualización de la Superintendencia de Pensiones:
- **Periodo `2026-01-01`:** Tope AFP/Salud de **`89.9 UF`** y Tope AFC de **`135.1 UF`**.
- **Periodo `2026-02-01` (en adelante):** Tope AFP/Salud de **`90.0 UF`** y Tope AFC de **`135.2 UF`**.

### Paso 2: Actualización del Fallback en el Backend (Python)
Modificar `engine/calculators/national_params.py` para establecer por defecto los valores vigentes de 2026:
```python
TOPE_AFP_UF = 90.0
TOPE_SALUD_UF = 90.0
TOPE_AFC_UF = 135.2
```

### Paso 3: Sincronización del Frontend (TypeScript)
Actualizar los valores de fallback del frontend en los archivos del API pública y de las calculadoras visuales para evitar discrepancias si el frontend opera sin conexión con el backend o ante fallos del API.

### Paso 4: Monitoreo Automatizado (Opcional - Futuro)
Implementar una tarea programada (cron) en el backend FastAPI que consulte de forma mensual una API externa pública o de indicadores económicos (ej. `mindicador.cl` o un scraper de Previred) para alertar al administrador o actualizar automáticamente la tabla `national_payroll_params` cuando cambien los valores legales.
