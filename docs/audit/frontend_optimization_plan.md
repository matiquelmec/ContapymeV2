# 🎨 Plan de Optimización y Calidad Frontend (Luxury ERP Standard)
**Proyecto:** CONTAPYMEPUQ — Ecosistema Contable Magallánico  
**Fecha:** 25 de Mayo, 2026  
**Estado:** PENDIENTE DE CORRECCIÓN EN HIDRATACIÓN Y PERSISTENCIA  

---

## 1. Evaluación Estética e Interactividad (Aesthetic & UX)
*   **Modularidad del Dashboard:** [OK] El dashboard principal `ExecutiveDashboardClient` delega el renderizado correctamente a subcomponentes especializados (`MetricsGrid`, `AssetSummaryCard`, `TransactionalTrendCard`, `CashFlowSankey`, `RegionalNewsFeed`).
*   **Transiciones y Animaciones:** [OK] Se utiliza `framer-motion` (`AnimatePresence`, `motion.div`) para lograr transiciones fluidas de cambio de periodo y carga de datos.
*   **Diseño de Carga (Skeletons):** [OK] Se implementa una vista de carga premium que simula el análisis del motor Python.

---

## 2. Hallazgo Crítico: Hydration Warning por Estado Persistido
Se ha detectado el uso de `suppressHydrationWarning={true}` en las vistas principales de `app/src/app/dashboard/executive-dashboard-client.tsx`:
```tsx
<motion.div ... suppressHydrationWarning={true}>
```

### A. Causa Raíz
Zustand gestiona el estado `dashboardYear` a través de un middleware de persistencia (`persist` en `contapymepuq-ui-storage`).
1.  **En el Servidor:** Next.js renderiza el componente usando el valor por defecto (`new Date().getFullYear()` = 2026).
2.  **En el Cliente:** Zustand lee el almacenamiento local (`localStorage`) e inicializa el año en el valor que el usuario seleccionó previamente (ej. 2025).
3.  **Durante el Hydrate:** Hay una discrepancia de contenido (2026 vs 2025) que rompe el árbol de renderizado del DOM de React.

**Impacto:** React emite advertencias de hidratación (ocultas por el modificador), lo que incrementa el tiempo de respuesta interactiva del navegador y puede causar saltos visuales incómodos al cargar la página.

---

## 3. Plan de Remediación

Se propone implementar un hook simple de montaje (`useMounted`) o una verificación de estado local en `ExecutiveDashboardClient` para evitar renderizar componentes dependientes del estado persistido antes de que el cliente esté completamente montado:

```tsx
import { useEffect, useState } from 'react'

export function ExecutiveDashboardClient({ activeOrgId }: { activeOrgId: string }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // ... lógica de consultas ...

  if (!mounted) {
    // Renderizar una versión de carga o esqueleto estático
    return <DashboardSkeleton />
  }

  return (
    // Renderizado seguro en el cliente
    <motion.div ...>
      ...
    </motion.div>
  )
}
```
Esto permite retirar por completo el `suppressHydrationWarning={true}` y optimizar el rendimiento interactivo del dashboard.
