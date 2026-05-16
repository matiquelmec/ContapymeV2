# 💎 CONTAPYMEPUQ — Ecosistema Contable Magallánico
## "Precisión Institucional, Lógica Superior."

Bienvenido al repositorio oficial de **Contapymepuq**, el SaaS contable diseñado para liderar la transformación digital en la región de Magallanes. Este ecosistema combina la potencia de **Python** para cálculos matemáticos complejos con la belleza y agilidad de **Next.js 16**.

---

## 🗺️ Mapa de Navegación del Proyecto

### 1. [BLUEPRINT_MAESTRO.md](./BLUEPRINT_MAESTRO.md) 🎯
**La Fuente Única de Verdad (SSoT).** Consulta este archivo para entender la visión estratégica, la arquitectura de módulos y el roadmap de desarrollo actual (v5.0).

### 2. Repositorio de Conocimiento ([/docs](./docs)) 📚
Hemos centralizado la documentación técnica para garantizar la escalabilidad:

*   **[Guía de Desarrollo](./docs/guides/DEVELOPMENT.md)** 🚀: Cómo iniciar el proyecto, reglas de oro para Windows y flujos de trabajo.
*   **[Patrones de Ingeniería](./docs/technical/patterns/)** 💎: Catálogo de +60 mejores prácticas (React, JS, Seguridad).
*   **[Arquitectura e Integridad](./docs/architecture/OVERVIEW.md)**: Lógica de RLS, Cadena de Integridad SHA-256 y Flujos DTE.
*   **[Auditoría y Certificación](./docs/audit/PLAN_MAESTRO.md)**: Registro de auditorías RCV y planes de certificación SII.
*   **[Frontend Guide](./docs/frontend/FRONTEND_GUIDE.md)**: Manual de la interfaz "Luxury ERP" (Next.js).
*   **[Database & Esquemas](./docs/database/DATABASE_GUIDE.md)**: Diccionario de datos y snapshots de Supabase.

---

## 🚀 Inicio Rápido (Stack Tecnológico)

El sistema se divide en dos grandes motores que deben correr en paralelo:

### 🎨 Frontend (Next.js 16)
Ubicación: `/app`
```bash
cd app
npm install
npm run dev
```

### ⚙️ Engine API (FastAPI)
Ubicación: `/engine`
```bash
cd engine
pip install -r requirements.txt
python main.py
```

---

## 🛡️ Estándar Contapymepuq
- **Seguridad**: Multi-tenant por diseño (Supabase RLS).
- **Integridad**: Auditoría física de documentos (RCV 2.0).
- **Cumplimiento**: Generación de DTE bajo normativa SII Chile.

---
> *"Construido por y para la región. Precisión que inspira confianza."*
