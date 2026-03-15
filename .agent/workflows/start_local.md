---
description: Cómo iniciar el proyecto Contapyme V2 en local (Backend Python + Frontend Next.js)
---

# Iniciar Contapyme V2 en Local

## ⚡ Forma rápida (recomendada): Un solo comando

// turbo
1. Ejecutar el launcher unificado desde la raíz del proyecto (una vez creado el archivo start.ps1):
```powershell
./start.ps1
```
Esto abre automáticamente dos ventanas de PowerShell separadas:
- Una con el **Motor Backend** (FastAPI) en http://localhost:8000
- Una con el **Dashboard Frontend** (Next.js) en http://localhost:3000

---

## 🔧 Forma manual (si necesitas control granular)

### Paso 1: Backend (Motor FastAPI - Python)
// turbo
1. Moverse a la carpeta engine, activar el entorno virtual e iniciar el motor:
```powershell
cd engine
. .\.venv\Scripts\Activate.ps1
python main.py
```
- Verificar: `[CONTAPYME ENGINE] Iniciando en http://0.0.0.0:8000`

### Paso 2: Frontend (Dashboard Next.js)
// turbo
2. Moverse a la carpeta app e iniciar el servidor de desarrollo:
```powershell
cd app
npx next dev
```
- Verificar: `✓ Ready in X.Xs`

---

## ⚠️ IMPORTANTE - Regla de oro en Windows + PowerShell

**NUNCA usar `npm run dev`** para el frontend en Windows con PowerShell si tienes problemas de procesos colgados.

| Comando | Resultado en Windows/PowerShell |
|---------|-------------------------------|
| `npm run dev` | Puede pasar por `.cmd` → a veces genera prompt interactivo → muere |
| `npx next dev` | Llama a Next.js directamente → funciona consistentemente |

---

## ✅ Verificación
- Backend API Docs: http://localhost:8000/docs (Swagger UI - Pruebas manuales de subida de PDF)
- Frontend: http://localhost:3000 (Dashboard B2B)
