from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from core.database import get_supabase
from core.auth import verify_token, verify_org_role
import pdfplumber
import io
import re
from datetime import date
from core.utils.shared_utils import split_rut

router = APIRouter()

# Códigos invertidos para AFP
AFP_NAMES = {
    "33": "CAPITAL",
    "03": "CUPRUM",
    "3": "CUPRUM",
    "05": "HABITAT",
    "5": "HABITAT",
    "34": "MODELO",
    "29": "PLANVITAL",
    "08": "PROVIDA",
    "8": "PROVIDA",
    "35": "UNO",
}

# Códigos invertidos para ISAPRE
ISAPRE_NAMES = {
    "99": "BANMEDICA",
    "63": "CHUQUICAMATA",
    "67": "COLMENA",
    "71": "CONSALUD",
    "78": "CRUZBLANCA",
    "80": "FUSAT",
    "88": "MASVIDA",
    "81": "VIDATRES",
    "108": "ESENCIAL",
    "62": "FUNDACION",
    "7": "FONASA",
}

def clean_num(s) -> int:
    try:
        return int(str(s).replace('.', '').replace(',', '').strip())
    except Exception:
        return 0

def es_rut(s: str) -> bool:
    s = str(s).strip()
    return bool(re.match(r'^\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]$', s))

def normalizar_rut(s: str) -> str:
    s = str(s).strip().replace(' ', '')
    m = re.match(r'^(\d{1,2})\.?(\d{3})\.?(\d{3})-([\dkK])$', s, re.IGNORECASE)
    if m:
        return f"{m.group(1)}.{m.group(2)}.{m.group(3)}-{m.group(4).upper()}"
    return s

def detectar_periodo(texto: str) -> tuple:
    """Detecta el periodo en formato (mes, año)."""
    patrones = [
        r'PERIODO\s+DE\s+REMUNERACI[OÓ]N\s+(\d{2})\s+(\d{4})',
        r'Per[ií]odo\s+de\s+Remuneraciones[:\s]+(\d{2})/(\d{4})',
        r'Periodo\s+(\d{2})/(\d{4})',
    ]
    for p in patrones:
        m = re.search(p, texto, re.IGNORECASE)
        if m:
            return int(m.group(1)), int(m.group(2))
    return None

