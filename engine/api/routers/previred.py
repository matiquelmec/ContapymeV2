import os
from datetime import date
from io import StringIO
from fastapi import APIRouter, HTTPException
from core.database import get_supabase
from fastapi.responses import StreamingResponse

router = APIRouter()

@router.get("/export-previred/{organization_id}")
async def export_previred(organization_id: str, periodo: str):
    """
    Genera un archivo plano (TXT) en formato de carga masiva para PREVIRED.
    Formato simplificado de 105 campos (campos clave para validación).
    """
    db = get_supabase()

    try:
        # 1. Obtener liquidaciones y datos de empleados
        # Período esperado: 'YYYY-MM-01'
        result = db.table("liquidations") \
            .select("*, employees(*)") \
            .eq("organization_id", organization_id) \
            .eq("periodo", periodo) \
            .execute()

        liquidations = result.data
        if not liquidations:
            raise HTTPException(status_code=404, detail="No se encontraron liquidaciones para este período")

        # 2. Generar contenido del archivo TXT (Fixed Width)
        # Previred requiere campos específicos. Aquí simulamos el formato estándar:
        # RUT (10) | Nombre (30) | Haberes (10) | AFP (10) | Salud (10) ...
        
        output = StringIO()
        
        for liq in liquidations:
            emp = liq.get('employees', {})
            rut = emp.get('rut', '').replace('.', '').replace('-', '').zfill(10)
            nombre = f"{emp.get('apellido_paterno', '')} {emp.get('nombres', '')}"[:30].ljust(30)
            
            # Montos (enteros sin puntos ni comas, rellenados con ceros)
            haberes = str(int(liq.get('total_haberes_brutos', 0))).zfill(12)
            afp_monto = str(int(liq.get('afp', 0))).zfill(12)
            salud_monto = str(int(liq.get('salud', 0))).zfill(12)
            
            # Construir la línea (Esto es una simplificación, Previred real tiene cientos de columnas)
            linea = f"{rut}{nombre}{haberes}{afp_monto}{salud_monto}\n"
            output.write(linea)
            
        content = output.getvalue()
        output.close()

        # 3. Preparar respuesta
        filename = f"remuneraciones_previred_{periodo}.txt"
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"'
        }
        
        return StreamingResponse(
            iter([content]), 
            media_type="text/plain", 
            headers=headers
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando archivo Previred: {str(e)}")
