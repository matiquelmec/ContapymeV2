import os
import re
from datetime import date
from io import StringIO
from fastapi import APIRouter, HTTPException, Depends
from core.database import get_supabase
from core.utils.shared_utils import split_rut
from fastapi.responses import StreamingResponse
from core.auth import verify_token, verify_org_role

router = APIRouter()

# Códigos AFP según Tabla N°10 oficial Previred (sin cero líder)
AFP_CODES = {
    'CAPITAL': '33',
    'CUPRUM': '3',
    'HABITAT': '5',
    'MODELO': '34',
    'PLANVITAL': '29',
    'PROVIDA': '8',
    'UNO': '35'
}

# Códigos Vigentes de Instituciones de Salud (Isapres Previred - Tabla 16 sin cero líder)
ISAPRE_CODES = {
    'BANMEDICA': '1',
    'CONSALUD': '2',
    'VIDATRES': '3',
    'COLMENA': '4',
    'CRUZBLANCA': '5',
    'MASVIDA': '10',
    'NUEVA MASVIDA': '10',
    'FONASA': '7'
}

def clean_text(text: str) -> str:
    """Elimina acentos y caracteres especiales para cumplir con validador Previred."""
    if not text: return ""
    text = text.upper()
    replacements = (
        ("Á", "A"), ("É", "E"), ("Í", "I"), ("Ó", "O"), ("Ú", "U"),
        ("Ñ", "N"), ("Ä", "A"), ("Ë", "E"), ("Ï", "I"), ("Ö", "O"), ("Ü", "U"),
    )
    for a, b in replacements:
        text = text.replace(a, b)
    return re.sub(r'[^A-Z0-9 ]', '', text).strip()

