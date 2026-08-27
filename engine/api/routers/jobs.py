"""
jobs.py — Router de Empleos Regionales (ContaEmpleos PUQ)
=========================================================
Endpoints para consulta, auditoría legal con IA y publicación de vacantes.
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field

from core.database import get_supabase
from workers.job_worker import audit_and_structure_job_with_ai, process_and_save_job, _audit_legal_compliance

router = APIRouter()


class JobPublishRequest(BaseModel):
    raw_text: str = Field(..., description="Texto completo o descripción del aviso laboral")
    source_name: Optional[str] = Field("Publicación Directa Pyme", description="Origen de la oferta")
    source_url: Optional[str] = Field(None, description="URL de referencia o portal externo")


class JobAuditRequest(BaseModel):
    text: str = Field(..., description="Texto a auditar contra el Art. 2° del Código del Trabajo")


@router.post("/audit-compliance")
async def audit_job_compliance(req: JobAuditRequest):
    """
    Audita en tiempo real si un aviso cumple con la normativa legal chilena
    (Art. 2° Código del Trabajo y Ley N° 20.609 de no discriminación).
    """
    is_valid, reason = _audit_legal_compliance(req.text)
    return {
        "is_compliant": is_valid,
        "reason": reason
    }


@router.post("/publish")
async def publish_job(req: JobPublishRequest):
    """
    Procesa un aviso laboral con IA, valida el cumplimiento jurídico,
    lo estructura bajo Schema.org y lo persiste en Supabase.
    """
    try:
        saved_job = await process_and_save_job(
            raw_text=req.raw_text,
            source_name=req.source_name,
            source_url=req.source_url
        )
        if not saved_job:
            raise HTTPException(
                status_code=400,
                detail="El aviso no pudo ser publicado. Verifique que cumpla las normas de no discriminación (Art. 2° Código del Trabajo) o que no sea un aviso duplicado."
            )
        return {
            "status": "success",
            "message": "Oferta laboral validada y publicada exitosamente.",
            "data": saved_job
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar oferta laboral: {str(e)}")


@router.get("/list")
def list_active_jobs(
    location: Optional[str] = Query(None, description="Filtrar por comuna (ej. Punta Arenas)"),
    sector: Optional[str] = Query(None, description="Filtrar por sector productivo"),
    job_type: Optional[str] = Query(None, description="Filtrar por tipo de contrato"),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Retorna la lista de ofertas laborales activas con filtros opcionales."""
    db = get_supabase()
    query = db.table("job_postings").select("*").eq("status", "active").order("published_at", desc=True)

    if location:
        query = query.ilike("location", f"%{location}%")
    if sector:
        query = query.ilike("sector", f"%{sector}%")
    if job_type:
        query = query.ilike("job_type", f"%{job_type}%")

    res = query.range(offset, offset + limit - 1).execute()
    return {
        "success": True,
        "count": len(res.data) if res.data else 0,
        "data": res.data or []
    }


@router.get("/stats")
def get_jobs_stats():
    """Retorna estadísticas agregadas de ofertas activas por comuna y sector."""
    db = get_supabase()
    res = db.table("job_postings").select("location, sector, job_type").eq("status", "active").execute()
    jobs = res.data or []

    by_location = {}
    by_sector = {}
    by_type = {}

    for j in jobs:
        loc = j.get("location") or "Punta Arenas"
        sec = j.get("sector") or "Otros"
        jt = j.get("job_type") or "Indefinido"

        by_location[loc] = by_location.get(loc, 0) + 1
        by_sector[sec] = by_sector.get(sec, 0) + 1
        by_type[jt] = by_type.get(jt, 0) + 1

    return {
        "total_active": len(jobs),
        "by_location": by_location,
        "by_sector": by_sector,
        "by_type": by_type
    }
