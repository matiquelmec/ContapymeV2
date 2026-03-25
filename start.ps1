# ==============================================================================
#  CONTAPYME V2 - INICIADOR DE ENTORNO PROFESIONAL (ROBUSTO)
# ==============================================================================
# Este script lanza los 3 pilares del sistema en procesos independientes:
# 1. API Engine (Backend FastAPI)
# 2. Worker AI (News & Indicators Schedulers)
# 3. Dashboard (Frontend Next.js)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  CONTAPYME V2 - INICIANDO ENTORNO   " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Función para lanzar un proceso con título y comando limpio
function Start-ContapymeProcess {
    param(
        [string]$Title,
        [string]$Directory,
        [string]$Command,
        [string]$ConfirmMsg
    )
    
    $FullCommand = "cd '$Directory'; `$host.ui.RawUI.WindowTitle = '$Title'; $Command"
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $FullCommand -WindowStyle Normal
    Write-Host "$ConfirmMsg" -ForegroundColor Green
}

# --- 1. Motor Python (API REST) ---
Start-ContapymeProcess `
    -Title "CONTAPYME - Backend API" `
    -Directory "$PSScriptRoot\engine" `
    -Command ". '.\.venv\Scripts\Activate.ps1'; python run_engine.py" `
    -ConfirmMsg "[1/3] API REST iniciando en http://localhost:8000"

# --- 2. Trabajador de Fondo (Worker IA/Indicadores) ---
Start-ContapymeProcess `
    -Title "CONTAPYME - Worker AI" `
    -Directory "$PSScriptRoot\engine" `
    -Command ". '.\.venv\Scripts\Activate.ps1'; python run_worker.py" `
    -ConfirmMsg "[2/3] Trabajador de Fondo activo (IA & Schedulers)"

Start-Sleep -Seconds 1

# --- 3. Dashboard Frontend (Next.js) ---
Start-ContapymeProcess `
    -Title "CONTAPYME - Frontend" `
    -Directory "$PSScriptRoot\app" `
    -Command "npx next dev" `
    -ConfirmMsg "[3/3] Dashboard Next.js iniciando en http://localhost:3000"

Write-Host ""
Write-Host "Entorno Contapyme V2 iniciado en 3 procesos independientes." -ForegroundColor Yellow
Write-Host "Verifica las nuevas ventanas abiertas en tu barra de tareas." -ForegroundColor White
