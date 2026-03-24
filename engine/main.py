"""
main.py — Contapyme V2 Engine Entry Point
==========================================
Boot de FastAPI con gestión de ciclo de vida (lifespan).
Integra el scheduler de indicadores económicos automáticamente.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from core.auth import verify_token

from api.routers import (
    f29, payroll, assets, indicators,
    documents, previred, terminations,
    rcv, accounting, dashboard_metrics,
    payroll_settings, lre, bank_reconciliation,
    audit,
)
from workers.indicators_scheduler import start_scheduler, stop_scheduler
from workers.news_worker import start_news_worker, stop_news_worker


# ─── Lifespan: arranque y cierre ordenado del Motor ───────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestiona el ciclo de vida del Motor Python.
    - Al INICIAR: arranca el scheduler de indicadores y el de noticias con IA local.
    - Al CERRAR: detiene los schedulers limpiamente.
    """
    # Iniciar Workers
    await start_scheduler()
    await start_news_worker()
    
    yield
    
    # Detener Workers
    await stop_scheduler()
    await stop_news_worker()


# ─── Aplicación FastAPI ────────────────────────────────────────────────────────

app = FastAPI(
    title="Contapyme V2 Engine",
    description="Motor Matemático de Contabilidad Regional — Arquitectura Slingshot",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS: permite comunicación con el Next.js Frontend (Server Actions)
# En producción, reemplazar '*' por el dominio de Vercel
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://*.vercel.app",  # Preview deployments de Vercel
    # Agregar dominio de producción en Fase 8:
    # "https://contapyme.cl",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────

# Proteger todos los routers bajo el middleware de verificación de JWT
GLOBAL_DEPENDENCIES = [Depends(verify_token)]

app.include_router(f29.router,              prefix="/api/v1/f29",            tags=["Contabilidad (F29)"], dependencies=GLOBAL_DEPENDENCIES)
app.include_router(payroll.router,          prefix="/api/v1/payroll",        tags=["Remuneraciones"], dependencies=GLOBAL_DEPENDENCIES)
app.include_router(assets.router,           prefix="/api/v1/assets",         tags=["Activos Fijos"], dependencies=GLOBAL_DEPENDENCIES)
app.include_router(indicators.router,       prefix="/api/v1/indicators",     tags=["Indicadores Económicos"], dependencies=GLOBAL_DEPENDENCIES)
app.include_router(documents.router,        prefix="/api/v1/documents",      tags=["Documentos Legales"], dependencies=GLOBAL_DEPENDENCIES)
app.include_router(previred.router,         prefix="/api/v1/previred",       tags=["Proceso Previred"], dependencies=GLOBAL_DEPENDENCIES)
app.include_router(terminations.router,     prefix="/api/v1/terminations",   tags=["Finiquitos"], dependencies=GLOBAL_DEPENDENCIES)
app.include_router(rcv.router,              prefix="/api/v1/rcv",            tags=["Registro RCV"], dependencies=GLOBAL_DEPENDENCIES)
app.include_router(accounting.router,       prefix="/api/v1/accounting",     tags=["Contabilidad IFRS"], dependencies=GLOBAL_DEPENDENCIES)
app.include_router(dashboard_metrics.router,prefix="/api/v1/dashboard",      tags=["Dashboard Ejecutivo"], dependencies=GLOBAL_DEPENDENCIES)
app.include_router(payroll_settings.router, prefix="/api/v1/payroll",        tags=["Config. Previsional"], dependencies=GLOBAL_DEPENDENCIES)
app.include_router(lre.router,              prefix="/api/v1/payroll/lre",    tags=["Libro LRE"], dependencies=GLOBAL_DEPENDENCIES)
app.include_router(bank_reconciliation.router, prefix="/api/v1/bank",        tags=["Conciliación Bancaria V2"], dependencies=GLOBAL_DEPENDENCIES)
app.include_router(audit.router,               prefix="/api/v1/audit",       tags=["Auditoría y Trazabilidad"], dependencies=GLOBAL_DEPENDENCIES)


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Sistema"])
def health_check():
    return {
        "status": "ok",
        "service": "contapyme-engine",
        "version": "2.0.0",
        "message": "[CONTAPYME ENGINE] Motor activo en http://0.0.0.0:8000",
        "scheduler": "activo (indicadores Lun-Vie 09:00 AM Santiago)",
    }
