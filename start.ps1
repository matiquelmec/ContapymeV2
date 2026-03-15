# start.ps1 - Contapyme V2 Launcher
# Levanta el Motor Python (FastAPI) y el Dashboard (Next.js) en paralelo.

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  CONTAPYME V2 - INICIANDO ENTORNO   " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# --- Backend: Python Engine ---
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot\engine'; . '.\.venv\Scripts\Activate.ps1'; python run_engine.py"
) -WindowStyle Normal

Write-Host "[1/2] Motor Python iniciando en http://localhost:8000" -ForegroundColor Green
Start-Sleep -Seconds 2

# --- Frontend: Next.js Dashboard ---
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot\app'; npx next dev"
) -WindowStyle Normal

Write-Host "[2/2] Dashboard Next.js iniciando en http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Ambos servidores arrancando. Verifica en:" -ForegroundColor Yellow
Write-Host "  → Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  → Backend:   http://localhost:8000/docs" -ForegroundColor White
