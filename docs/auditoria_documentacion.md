# Plan de Auditoría de Documentación — Contapymepuq V6
**Objetivo:** Garantizar que el "Maestro Blueprint" y la documentación técnica reflejen con precisión la infraestructura de seguridad, lógica DTE y componentes de UI implementados recientemente.

---

## 📊 1. Matriz de Trazabilidad (Cambios Recientes vs. Documentos)

| Área de Cambio | Componente Técnico | Estado en Documentación | Documento Objetivo |
| :--- | :--- | :--- | :--- |
| **Seguridad RLS** | Políticas de `profiles` y `economic_indicators` | Desactualizado (Fase 11) | `BLUEPRINT_MAESTRO.md` |
| **Módulo DTE** | Flujo de validación de RUT y `StatusModal` | Parcial | `docs/dte/README.md` |
| **Motor de Datos** | Sincronización Python -> Supabase | No documentado | `engine/README.md` |
| **Interfaz (UX)** | Badges de identidad y fallbacks de miembros | No documentado | `BLUEPRINT_MAESTRO.md` |

---

## 🛠️ 2. Fases de la Auditoría Profesional

### Fase A: Auditoría de Seguridad e Integridad (Hardening)
*   **Acción:** Comparar el archivo `supabase/migrations/` con las políticas activas en el Dashboard de Supabase.
*   **Verificación:** Asegurar que la migración `20260516000001_allow_public_indicators.sql` esté listada como "Aplicada" y que su propósito (acceso público a indicadores) esté explicado en el Blueprint.
*   **KPI:** 100% de coincidencia entre archivos `.sql` y políticas en producción.

### Fase B: Auditoría de Lógica DTE e "Institutional Grade"
*   **Acción:** Revisar que los mensajes de error educativos ("Configuración de Empresa > Facturación") coincidan exactamente con las rutas definidas en el `sidebar.tsx`.
*   **Verificación:** Validar que el componente `StatusModal` sea el estándar documentado para feedback de transacciones, eliminando referencias a "Toasts" genéricos en los manuales.

### Fase C: Auditoría de Conectividad del Motor (Engine)
*   **Acción:** Documentar el flujo de datos del `MarketTicker`.
*   **Detalle:** Especificar que el Frontend consume `/api/v1/indicators/latest` del motor Python y que este actúa como proxy seguro hacia Supabase (Bypassing RLS vía Service Role).
*   **Importancia:** Evitar futuros errores de "datos vacíos" por malinterpretación del flujo de caché.

### Fase D: Actualización del Blueprint Maestro
*   **Acción:** Mover ítems de "En Progreso" a "Completado" en la Fase 11.
*   **Nuevas Entradas:**
    *   `[x]` Auditoría de Seguridad RLS: Profiles & Indicators.
    *   `[x]` Sincronización Global de Mercados (Engine Proxy).
    *   `[x]` UI de Gestión de Equipo (Identity Badges).

---

## 🚀 3. Acciones de Remediación Inmediata

1.  **Actualizar el Blueprint**: Reflejar el éxito de la Fase 11 (Seguridad y Datos).
2.  **Glosario de Rutas**: Crear una sección pequeña que mapee las rutas del motor Python (`/api/v1/...`) con sus funciones en el Frontend para facilitar el mantenimiento futuro.
3.  **Audit Logs**: Verificar que los cambios en perfiles se estén registrando bajo la nueva política RLS y documentar este comportamiento.

---

> [!NOTE]
> Este plan asegura que el proyecto no solo funcione, sino que sea **Auditable y Escalable**, manteniendo la coherencia entre el código "Institutional Grade" y su respaldo documental.
