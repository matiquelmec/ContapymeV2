---
description: CÃ³mo iniciar el proyecto Contapyme V2 en local (Backend Python + Frontend Next.js)
---

# Iniciar Contapyme V2 en Local

## âš¡ Forma rÃ¡pida (recomendada): Un solo comando

// turbo
1. Ejecutar el launcher unificado desde la raÃ­z del proyecto (una vez creado el archivo start.ps1):
```powershell
./start.ps1
```
Esto abre automÃ¡ticamente dos ventanas de PowerShell separadas:
- Una con el **Motor Backend** (FastAPI) en http://localhost:8000
- Una con el **Dashboard Frontend** (Next.js) en http://localhost:3000

---

## ðŸ”§ Forma manual (si necesitas control granular)

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
- Verificar: `âœ“ Ready in X.Xs`

---

## âš ï¸ IMPORTANTE - Regla de oro en Windows + PowerShell

**NUNCA usar `npm run dev`** para el frontend en Windows con PowerShell si tienes problemas de procesos colgados.

| Comando | Resultado en Windows/PowerShell |
|---------|-------------------------------|
| `npm run dev` | Puede pasar por `.cmd` â†’ a veces genera prompt interactivo â†’ muere |
| `npx next dev` | Llama a Next.js directamente â†’ funciona consistentemente |

---

## âœ… VerificaciÃ³n
- Backend API Docs: http://localhost:8000/docs (Swagger UI - Pruebas manuales de subida de PDF)
- Frontend: http://localhost:3000 (Dashboard B2B)
