from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import get_supabase
from api.routers import f29, payroll, assets, indicators, documents, previred, terminations, rcv, accounting, dashboard_metrics, payroll_settings, lre

app = FastAPI(
    title="Contapyme V2 Engine",
    description="Motor Matemático de Contabilidad Regional",
    version="2.0.0"
)

# CORS para comunicación directa con el Next.js Frontend (Server Actions)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En prod cambiar por el dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(f29.router, prefix="/api/v1/f29", tags=["Contabilidad (F29)"])
app.include_router(payroll.router, prefix="/api/v1/payroll", tags=["Remuneraciones"])
app.include_router(assets.router, prefix="/api/v1/assets", tags=["Activos Fijos"])
app.include_router(indicators.router, prefix="/api/v1/indicators", tags=["Indicadores Económicos"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Legal Documents"])
app.include_router(previred.router, prefix="/api/v1/previred", tags=["Proceso Previred"])
app.include_router(terminations.router, prefix="/api/v1/terminations", tags=["Employee Terminations"])
app.include_router(rcv.router, prefix="/api/v1/rcv", tags=["Registro RCV"])
app.include_router(accounting.router, prefix="/api/v1/accounting", tags=["Contabilidad Automática"])
app.include_router(dashboard_metrics.router, prefix="/api/v1/dashboard", tags=["Dashboard Ejecutivo"])
app.include_router(payroll_settings.router, prefix="/api/v1/payroll", tags=["Configuración Previsional"])
app.include_router(lre.router, prefix="/api/v1/payroll/lre", tags=["Libro de Remuneraciones Electrónico"])

@app.get("/health")
def read_root():
    return {"status": "ok", "message": "[CONTAPYME ENGINE] Activo en http://0.0.0.0:8000", "service": "contapyme-engine", "version": "2.0.0"}
