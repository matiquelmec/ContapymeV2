import os
from datetime import date
from docxtpl import DocxTemplate
from num2words import num2words
from core.database import get_supabase
import traceback

def test_generate(employee_id):
    db = get_supabase()
    try:
        print(f"Testing for employee_id: {employee_id}")
        result = db.table("employees") \
            .select("*, organizations(*)") \
            .eq("id", employee_id) \
            .single() \
            .execute()
        
        emp = result.data
        if not emp:
            print("Employee not found")
            return
            
        print(f"Employee found: {emp.get('nombres')}")
        org = emp.get('organizations', {})
        org_id = org.get('id')
        print(f"Org ID: {org_id}")

        settings_res = db.table("organization_payroll_settings").select("*").eq("organization_id", org_id).maybe_single().execute()
        settings = settings_res.data or {}
        print(f"Settings found: {bool(settings)}")

        sueldo_base = emp.get('sueldo_base', 0)
        print(f"Sueldo Base: {sueldo_base}")
        
        sueldo_palabras = f"{num2words(sueldo_base, lang='es').upper()} PESOS"
        print(f"Sueldo Palabras: {sueldo_palabras}")

        hoy = date.today()
        meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
        fecha_legal = f"{hoy.day} de {meses[hoy.month-1]} de {hoy.year}"
        
        context = {
            'EMPRESA_NOMBRE': org.get('nombre', 'Empresa no registrada').upper(),
            'EMPRESA_RUT': org.get('rut_empresa', ''),
            'EMPRESA_DIRECCION': org.get('direccion', '').upper(),
            'CIUDAD': org.get('comuna', 'Punta Arenas').upper(),
            'REP_LEGAL_NOMBRE': settings.get('rep_legal_nombre', '').upper(),
            'REP_LEGAL_RUT': settings.get('rep_legal_rut', ''),
            'REP_LEGAL_CARGO': settings.get('rep_legal_cargo', 'GERENTE GENERAL').upper(),
            'EMPLEADO_NOMBRE': f"{emp.get('nombres', '')} {emp.get('apellido_paterno', '')}".strip().upper(),
            'EMPLEADO_RUT': emp.get('rut', ''),
            'EMPLEADO_DIRECCION': (emp.get('direccion', '') or 'DOMICILIO CONOCIDO').upper(),
            'FECHA_INGRESO': str(emp.get('fecha_ingreso', '')),
            'CARGO': emp.get('cargo', 'Trabajador').upper(),
            'SUELDO_BASE': str(sueldo_base),
            'SUELDO_PALABRAS': sueldo_palabras,
            'FECHA_ACTUAL': fecha_legal
        }
        
        print(f"Context prepared: {list(context.keys())}")
        
        templates_dir = os.path.join(os.getcwd(), 'templates')
        template_path = os.path.join(templates_dir, 'contrato_base.docx')
        
        print(f"Checking template at: {template_path}")
        if not os.path.exists(template_path):
            print("Template file not found!")
            return

        doc = DocxTemplate(template_path)
        doc.render(context)
        print("Render successful")
        
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    test_generate("029401ff-7fae-4a47-b5d0-c36d94012abb")
