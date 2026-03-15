from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import io
from core.database import get_supabase

router = APIRouter()

class LREGenerateRequest(BaseModel):
    organization_id: str
    periodo: str  # YYYY-MM
    company_name: str
    company_rut: str

@router.get("/list")
async def list_lre(organization_id: str):
    db = get_supabase()
    try:
        res = db.table("payroll_books").select("*").eq("organization_id", organization_id).order("periodo", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate")
async def generate_lre(req: LREGenerateRequest):
    db = get_supabase()
    org_id = req.organization_id
    periodo_str = f"{req.periodo}-01"
    
    # 1. Traer liquidaciones del periodo
    # En V2 la tabla liquidations usa 'periodo' como date
    liq_res = db.table("liquidations").select("*, employees(*)").eq("organization_id", org_id).eq("periodo", periodo_str).execute()
    liquidations = liq_res.data
    
    if not liquidations:
        raise HTTPException(status_code=404, detail="No se encontraron liquidaciones para este periodo. Procéselas primero.")

    # 2. Traer configuración de la empresa (Rep Legal, etc)
    settings_res = db.table("organization_payroll_settings").select("*").eq("organization_id", org_id).execute()
    settings = settings_res.data[0] if settings_res.data else {}

    # 3. Traer contratos para fechas de inicio/cargo
    contracts_res = db.table("employment_contracts").select("*").eq("organization_id", org_id).execute()
    contracts_map = {c["employee_id"]: c for c in contracts_res.data}

    # 4. Crear el Libro (Payroll Book)
    # Primero ver si existe y borrarlo (idempotencia)
    db.table("payroll_books").delete().eq("organization_id", org_id).eq("periodo", periodo_str).execute()

    total_haberes = sum(l.get("total_haberes_brutos", 0) for l in liquidations)
    total_descuentos = sum(l.get("total_descuentos", 0) for l in liquidations)
    total_liquido = sum(l.get("sueldo_liquido", 0) for l in liquidations)

    new_book_res = db.table("payroll_books").insert({
        "organization_id": org_id,
        "periodo": periodo_str,
        "book_number": 1, # TODO: Incrementar
        "company_name": req.company_name,
        "company_rut": req.company_rut,
        "status": "draft",
        "total_employees": len(liquidations),
        "total_haberes": total_haberes,
        "total_descuentos": total_descuentos,
        "total_liquido": total_liquido
    }).execute()
    
    book_id = new_book_res.data[0]["id"]

    # 5. Generar Detalles y Guardar
    details = []
    for liq in liquidations:
        emp = liq.get("employees", {})
        contract = contracts_map.get(emp.get("id"), {})
        
        detail = {
            "payroll_book_id": book_id,
            "employee_id": emp.get("id"),
            "employee_rut": emp.get("rut"),
            "apellido_paterno": emp.get("apellido_paterno"),
            "apellido_materno": emp.get("apellido_materno"),
            "nombres": emp.get("nombres"),
            "cargo": emp.get("cargo") or contract.get("cargo"),
            "area": emp.get("departamento") or contract.get("department") or "General",
            "centro_costo": "GENERAL",
            "dias_trabajados": 30, # Default
            "sueldo_base": liq.get("sueldo_base", 0),
            "gratificacion_legal": int(liq.get("sueldo_base", 0) * 0.25) if emp.get("gratificacion_legal") else 0,
            "colacion": liq.get("bono_colacion", 0),
            "movilizacion": liq.get("bono_movilizacion", 0),
            "total_haberes_brutos": liq.get("total_haberes_brutos", 0),
            "descuento_afp": liq.get("afp", 0),
            "descuento_salud": liq.get("salud", 0),
            "impuesto_unico": liq.get("impuesto_unico", 0),
            "total_descuentos": liq.get("total_descuentos", 0),
            "sueldo_liquido": liq.get("sueldo_liquido", 0)
        }
        details.append(detail)
    
    db.table("payroll_book_details").insert(details).execute()

    return {"success": True, "book_id": book_id, "message": "LRE Generado"}

@router.get("/export/{book_id}")
async def export_lre(book_id: str):
    db = get_supabase()
    
    # Traer cabecera y detalles
    book_res = db.table("payroll_books").select("*").eq("id", book_id).single().execute()
    book = book_res.data
    
    details_res = db.table("payroll_book_details").select("*").eq("payroll_book_id", book_id).execute()
    details = details_res.data

    if not book or not details:
        raise HTTPException(status_code=404, detail="Libro no encontrado")

    # 147 Headers exactos (abreviados aquí por espacio pero representativos)
    # En producción real usaríamos la lista completa obtenida de V1
    headers = [
        'Rut trabajador(1101)', 'Fecha inicio contrato(1102)', 'Fecha término de contrato(1103)',
        'Causal término de contrato(1104)', 'Región prestación de servicios(1105)', 'Comuna prestación de servicios(1106)',
        'Sueldo(2101)', 'Sobresueldo(2102)', 'Comisiones(2103)', 'Gratificación(2106)',
        'Colación(2301)', 'Movilización(2302)', 'Asignación familiar legal(2311)',
        'Cotización obligatoria previsional (AFP o IPS)(3141)', 'Cotización obligatoria salud 7%(3143)',
        'Impuesto retenido por remuneraciones(3161)', 'Total haberes(5201)', 'Total descuentos(5301)', 'Total líquido(5501)'
    ]
    
    # Nota: El LRE real tiene 147 columnas separadas por ';'. 
    # Por ahora generamos un CSV con las columnas que tenemos mapeadas.
    
    rows = []
    for d in details:
        row = [
            d["employee_rut"].replace(".","").replace("-","").lower(), # RUT limpio
            "01/01/2024", # Dummy start date if not found
            "", # End date
            "", # Causal
            "12", # Región Magallanes
            "12101", # Comuna Punta Arenas
            d["sueldo_base"],
            0, # Sobresueldo
            0, # Comisiones
            d["gratificacion_legal"],
            d["colacion"],
            d["movilizacion"],
            0, # Asignación familiar
            d["descuento_afp"],
            d["descuento_salud"],
            d["impuesto_unico"],
            d["total_haberes_brutos"],
            d["total_descuentos"],
            d["sueldo_liquido"]
        ]
        rows.append(";".join(map(str, row)))

    csv_content = "\uFEFF" + ";".join(headers) + "\n" + "\n".join(rows)
    
    filename = f"LRE_{book['periodo']}.csv"
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
