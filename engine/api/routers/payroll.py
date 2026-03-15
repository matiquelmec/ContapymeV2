from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any
from core.database import get_supabase

router = APIRouter()

class PayrollRequest(BaseModel):
    org_id: str
    periodo: str

@router.post("/process")
async def process_payroll(req: PayrollRequest):
    """
    Endpoint del Motor Matemático para procesar liquidaciones en lote.
    """
    db = get_supabase()
    
    try:
        # 1. Traer empleados de la empresa
        employees_res = db.table("employees").select("*").eq("organization_id", req.org_id).eq("activo", True).execute()
        
        employees = employees_res.data
        if not employees:
            return {"success": True, "processed_count": 0, "message": "No hay empleados activos"}
            
        processed_count = 0
        
        # 2. Calcular liquidaciones para cada empleado
        for emp in employees:
            sueldo_base = emp.get("sueldo_base", 0)
            
            # TODO: Fase 4.5. Implementar el Motor Real de Cálculo AFP/Salud/Impuesto Único aquí
            # Por ahora, usamos una simulación lógica del esqueleto
            gratificacion = (sueldo_base * 0.25) if emp.get("gratificacion_legal") else 0
            # Tope legal gratificación ~ 193.000 (para simplificar V2 demostrativa no lo topamos acá aún)
            total_imponible = sueldo_base + gratificacion
            
            afp_cl = 0.10  # Simplificación
            salud_cl = 0.07 # Fonasa
            
            total_descuentos = (total_imponible * afp_cl) + (total_imponible * salud_cl)
            liquido = total_imponible - total_descuentos
            
            # 3. Guardar Liquidación en DataBase
            liq_data = {
                "organization_id": req.org_id,
                "employee_id": emp["id"],
                "periodo": req.periodo,
                "sueldo_base": int(sueldo_base),
                "total_haberes_brutos": int(total_imponible),
                "afp": int(total_imponible * afp_cl),
                "salud": int(total_imponible * salud_cl),
                "impuesto_unico": 0, 
                "total_descuentos": int(total_descuentos),
                "sueldo_liquido": int(liquido),
                "status": "borrador"
            }
            
            # Upsert para no duplicar si se procesa el mes dos veces
            # Dependiendo de la lógica de Primary Keys, podemos hacer insert o select previo
            exist_liq = db.table("liquidations").select("id").eq("employee_id", emp["id"]).eq("periodo", req.periodo).execute()
            if exist_liq.data:
                # Update
                db.table("liquidations").update(liq_data).eq("id", exist_liq.data[0]["id"]).execute()
            else:
                # Insert
                db.table("liquidations").insert(liq_data).execute()
                
            processed_count += 1

        return {
            "success": True, 
            "processed_count": processed_count,
            "message": "Nómina procesada"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
