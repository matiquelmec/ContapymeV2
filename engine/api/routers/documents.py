import os
import traceback
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

@router.get("/generate")
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
            .maybe_single() \
            .execute()

        emp = result.data
        if not emp:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
            
        org = emp.get('organizations', {})
        if isinstance(org, list) and len(org) > 0:
            org = org[0]
        
        # Fallback: si por alguna razón PostgREST no lo anidó bien, usamos el ID directo
        org_id = org.get('id') or emp.get('organization_id')
        print(f"🔹 PROCESANDO DOC: Emp={employee_id} | Org={org_id}")
        
        # 2. Cargar parámetros legales (Rep Legal)
        settings = {}
        if org_id:
            settings_res = db.table("organization_payroll_settings").select("*").eq("organization_id", org_id).maybe_single().execute()
            settings = settings_res.data or {}
            print(f"✅ SETTINGS CARGADOS: {settings.get('rep_legal_nombre', 'SIN NOMBRE')}")
        else:
            print("⚠️ ADVERTENCIA: No se detectó Org ID para el empleado.")

        # 3. Lógica "Inteligente": Transformación de datos (UPGRADE CLASE MUNDIAL)
        def to_words(amount):
            if not amount: return "CERO PESOS"
            try: return f"{num2words(int(amount), lang='es').upper()} PESOS"
            except: return "MONTO NO ESPECIFICADO"

        def format_clp(amount):
            return f"${int(amount or 0):,.0f}".replace(",", ".")

        sueldo_base = emp.get('sueldo_base', 0)
        colacion = emp.get('asignacion_colacion', 0)
        movilizacion = emp.get('asignacion_movilizacion', 0)
        
        def format_date_cl(date_val):
            if not date_val: return "NO ESPECIFICADA"
            try:
                if isinstance(date_val, str):
                    d = datetime.strptime(date_val[:10], "%Y-%m-%d")
                else:
                    d = date_val
                meses_cl = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
                return f"{d.day} de {meses_cl[d.month-1]} de {d.year}"
            except:
                return str(date_val)

        def clean_rut(r):
            if not r: return ""
            r = r.replace(".", "").replace("-", "").replace(" ", "").upper()
            if len(r) > 1:
                body = r[:-1]
                dv = r[-1]
                try:
                    formatted_body = "{:,}".format(int(body)).replace(",", ".")
                    return f"{formatted_body}-{dv}"
                except: return r
            return r

        def safe_upper(v, default=""):
            if v is None: return default.upper()
            return str(v).upper()

        # Lógica de Gratificación Legal (Art. 47)
        if emp.get('gratificacion_legal', True):
            clausula_gratificacion = "EL EMPLEADOR PAGARÁ AL TRABAJADOR LA GRATIFICACIÓN LEGAL EN LA MODALIDAD DEL ARTÍCULO 47 DEL CÓDIGO DEL TRABAJO, ESTO ES, EL 25% DE LO DEVENGADO POR CONCEPTO DE REMUNERACIONES MENSUALES, CON TOPE DE 4,75 INGRESOS MÍNIMOS MENSUALES."
        else:
            clausula_gratificacion = "LA GRATIFICACIÓN NO ESTÁ PACTADA BAJO LA MODALIDAD LEGAL DEL ARTÍCULO 47."

        # Lógica de Duración (PLAZO FIJO vs INDEFINIDO)
        tipo = emp.get('tipo_contrato', 'indefinido')
        if tipo == 'plazo_fijo' and emp.get('fecha_termino'):
            duracion_texto = f"EL PRESENTE CONTRATO TENDRÁ UNA DURACIÓN HASTA EL DÍA {format_date_cl(emp.get('fecha_termino')).upper()}."
        else:
            duracion_texto = "EL PRESENTE CONTRATO TENDRÁ UNA DURACIÓN INDEFINIDA."

        fecha_legal = format_date_cl(date.today())

        # 4. Contexto para la plantilla (PROFESIONAL Y COMPLETO)
        context = {
            'EMPRESA_NOMBRE': safe_upper(org.get('nombre'), 'EMPRESA NO REGISTRADA'),
            'EMPRESA_RUT': clean_rut(org.get('rut_empresa', '')),
            'EMPRESA_DIRECCION': safe_upper(org.get('direccion'), 'DIRECCION NO REGISTRADA'),
            'EMPRESA_GIRO': safe_upper(org.get('giro'), 'ACTIVIDADES DE CONTABILIDAD'),
            'CIUDAD': safe_upper(org.get('comuna'), 'PUNTA ARENAS'),
            
            'REP_LEGAL_NOMBRE': safe_upper(settings.get('rep_legal_nombre') or settings.get('rep_nombre'), ''),
            'REP_LEGAL_RUT': clean_rut(settings.get('rep_legal_rut') or settings.get('rep_rut', '')),
            'REP_LEGAL_CARGO': safe_upper(settings.get('rep_legal_cargo') or settings.get('rep_cargo'), 'GERENTE GENERAL'),
            
            'EMPLEADO_NOMBRE': f"{emp.get('nombres', '')} {emp.get('apellido_paterno', '')} {emp.get('apellido_materno', '')}".strip().upper(),
            'EMPLEADO_NOMBRES': safe_upper(emp.get('nombres')),
            'EMPLEADO_RUT': clean_rut(emp.get('rut', '')),
            'EMPLEADO_NACIONALIDAD': safe_upper(emp.get('nacionalidad'), 'CHILENA'),
            'EMPLEADO_ESTADO_CIVIL': safe_upper(emp.get('estado_civil'), 'SOLTERO(A)'),
            'EMPLEADO_FECHA_NAC': format_date_cl(emp.get('birth_date')),
            'EMPLEADO_DIRECCION': safe_upper(emp.get('address') or emp.get('direccion'), 'DOMICILIO CONOCIDO'),
            'EMPLEADO_COMUNA': safe_upper(emp.get('city'), 'PUNTA ARENAS'),
            'EMPLEADO_REGION': safe_upper(emp.get('region'), 'MAGALLANES'),
            
            'FECHA_INGRESO': format_date_cl(emp.get('fecha_ingreso')),
            'DURACION_TEXTO': duracion_texto.upper(),
            'CARGO': safe_upper(emp.get('cargo'), 'TRABAJADOR'),
            'AREA': safe_upper(emp.get('departamento'), 'OPERACIONES'),
            'DESCRIPCION_CARGO': description or emp.get('descripcion_cargo') or 'FUNCIONES PROPIAS DEL CARGO.',
            
            'SUELDO_BASE': format_clp(sueldo_base),
            'SUELDO_PALABRAS': to_words(sueldo_base),
            'GRATIFICACION_CLAUSULA': clausula_gratificacion.upper(),
            
            'COLACION_MONTO': format_clp(colacion),
            'COLACION_PALABRAS': to_words(colacion),
            'MOVILIZACION_MONTO': format_clp(movilizacion),
            'MOVILIZACION_PALABRAS': to_words(movilizacion),
            
            'HORAS_SEMANALES': emp.get('horas_semanales', 42),
            'HORARIO': safe_upper(emp.get('horario_detalle'), 'JORNADA ORDINARIA LEGAL'),
            'PREVISION_SALUD': safe_upper(emp.get('prevision_salud'), 'FONASA'),
            'AFP': safe_upper(emp.get('afp'), 'HABITAT'),
            'AFC_ACTIVO': 'SI' if emp.get('afc_active') else 'NO',
            'FECHA_ACTUAL': fecha_legal.upper()
        }

        # 5. Cargar y renderizar plantilla dinámica
        template_name = "contrato_base.docx" if type == "contrato" else "anexo_base.docx"
        template_path = os.path.join(TEMPLATES_DIR, template_name)
        abs_path = os.path.abspath(template_path)
        print(f"📄 CARGANDO PLANTILLA: {abs_path}")
        
        # Validación de "frescura": ¿tiene los tags nuevos?
        try:
            from docx import Document
            test_doc = Document(template_path)
            full_text = "".join([p.text for p in test_doc.paragraphs])
            for t in test_doc.tables:
                for r in t.rows:
                    for c in r.cells:
                        full_text += c.text
            print(f"🔍 PLACEHOLDER CHECK 'p.p.': {'p.p.' in full_text}")
        except Exception as e:
            print(f"❌ Error validando plantilla: {e}")
            
        if not os.path.exists(template_path):
             # Si no existe, generamos el anexo base también si es necesario
             raise HTTPException(status_code=500, detail=f"Plantilla {template_name} no encontrada. Ejecute generate_docx_template.py primero.")

        doc = DocxTemplate(template_path)
        doc.render(context)

        mem_file = BytesIO()
        doc.save(mem_file)
        mem_file.seek(0)
        
        nombre_archivo = f"{type.capitalize()}_{emp.get('apellido_paterno')}.docx".replace(" ", "_")

        # 6. Registro Inteligente en DB (Idempotencia / No Duplicados)
        try:
            # Formatear fecha_inicio para que el DB la acepte sin quejas
            fecha_str = str(emp.get('fecha_ingreso') or date.today())[:10]
            
            # 🧠 Log de depuración para confirmar el ID de organización
            print(f"📊 Intentando registrar en Kardex para Org: {org_id}")
            
            if not org_id:
                raise ValueError("No se pudo identificar la ID de la organización para el registro en Kardex.")

            # Buscamos si ya emitimos este tipo de documento para este trabajador con esta fecha
            try:
                res = db.table("employment_contracts") \
                    .select("id") \
                    .eq("employee_id", employee_id) \
                    .eq("tipo_documento", type) \
                    .eq("fecha_inicio", fecha_str) \
                    .maybe_single() \
                    .execute()
                existing_data = res.data if res else None
            except:
                existing_data = None

            contract_record = {
                "organization_id": org_id,
                "employee_id": employee_id,
                "tipo_documento": type,
                "tipo_contrato": str(emp.get('tipo_contrato') or 'indefinido'),
                "fecha_inicio": fecha_str,
                "sueldo_base": int(sueldo_base or 0),
                "cargo": str(emp.get('cargo') or 'Trabajador').upper(),
                "descripcion_cargo": str(description or emp.get('descripcion_cargo') or ''),
                "status": "generado"
            }

            if existing_data:
                # Actualizamos el registro existente para no ensuciar el Kardex
                db.table("employment_contracts") \
                    .update(contract_record) \
                    .eq("id", existing_data['id']) \
                    .execute()
            else:
                # Nuevo registro solo si es la primera vez
                db.table("employment_contracts").insert(contract_record).execute()
            
            print("✅ Registro en Kardex completado con éxito.")
                
        except Exception as db_err:
            error_msg = f"⚠️ Fallo Kardex: {str(db_err)}"
            print(error_msg)
            # Log con ruta absoluta para Windows
            log_path = r"c:\Users\Matías Riquelme\Desktop\Contapymepuq\engine\kardex_debug.log"
            with open(log_path, "a", encoding='utf-8') as f:
                f.write(f"[{datetime.now()}] {error_msg}\n")
                f.write(f"Record: {contract_record if 'contract_record' in locals() else 'N/A'}\n")

        return StreamingResponse(
            iter([mem_file.getvalue()]), 
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
            headers={'Content-Disposition': f'attachment; filename="{nombre_archivo}"'}
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en el motor inteligente: {str(e)}")

@router.get("/generate-annex")
async def generate_annex(mod_id: str):
    """
    Generador de Anexos Profesional con Blindaje de Resiliencia.
    Diferencia cambios y construye un contexto legal a prueba de fallos.
    """
    db = get_supabase()
    
    # ──── 1. CONSULTA DE MODIFICACIÓN ────
    try:
        mod_res = db.table("contract_modifications").select("*").eq("id", mod_id).single().execute()
        mod = mod_res.data
        if not mod: raise HTTPException(status_code=404, detail="Modificación no encontrada")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error consultando rastro: {str(e)}")

    employee_id = mod.get('employee_id')
    org_id = mod.get('organization_id')

    # ──── 2. CONSULTA DE EMPLEADO (RESILIENTE) ────
    try:
        emp_res = db.table("employees").select("*").eq("id", employee_id).single().execute()
        emp = emp_res.data or {}
    except Exception:
        emp = {"nombres": "EMPLEADO", "apellido_paterno": "DESCONOCIDO"}

    # ──── 3. CONSULTA DE EMPRESA Y SETTINGS (RESILIENTE) ────
    try:
        org_res = db.table("organizations").select("*").eq("id", org_id).single().execute()
        org = org_res.data or {}
    except Exception:
        org = {"nombre": "EMPRESA NO IDENTIFICADA"}

    try:
        settings_res = db.table("organization_payroll_settings").select("*").eq("organization_id", org_id).maybe_single().execute()
        settings = settings_res.data or {}
    except Exception:
        settings = {"rep_legal_nombre": "REPRESENTANTE LEGAL NO CONFIGURADO"}

    # ──── 4. FORMATEADORES MAESTROS ────
    def to_words(amount):
        if not amount: return "CERO PESOS"
        try: return f"{num2words(int(amount), lang='es').upper()} PESOS"
        except: return str(amount)

    def format_clp(amount):
        try: return f"${int(amount or 0):,.0f}".replace(",", ".")
        except: return "$0"

    def clean_rut(r):
        if not r: return "RUT NO DISPONIBLE"
        r = r.replace(".", "").replace("-", "").replace(" ", "").upper()
        if len(r) > 1:
            body, dv = r[:-1], r[-1]
            try: return f"{int(body):,}-{dv}".replace(",", ".")
            except: return r
        return r

    def format_date_cl(date_val):
        if not date_val: return "NO ESPECIFICADA"
        try:
            d = datetime.strptime(date_val[:10], "%Y-%m-%d") if isinstance(date_val, str) else date_val
            meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
            return f"{d.day} de {meses[d.month-1]} de {d.year}"
        except: return str(date_val)

    # ──── 5. LÓGICA DE REDACCIÓN (MULTI-CAMBIO) ────
    changes = mod.get('changes', {})
    old_values = mod.get('old_values', {})
    clausulas = []
    
    for key, new_val in changes.items():
        old_val = old_values.get(key, "A DEFINIR")
        if key == 'sueldo_base':
            txt = f"EL SUELDO BASE, EL CUAL ASCENDÍA A {format_clp(old_val)} ({to_words(old_val)}), SE MODIFICA FIJÁNDOSE A CONTAR DE ESTA FECHA EN LA SUMA DE {format_clp(new_val)} ({to_words(new_val)}) MENSUALES."
        elif key == 'horas_semanales':
            txt = f"LA JORNADA LABORAL SE MODIFICA, PASANDO DE {old_val} HORAS SEMANALES A UNA NUEVA JORNADA DE {new_val} HORAS SEMANALES."
        elif key == 'cargo':
            txt = f"EL TRABAJADOR PASARÁ A DESEMPEÑAR EL CARGO DE '{str(new_val).upper()}', DEJANDO LA FUNCIÓN ANTERIOR DE '{str(old_val).upper()}'."
        elif key == 'tipo_contrato':
            mapping = {
                'plazo_fijo': 'PLAZO FIJO',
                'indefinido': 'INDEFINIDO',
                'por_obra_o_faena': 'POR OBRA O FAENA'
            }
            old_t = mapping.get(old_val, str(old_val).upper())
            new_t = mapping.get(new_val, str(new_val).upper())
            txt = f"LA NATURALEZA DE LA DURACIÓN DEL CONTRATO SE MODIFICA, PASANDO DE UN CONTRATO DE {old_t} A UN CONTRATO DE DURACIÓN {new_t}."
        elif key == 'custom_clause':
            txt = str(new_val)
        else:
            txt = f"SE MODIFICA '{key.upper()}', PASANDO DE '{old_val}' A '{new_val}'."
        clausulas.append(txt.upper())

    # ──── 6. CONTEXTO DE CLASE MUNDIAL ────
    context = {
        'EMPRESA_NOMBRE': str(org.get('nombre', '')).upper(),
        'EMPRESA_RUT': clean_rut(org.get('rut_empresa', '')),
        'EMPRESA_DIRECCION': str(org.get('direccion', 'DIRECCION NO REGISTRADA')).upper(),
        'CIUDAD': str(org.get('comuna', 'PUNTA ARENAS')).upper(),
        'REP_LEGAL_NOMBRE': str(settings.get('rep_legal_nombre', '_________________')).upper(),
        'REP_LEGAL_RUT': clean_rut(settings.get('rep_legal_rut', '')),
        'REP_LEGAL_CARGO': str(settings.get('rep_legal_cargo', 'REPRESENTANTE LEGAL')).upper(),
        'EMPLEADO_NOMBRE': f"{emp.get('nombres')} {emp.get('apellido_paterno')}".upper(),
        'EMPLEADO_RUT': clean_rut(emp.get('rut', '')),
        'EMPLEADO_NACIONALIDAD': str(emp.get('nacionalidad', 'CHILENA')).upper(),
        'EMPLEADO_DIRECCION': str(emp.get('address') or emp.get('direccion', 'DOMICILIO CONOCIDO')).upper(),
        'FECHA_ANEXO': format_date_cl(mod.get('effective_date')),
        'CLAUSULA_MODIFICACION': " ".join(clausulas),
        'CL_VIGENCIA': "EN TODO LO NO MODIFICADO POR EL PRESENTE INSTRUMENTO, SIGUEN VIGENTES CADA UNA DE LAS CLÁUSULAS DEL CONTRATO DE TRABAJO ORIGINAL.",
        'MOTIVO_ANEXO': str(mod.get('reason', 'ACTUALIZACIÓN DE CONDICIONES CONTRACTUALES')).upper(),
        'FECHA_ACTUAL': format_date_cl(date.today()).upper()
    }

    try:
        template_path = os.path.join(TEMPLATES_DIR, "anexo_base.docx")
        if not os.path.exists(template_path):
             raise HTTPException(status_code=500, detail="Plantilla anexo_base.docx no encontrada")

        doc = DocxTemplate(template_path)
        doc.render(context)
        mem_file = BytesIO()
        doc.save(mem_file)
        mem_file.seek(0)
        
        return StreamingResponse(
            iter([mem_file.getvalue()]), 
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
            headers={'Content-Disposition': f'attachment; filename="Anexo_{emp.get("apellido_paterno")}.docx"'}
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error Crítico de Renderizado: {str(e)}")
