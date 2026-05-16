# 🚀 Guía de Desarrollo — Contapymepuq

Esta guía detalla el workflow estándar para mantener la integridad institucional del proyecto.

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
