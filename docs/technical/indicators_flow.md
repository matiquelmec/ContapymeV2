# Arquitectura de Sincronización: Indicadores Económicos
**Contapymepuq V6 — Institutional Grade Data Pipeline**

---

## 🛰️ Flujo de Datos (Market Pulse)

El sistema utiliza una arquitectura de **Proxy Seguro** para garantizar que los indicadores económicos estén siempre disponibles sin comprometer la seguridad RLS (Row Level Security).

### 1. Extracción (Backend Workers)
*   **Proceso:** `engine/workers/indicators_scheduler.py` (ejecutado por `run_worker.py`).
*   **Fuentes:** 
    *   `mindicador.cl` (UF, UTM, Dólar, Euro, IPC, TPM, IMACEC).
    *   `Yahoo Finance` (IPSA, Petróleo WTI).
*   **Almacenamiento:** El motor inserta los datos en Supabase usando la **Service Role Key**, lo que le permite escribir directamente en la tabla `public.economic_indicators` saltándose cualquier restricción RLS.

### 2. Consumo (Frontend -> Engine)
*   **Componente:** `MarketTicker.tsx`.
*   **Acción:** `getLatestIndicators` (`app/src/actions/indicators.ts`).
*   **Endpoint:** `/api/v1/indicators/latest`.
*   **Seguridad:** 
    *   A pesar de que el Frontend tiene acceso directo a Supabase, utiliza el Motor Python como fuente de verdad para aprovechar el caché del servidor (`IND_CACHE_TTL = 3600`).
    *   Se habilitó una política RLS de **Lectura Pública** (`Allow public read access`) para que el Dashboard pueda renderizar los datos incluso en estados de sesión anónima o previa a la selección de empresa.

---

## 🛠️ Solución de Problemas (Troubleshooting)

### Escenario: "Sincronizando con Mercados Globales..." persistente
Si el ticker no muestra datos reales, verifique los siguientes puntos:

1.  **Tabla Vacía:** Ejecute `python scratch/force_update_indicators.py` desde el motor para repoblar la base de datos manualmente.
2.  **Fallo de RLS:** Verifique que la política de lectura pública para `economic_indicators` esté activa en el Dashboard de Supabase.
3.  **Caché del Motor:** Si actualizó la base de datos pero el ticker no cambia, reinicie el proceso del motor Python para limpiar el caché interno.

---

> [!IMPORTANT]
> Los indicadores son **globales** y compartidos entre todas las organizaciones del sistema para mantener la coherencia en los cálculos de activos fijos y reajustes tributarios.
