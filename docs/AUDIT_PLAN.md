# 📋 Plan de Auditoría de Sincronización Contapyme V2

Este plan detalla los pasos críticos para certificar que el sistema (Frontend y Backend) está operando en total armonía con el esquema maestro de Supabase, eliminando deudas técnicas y asegurando la escalabilidad multi-tenant.

## 🏹 1. Auditoría de Capa de Persistencia (DB vs Engine)
El objetivo es asegurar que cada campo en `master_snapshot.sql` tenga un espejo funcional en el Python Engine.

- [x] **Validación de Modelos Pydantic:**
    - [x] Modelos de Contabilidad, Nómina y F29 sincronizados.
    - [x] Soporte para exclusión de opcionales (model_dump exclude_unset) implementado.
- [x] **Eliminación de Hardcoding Restante:**
    - [x] Sincronizado `accounting.py` con `centralized_account_config`.
    - [x] Sincronizado `payroll.py` con `organization_payroll_settings`.
    - [x] Sincronizado `f29.py` con `centralized_account_config` (Fase 3).
    - [x] Auditado `assets.py`: Utiliza configuración dinámica (con fallbacks legales).

## 🎨 2. Auditoría de Capa de Frontend (DB vs App)
Asegurar que la visualización "Luxury ERP" no sufra de desfases de tipos.

- [ ] **Sincronización de Tipos TypeScript:**
    - Actualizar `AccountConfig` y otras interfaces según los nuevos campos SQL. 
    - [x] Actualizada interfaz de configuración contable en `config-client.tsx`. (Campos Payroll y F29 incluidos).
- [x] **Auditoría de Server Actions:**
    - [x] Verificada la inyección de metadatos en acciones de Accounting y Payroll.

## 🛡️ 3. Auditoría de Integridad Multi-Tenant (RLS)
El "Muro Multi-tenant" debe ser inquebrantable.

- [x] **Validación de `organization_id`:**
    - [x] Implementación de RLS Hardening (Migración 20260401).
    - [x] Función `check_org_access` y políticas estrictas.
- [x] **Test de Fuga de Datos:**
    - [x] Diseñado script de prueba de estrés en `tests/rls_stress_test.py`.

## 📉 4. Auditoría de Lógica de Negocio y Cálculo (Matemática Real)
- [x] **Sincronización de Parámetros Nacionales:**
    - [x] Auditado `engine/calculators/national_params.py`: Valores vigentes para Chile 2025/2026 (UF, Sueldo Mínimo, Ley 40 Horas).
- [x] **Idempotencia de Centralización:**
    - [x] Verificada para Nómina (Purga por source_id/periodo).
    - [x] Verificada para F29 (Purga por source_id/periodo).

## 📅 Cronograma de Ejecución
| Fase | Actividad | Estado |
|---|---|---|
| **Fase A** | Refactorización de Hardcoding | ✅ COMPLETADO |
| **Fase B** | Generación y Auditoría de Tipos | 🔄 En Progreso |
| **Fase C** | Stress-test de RLS y Multi-Tenancy | ✅ COMPLETADO |
| **Fase D** | Certificación Final de Snapshot | 🔄 En Progreso |

---
> **ÚLTIMA ACTUALIZACIÓN:** 01 de Abril de 2026 - Auditoría en fase final de certificación.
