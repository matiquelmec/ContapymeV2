# 🏛️ Arquitectura Técnica de Contapymepuq
## El Ecosistema de las 3 Capas

Contapymepuq no es una aplicación monolítica; es un ecosistema distribuido diseñado para la resiliencia y la precisión.

---

### 1. Capa de Inteligencia (Mathematical Engine)
- **Tecnología**: Python 3.12 + FastAPI.
- **Responsabilidad**: Cálculos de alta precisión, firma digital de DTE, y auditoría física de documentos RCV.
- **Ubicación**: `/engine`.

### 2. Capa de Persistencia (Data Layer)
- **Tecnología**: Supabase (PostgreSQL).
- **Responsabilidad**: Garantizar el aislamiento Multi-tenant mediante **RLS (Row Level Security)** y la inmutabilidad de los DTE mediante la **Hash Chain SHA-256**.
- **Ubicación**: `/supabase`.

### 3. Capa de Presentación (Luxury Frontend)
- **Tecnología**: Next.js 16 + React.
- **Responsabilidad**: Ofrecer una interfaz intuitiva, rápida y estéticamente premium (Luxury ERP).
- **Ubicación**: `/app`.

---

## 🛡️ Protocolos de Seguridad
- **Hash Chain**: Cada DTE contiene el hash del anterior, impidiendo la alteración de registros históricos.
- **Audit Logging**: Cada mutación de datos se registra con el ID del usuario, IP y metadatos del cambio.
- **Contexto Multi-Tenant**: El `organization_id` es el eje central que impide cualquier fuga de datos entre empresas.

## ⚙️ Estabilidad y Calidad
- **SSoT Utility**: Centralización de lógica de negocio crítica en `shared_utils.py` para evitar divergencias de datos.
- **Master Testing Suite**: Suite unificada en `/tests` que valida la integridad del motor, la base de datos y los flujos de integración de forma proactiva.
