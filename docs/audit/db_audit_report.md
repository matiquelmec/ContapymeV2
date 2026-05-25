# 📊 Reporte de Auditoría de Base de Datos y Aislamiento Multi-Tenant (RLS)
**Proyecto:** CONTAPYMEPUQ — Ecosistema Contable Magallánico  
**Fecha:** 25 de Mayo, 2026  
**Estado:** CERTIFICADO CON ACCIONES RECOMENDADAS  

---

## 1. Resumen de Hallazgos
Se ha realizado una inspección detallada del esquema físico de base de datos de Supabase, las políticas de Row Level Security (RLS) aplicadas y la interacción del motor Python (FastAPI Engine) con la base de datos.

### 🟢 Fortalezas Identificadas
*   **Aislamiento Multi-Tenant Centralizado:** Las políticas de RLS en las tablas críticas utilizan una función centralizada de base de datos `public.check_user_in_org(org_id)` (definida como `SECURITY DEFINER`). Esto garantiza que los filtros no puedan ser eludidos por usuarios authenticated en el frontend.
*   **Triggers de Auditoría Operativos:** El trigger `trg_dte_audit` registra correctamente las transacciones en `audit_logs`, garantizando la gobernanza GRC (Gobierno, Riesgo y Cumplimiento).
*   **Indices de Conflictos Únicos:** La presencia del índice `dte_issued_org_type_folio_unique` previene de manera absoluta la duplicidad de folios en concurrencia.

### 🔴 Brechas Identificadas
*   **Bypass de RLS en el Engine (Service Role):** El conector `engine/core/database.py` utiliza la llave `service_role` de Supabase, la cual tiene el privilegio de saltarse las políticas RLS. Si bien esto es necesario para el funcionamiento del servidor, cualquier vulnerabilidad de inyección de código en los routers de la API podría exponer datos de todas las organizaciones.
*   **Scope del Historial de Logs:** No se detectó un script automático de limpieza o rotación periódica física para la tabla `audit_logs` en el repositorio (solo se menciona a nivel de documentación).

---

## 2. Matriz de Estado de Políticas RLS por Tabla

| Tabla | RLS Habilitado | Política Aplicada | Nivel de Seguridad |
| :--- | :---: | :--- | :--- |
| `profiles` | Sí | `view_profiles` / `insert_own_profile` / `update_own_profile` | Alta |
| `economic_indicators` | Sí | Lectura Pública (`Allow public read access...`) | Adecuada (Datos públicos) |
| `dte_issued` | Sí | `dte_issued_isolation` / `org_isolation` | Alta |
| `dte_caf_folios` | Sí | `org_isolation` | Alta |
| `purchase_records` | Sí | `Purchase records isolation` | Alta |
| `sales_records` | Sí | `Sales records isolation` | Alta |
| `journal_entries` | Sí | `Journal entries isolation` | Alta |
| `employees` | Sí | `Employees isolation` | Alta (Privacidad LRE) |

---

## 3. Acciones de Remediación Recomendadas

### A. Limitar el uso del Service Role en consultas de lectura
Para operaciones de solo lectura en la API de FastAPI que no requieran bypass de RLS, se recomienda inicializar un cliente de Supabase usando el token JWT del usuario authenticated (`auth_token` recibido en la cabecera) en lugar de utilizar siempre el `service_role_key`.
*   *Ubicación a modificar:* `engine/core/database.py` para permitir la instanciación dinámica basada en contexto.

### B. Implementar la limpieza programada de Audit Logs
Crear una tarea programada (pg_cron o worker en Python) que ejecute la limpieza periódica de registros de auditoría mayores a 6 meses para evitar el crecimiento excesivo de la base de datos Supabase Free Tier.