@router.get("/export-previred/{organization_id}")
async def export_previred(
    organization_id: str, 
    periodo: str,
    current_user: dict = Depends(verify_token)
):
    """
    Genera el archivo plano ROBUSTO (CSV delimitado por ;) de 105 campos.
    Basado en el estándar oficial Previred de carga masiva 2025/2026.
    """
    await verify_org_role(organization_id, auth=current_user)
    db = get_supabase()

    # 1. Mapeos de Códigos Oficiales Previred (Tablas de Referencia)
    MUTUAL_MAP = {
        'ACHS': '1', 'ASOCIACION CHILENA DE SEGURIDAD': '1',
        'MUTUAL': '2', 'MUTUAL DE SEGURIDAD': '2', 'CChC': '2',
        'IST': '3', 'INSTITUTO DE SEGURIDAD DEL TRABAJO': '3',
        'ISL': '4', 'INSTITUTO DE SEGURIDAD LABORAL': '4'
    }

    CCAF_MAP = {
        'LOS ANDES': '01', 'CAJA LOS ANDES': '01',
        'LA ARAUCANA': '02', 'ARAUCANA': '02',
        '18 DE SEPTIEMBRE': '03', 'SEPTIEBRE': '03',
        'GABRIELA MISTRAL': '04'
    }

    try:
        # 2. Obtener ajustes de la organización (Mutual, CCAF)
        settings_res = db.table("organization_payroll_settings") \
            .select("mutual_code, caja_compensacion_code") \
            .eq("organization_id", organization_id) \
            .maybe_single() \
            .execute()
        
        org_settings = settings_res.data or {}
        
        # Resolver código Mutual
        raw_mutual = (org_settings.get('mutual_code') or "ACHS").upper()
        mutual_code = MUTUAL_MAP.get(raw_mutual, "1")
        
        # Resolver código CCAF
        raw_ccaf = (org_settings.get('caja_compensacion_code') or "00").upper()
        ccaf_code = CCAF_MAP.get(raw_ccaf, raw_ccaf if raw_ccaf.isdigit() else "00")

        # 3. Obtener liquidaciones
        result = db.table("liquidations") \
            .select("*, employees(*)") \
            .eq("organization_id", organization_id) \
            .eq("periodo", periodo) \
            .execute()

        liquidations = result.data or []
        if not liquidations:
            raise HTTPException(status_code=404, detail=f"No hay liquidaciones para {periodo}")

        output = StringIO()
        y, m = periodo.split("-")[:2]
        p_format = f"{m}{y}"

        for liq in liquidations:
            emp = liq.get('employees', {})
            rut_body, rut_dv = split_rut(emp.get('rut', ''))
            
            # ──────────────────────────────────────────────────────────────────
            # LÓGICA DE ROBUSTEZ: FALLBACK DE IMPONIBLE
            # ──────────────────────────────────────────────────────────────────
            imponible = int(liq.get('base_imponible_afp', 0))
            
            # Si el imponible es 0 pero hay descuento AFP, lo recuperamos
            afp_monto = int(liq.get('afp', 0))
            if imponible == 0 and afp_monto > 0:
                # Fallback 1: Usar total haberes brutos menos no imponibles aproximados
                haberes = int(liq.get('total_haberes_brutos', 0))
                no_imponibles = int(liq.get('asignacion_colacion', 0)) + int(liq.get('asignacion_movilizacion', 0))
                imponible = haberes - no_imponibles
                
                # Fallback 2: Si sigue siendo dudoso, deducirlo del 10% de AFP (aproximado)
                if imponible <= 0:
                    imponible = int(afp_monto / 0.11)

            imponible_salud = int(liq.get('base_imponible_salud', 0) or imponible)
            
            # ──────────────────────────────────────────────────────────────────
            # CONSTRUCCIÓN DE LOS 105 CAMPOS (STRICT POSITIONAL)
            # ──────────────────────────────────────────────────────────────────
            fields = [""] * 105
            
            # 01-14: Identificación
            fields[0] = rut_body
            fields[1] = rut_dv
            fields[2] = clean_text(emp.get('apellido_paterno', ''))
            fields[3] = clean_text(emp.get('apellido_materno', ''))
            fields[4] = clean_text(emp.get('nombres', ''))
            fields[5] = "M" 
            fields[6] = "0" 
            fields[7] = "01" 
            fields[8] = p_format
            fields[9] = p_format
            fields[10] = "AFP"
            fields[11] = "0"
            fields[12] = str(liq.get('dias_trabajados', 30))
            fields[13] = "00"
            
            # 15-25: Movimientos
            fields[14] = "0" 
            fields[17] = "D" # Tramo Asignación Familiar
            fields[18] = str(emp.get('cargas_familiares', 0))
            fields[21] = str(int(liq.get('asignacion_familiar', 0)))

            # 26-61: Previsión (AFP)
            afp_nom = (emp.get('afp') or "MODELO").upper()
            fields[25] = AFP_CODES.get(afp_nom, "34") 
            fields[26] = str(imponible)               # Campo 27: Renta Imponible AFP
            fields[27] = str(afp_monto)               # Campo 28: Cotización Obligatoria
            fields[28] = str(int(liq.get('sis_empresa', 0) or liq.get('seguro_invalidez', 0))) # Campo 29
            fields[30] = str(int(liq.get('afp_comision', 0))) # Campo 31: Comisión AFP

            # 62-81: Instituciones de Salud (Isapre / Fonasa)
            salud_nom = (emp.get('prevision_salud') or "FONASA").upper()
            is_fonasa = "FONASA" in salud_nom
            
            if is_fonasa:
                fields[74] = "7" # Tasa Fonasa
                fields[63] = str(imponible_salud)
                fields[69] = str(int(liq.get('salud', 0))) 
            else:
                # Isapre Map Oficial Previred
                isapre_code = ISAPRE_CODES.get(salud_nom, "1") # Default Banmedica
                plan_uf = float(emp.get('plan_salud_uf', 0) or liq.get('calculo_snapshot', {}).get('plan_salud_uf', 0))
                
                fields[62] = isapre_code                  # Campo 63: Código Institución Salud
                fields[64] = str(imponible_salud)         # Campo 65: Renta Imponible Salud
                fields[65] = "2" if plan_uf > 0 else "1"  # Campo 66: Moneda (2=UF, 1=Pesos)
                
                # Formato pactado a 2 o 4 decimales según Previred, sin punto
                pactado = f"{plan_uf:06.4f}".replace(".", "") if plan_uf > 0 else str(int(liq.get('salud', 0)))
                fields[66] = pactado                      # Campo 67: Cotización Pactada
                
                fields[67] = str(int(liq.get('salud', 0)))               # Campo 68: Cotización Obligatoria Legal (7%)
                fields[68] = str(int(liq.get('salud_voluntaria', 0)))    # Campo 69: Cotización Adicional Voluntaria
                fields[69] = str(int(liq.get('salud_total', 0)))         # Campo 70: Monto Total Paztado (Obl+Vol)

            # 83-95: CCAF (Caja de Compensación)
            fields[82] = ccaf_code
            fields[83] = str(imponible) if ccaf_code != "00" else "0"  # Renta Imponible CCAF
            fields[89] = fields[69] if (is_fonasa and ccaf_code != "00") else "0" # Salud vía CCAF (Solo Fonasa retiene a través de Caja)
            
            # Expectativa de Vida: 0.9% imponible (Campo 94 / index 93)
            # Solo aplica si cotiza en AFP (no IPS/SIP)
            es_sip = afp_nom in ["SIP", "IPS", ""]
            exp_vida = str(int(imponible * 0.009)) if not es_sip else "0"
            fields[93] = exp_vida

            # 96-99: Mutualidad
            # Código de mutualidad (index 95 / Campo 96)
            fields[95] = mutual_code 
            # Renta imponible mutual (index 96 / Campo 97)
            fields[96] = str(imponible) if mutual_code != "0" else "0"
            # Cotización accidentes (index 97 / Campo 98) - 0.95% tasa básica default
            fields[97] = str(int(imponible * 0.0095)) if mutual_code != "0" else "0"

            # 100-102: Seguro Cesantía (AFC)
            fields[99] = str(imponible) 
            fields[100] = str(int(liq.get('afc_trabajador', 0)))
            fields[101] = str(int(liq.get('afc_empresa', 0)))
            
            # 105: Centro de Costo (Opcional pero recomendable)
            fields[104] = "CENTRO_01"

            linea = ";".join(fields)
            output.write(f"{linea}\n")

        content = output.getvalue()
        output.close()

        # Respuesta con el nombre correcto para Punta Arenas
        filename = f"PREVIRED_{organization_id[:5]}_{periodo.replace('-', '')}.txt"
        
        return StreamingResponse(
            iter([content]), 
            media_type="text/plain", 
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