@router.post("/upload/{organization_id}")
async def upload_previred_pdf(
    organization_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(verify_token)
):
    """
    Parsea un PDF de cotizaciones Previred y crea automáticamente
    los empleados y sus liquidaciones históricas en la base de datos.
    """
    await verify_org_role(organization_id, auth=current_user)
    db = get_supabase()

    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Por favor suba un archivo PDF válido.")

    file_bytes = await file.read()
    
    try:
        by_rut = {}
        periodo = None

        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            texto_completo = "\n".join(p.extract_text() or "" for p in pdf.pages)
            periodo = detectar_periodo(texto_completo)
            
            if not periodo:
                raise HTTPException(status_code=400, detail="No se pudo detectar el periodo del PDF.")

            for page in pdf.pages:
                try:
                    tablas = page.extract_tables()
                except Exception:
                    tablas = []

                for tbl in tablas:
                    if not tbl:
                        continue
                    for row in tbl:
                        if not row:
                            continue
                        celdas = [str(c).strip() if c else '' for c in row]
                        n = len(celdas)

                        # Parseador Salud/FONASA
                        if n >= 8 and es_rut(celdas[1]):
                            rut = normalizar_rut(celdas[1])
                            ap_pat = celdas[2]
                            ap_mat = celdas[3]
                            nombres = celdas[4]
                            dias = int(celdas[5]) if celdas[5].isdigit() else 30
                            entidad = celdas[6]
                            rem = clean_num(celdas[7])
                            cotiz = clean_num(celdas[8]) if n > 8 else 0

                            if rem == 0:
                                continue

                            if rut not in by_rut:
                                by_rut[rut] = {
                                    "rut": rut,
                                    "apellido_paterno": ap_pat,
                                    "apellido_materno": ap_mat,
                                    "nombres": nombres,
                                    "dias_trabajados": dias,
                                    "sueldo_base": rem,
                                    "salud": entidad,
                                    "salud_monto": cotiz,
                                    "afp": "",
                                    "afp_monto": 0,
                                    "afc_monto": 0,
                                    "sis_monto": 0,
                                    "impuesto": 0,
                                }
                            else:
                                by_rut[rut]["sueldo_base"] = rem
                                by_rut[rut]["salud"] = entidad
                                by_rut[rut]["salud_monto"] = cotiz

                        # Parseador AFP + SIS + Cesantía
                        elif n == 15 and es_rut(celdas[0]):
                            rut = normalizar_rut(celdas[0])
                            rem = clean_num(celdas[2])
                            afp_monto = clean_num(celdas[3])
                            sis = clean_num(celdas[4])
                            afc = clean_num(celdas[10])

                            partes_nombre = celdas[1].strip().split()
                            ap_p = partes_nombre[0] if partes_nombre else ""
                            ap_m = partes_nombre[1] if len(partes_nombre) > 1 else ""
                            noms = " ".join(partes_nombre[2:]) if len(partes_nombre) > 2 else ""

                            if rut not in by_rut:
                                by_rut[rut] = {
                                    "rut": rut,
                                    "apellido_paterno": ap_p,
                                    "apellido_materno": ap_m,
                                    "nombres": noms,
                                    "dias_trabajados": 30,
                                    "sueldo_base": rem,
                                    "salud": "FONASA",
                                    "salud_monto": 0,
                                    "afp": "MODELO", # Default
                                    "afp_monto": afp_monto,
                                    "afc_monto": afc,
                                    "sis_monto": sis,
                                    "impuesto": 0,
                                }
                            else:
                                by_rut[rut]["afp_monto"] = afp_monto
                                by_rut[rut]["afc_monto"] = afc
                                by_rut[rut]["sis_monto"] = sis

        # Guardar en Base de Datos
        empleados_creados = 0
        liquidaciones_creadas = 0
        mes, anio = periodo
        periodo_date = f"{anio}-{mes:02d}-01"

        for rut, data in by_rut.items():
            # 1. Buscar o crear empleado
            emp_res = db.table("employees") \
                .select("id") \
                .eq("organization_id", organization_id) \
                .eq("rut", rut) \
                .execute()
            
            if emp_res.data:
                emp_id = emp_res.data[0]["id"]
            else:
                # Crear Ficha Empleado
                new_emp = {
                    "organization_id": organization_id,
                    "rut": rut,
                    "nombres": data["nombres"].upper(),
                    "apellido_paterno": data["apellido_paterno"].upper(),
                    "apellido_materno": data["apellido_materno"].upper(),
                    "sueldo_base": data["sueldo_base"],
                    "afp": data["afp"].upper() or "MODELO",
                    "prevision_salud": data["salud"].upper() or "FONASA",
                    "fecha_ingreso": periodo_date,
                    "activo": True,
                }
                new_emp_res = db.table("employees").insert(new_emp).execute()
                emp_id = new_emp_res.data[0]["id"]
                empleados_creados += 1

            # 2. Inyectar liquidación
            liq_data = {
                "organization_id": organization_id,
                "employee_id": emp_id,
                "periodo": periodo_date,
                "sueldo_base": data["sueldo_base"],
                "total_haberes_brutos": data["sueldo_base"],
                "base_imponible_afp": data["sueldo_base"],
                "base_imponible_salud": data["sueldo_base"],
                "afp": data["afp_monto"],
                "salud": data["salud_monto"],
                "salud_total": data["salud_monto"],
                "afc_trabajador": data["afc_monto"],
                "impuesto_unico": data["impuesto"],
                "total_descuentos": data["afp_monto"] + data["salud_monto"] + data["afc_monto"],
                "sueldo_liquido": data["sueldo_base"] - (data["afp_monto"] + data["salud_monto"] + data["afc_monto"]),
                "dias_trabajados": data["dias_trabajados"],
                "status": "borrador",
                "folio_number": f"IMP-{anio}{mes:02d}-{str(emp_id)[:8].upper()}"
            }
            
            db.table("liquidations").upsert(
                liq_data,
                on_conflict="organization_id,employee_id,periodo"
            ).execute()
            liquidations_creadas += 1

        return {
            "success": True,
            "periodo": f"{mes:02d}/{anio}",
            "empleados_creados": empleados_creados,
            "liquidaciones_creadas": liquidations_creadas,
            "message": f"Historial importado correctamente para {mes:02d}/{anio}."
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al procesar el PDF: {str(e)}")
