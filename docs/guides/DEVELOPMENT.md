# 🚀 Guía de Desarrollo — Contapymepuq

Esta guía detalla el workflow estándar para mantener la integridad institucional del proyecto.

## Certified Reports Module (Finanzas)

Este módulo gestiona el archivado inmutable de reportes financieros (Balance, Libro Mayor, etc.) con certificación digital.

### Infraestructura de Base de Datos
Se utiliza la tabla `public.certified_reports` para persistir metadatos y hashes de integridad.

```sql
-- Tabla principal
CREATE TABLE public.certified_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    report_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    integrity_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Políticas RLS
ALTER TABLE public.certified_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura Universal" ON public.certified_reports FOR SELECT USING (true);
CREATE POLICY "Inserción Universal" ON public.certified_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Borrado Universal" ON public.certified_reports FOR DELETE USING (true);
```

### Configuración de Storage
1. Crear bucket `certified_reports` en Supabase.
2. Habilitar políticas de `SELECT`, `INSERT` y `DELETE` para el bucket.

### Proceso de Certificación
- **Generación**: Se usa `jsPDF` para crear el documento con firma digital simulada y QR.
- **Hash**: Se genera un SHA-256 del contenido para garantizar inmutabilidad.
- **Archivado**: El archivo se sube al storage y se registra el hash en DB.

---

## ⚡ Forma Rápida (Recomendada)
Para iniciar todo el ecosistema con un solo comando desde la raíz:
```powershell
./start.ps1
```
Esto lanzará el **Motor Backend** (Puerto 8000) y el **Dashboard Frontend** (Puerto 3000) en ventanas independientes.

---

## 🧪 Suite de Pruebas Unificada
Es mandatorio ejecutar las pruebas antes de realizar cualquier commit significativo.
Desde la raíz del proyecto:

- **Pruebas del Motor**: `pytest tests/engine`
- **Pruebas de Base de Datos**: `pytest tests/database`
- **Pruebas de Integración**: `pytest tests/integration`

*Consulta `tests/TESTING.md` para más detalles.*

---

## 🛠️ Reglas de Oro en Windows
- **Frontend**: Usa siempre `npx next dev` en lugar de `npm run dev` para evitar procesos colgados en PowerShell.
- **Backend**: Asegúrate de tener el entorno virtual activo (`.venv`) dentro de la carpeta `engine`.

---

## 💎 Estándares de Código (SSoT)
- **Lógica Compartida**: Toda función de formateo (moneda, RUT, fechas) DEBE residir en `engine/core/utils/shared_utils.py`. **No dupliques lógica en los routers**.
- **Base de Datos**: Usa siempre `gen_random_uuid()` para IDs y mantén las migraciones con el prefijo de 14 dígitos cronológicos.
- **Frontend**: Mantén los componentes pequeños. Si un archivo supera las 400 líneas, es hora de refactorizar.

---

## ✅ Verificación de Salud
- **Backend API Docs**: http://localhost:8000/docs
- **Frontend Dashboard**: http://localhost:3000
