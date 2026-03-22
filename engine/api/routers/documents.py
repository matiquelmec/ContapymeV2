import os
from datetime import date, datetime
from io import BytesIO
from fastapi import APIRouter, HTTPException
from docxtpl import DocxTemplate
from num2words import num2words
from core.database import get_supabase
from fastapi.responses import StreamingResponse

router = APIRouter()

# Las plantillas vivirán en la carpeta engine/templates/
TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "templates")

@router.post("/generate-contract/{employee_id}")
async def generate_document(employee_id: str, type: str = "contrato", description: str = ""):
    """
    Genera un Contrato o Anexo de Trabajo inteligente.
    Convierte montos a palabras, formatea fechas legales y limpia datos.
    """
    db = get_supabase()

    try:
        # 1. Obtener datos del empleado y su empresa
        result = db.table("employees") \
            .select("*, organizations(*)") \
            .eq("id", employee_id) \
            .single() \
            .execute()

        emp = result.data
        if not emp:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
            
        org = emp.get('organizations', {})
        org_id = org.get('id')

        # 2. Cargar parámetros legales (Rep Legal)
        settings_res = db.table("organization_payroll_settings").select("*").eq("organization_id", org_id).maybe_single().execute()
        settings = settings_res.data or {}

        # 3. Lógica "Inteligente": Transformación de datos
        sueldo_base = emp.get('sueldo_base', 0)
        sueldo_formateado = f"${sueldo_base:,.0f}".replace(",", ".")
        
        try:
            sueldo_palabras = f"{num2words(sueldo_base, lang='es').upper()} PESOS"
        except:
            sueldo_palabras = "MONTO NO ESPECIFICADO"

        meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
        hoy = date.today()
        fecha_legal = f"{hoy.day} de {meses[hoy.month-1]} de {hoy.year}"
        ciudad = org.get('comuna', 'Punta Arenas').upper()

        def clean_rut(r):
            if not r: return ""
            return r.replace(".", "").replace(" ", "").upper()

        def safe_upper(v, default=""):
            if v is None: return default.upper()
            return str(v).upper()

        # 4. Contexto para la plantilla
        context = {
            'EMPRESA_NOMBRE': safe_upper(org.get('nombre'), 'Empresa no registrada'),
            'EMPRESA_RUT': clean_rut(org.get('rut_empresa', '')),
            'EMPRESA_DIRECCION': safe_upper(org.get('direccion'), 'DIRECCION NO REGISTRADA'),
            'CIUDAD': safe_upper(org.get('comuna'), 'Punta Arenas'),
            'REP_LEGAL_NOMBRE': safe_upper(settings.get('rep_legal_nombre'), ''),
            'REP_LEGAL_RUT': clean_rut(settings.get('rep_legal_rut', '')),
            'REP_LEGAL_CARGO': safe_upper(settings.get('rep_legal_cargo'), 'GERENTE GENERAL'),
            'EMPLEADO_NOMBRE': f"{emp.get('nombres', '')} {emp.get('apellido_paterno', '')} {emp.get('apellido_materno', '')}".strip().upper(),
            'EMPLEADO_RUT': clean_rut(emp.get('rut', '')),
            'EMPLEADO_NACIONALIDAD': safe_upper(emp.get('nacionalidad'), 'CHILENA'),
            'EMPLEADO_ESTADO_CIVIL': safe_upper(emp.get('estado_civil'), 'SOLTERO(A)'),
            'EMPLEADO_FECHA_NAC': str(emp.get('birth_date', '')),
            'EMPLEADO_DIRECCION': safe_upper(emp.get('address') or emp.get('direccion'), 'DOMICILIO CONOCIDO'),
            'EMPLEADO_COMUNA': safe_upper(emp.get('city'), 'PUNTA ARENAS'),
            'EMPLEADO_REGION': safe_upper(emp.get('region'), 'MAGALLANES'),
            'FECHA_INGRESO': str(emp.get('fecha_ingreso', '')),
            'CARGO': safe_upper(emp.get('cargo'), 'Trabajador'),
            'DESCRIPCION_CARGO': description or emp.get('descripcion_cargo') or 'SEGÚN SE ESTIPULA EN EL MANUAL DE FUNCIONES INTERNO.',
            'SUELDO_BASE': sueldo_formateado,
            'SUELDO_PALABRAS': sueldo_palabras,
            'HORAS_SEMANALES': emp.get('horas_semanales', 42),
            'HORARIO': safe_upper(emp.get('horario_detalle'), 'JORNADA ORDINARIA LEGAL'),
            'FECHA_ACTUAL': fecha_legal
        }

        # 5. Cargar y renderizar plantilla dinámica
        template_name = "contrato_base.docx" if type == "contrato" else "anexo_base.docx"
        template_path = os.path.join(TEMPLATES_DIR, template_name)
        
        if not os.path.exists(template_path):
             # Si no existe, generamos el anexo base también si es necesario
             raise HTTPException(status_code=500, detail=f"Plantilla {template_name} no encontrada. Ejecute generate_docx_template.py primero.")

        doc = DocxTemplate(template_path)
        doc.render(context)

        mem_file = BytesIO()
        doc.save(mem_file)
        mem_file.seek(0)
        
        nombre_archivo = f"{type.capitalize()}_{emp.get('apellido_paterno')}.docx".replace(" ", "_")

        # 6. Registrar en la base de datos que el documento fue generado
        try:
            fecha_inicio = emp.get('fecha_ingreso')
            if not fecha_inicio:
                fecha_inicio = str(hoy)
                
            contract_record = {
                "organization_id": org_id,
                "employee_id": employee_id,
                "tipo_documento": type,
                "tipo_contrato": emp.get('tipo_contrato') or 'indefinido',
                "fecha_inicio": fecha_inicio,
                "sueldo_base": sueldo_base or 0,
                "cargo": emp.get('cargo') or 'Trabajador',
                "descripcion_cargo": description or '',
                "status": "generado"
            }
            db.table("employment_contracts").insert(contract_record).execute()
        except Exception as db_err:
            print(f"⚠️ No se pudo registrar el contrato en DB: {db_err}")
            # No bloqueamos la descarga por un error de registro

        return StreamingResponse(
            iter([mem_file.getvalue()]), 
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
            headers={'Content-Disposition': f'attachment; filename="{nombre_archivo}"'}
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en el motor inteligente: {str(e)}")
