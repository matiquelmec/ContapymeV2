import re
from io import StringIO
import calendar
from datetime import date
import unicodedata

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from core.auth import verify_org_role, verify_token
from core.database import get_supabase
from core.payroll_legal_params import get_period_start, resolve_legal_payroll_params
from core.payroll_status import closed_liquidation_statuses
from core.utils.shared_utils import split_rut

router = APIRouter()

AFP_CODES = {
    "CAPITAL": "33",
    "CUPRUM": "3",
    "HABITAT": "5",
    "MODELO": "34",
    "PLANVITAL": "29",
    "PROVIDA": "8",
    "UNO": "35",
}

ISAPRE_CODES = {
    "BANMEDICA": "1",
    "CONSALUD": "2",
    "VIDATRES": "3",
    "VIDA TRES": "3",
    "COLMENA": "4",
    "CRUZBLANCA": "5",
    "CRUZ BLANCA": "5",
    "MASVIDA": "10",
    "NUEVA MASVIDA": "10",
    "NUEVAMASVIDA": "10",
    "NUEVA_MASVIDA": "10",
    "ESENCIAL": "108",
    "FONASA": "7",
}

MUTUAL_MAP = {
    "ACHS": "1",
    "ASOCIACION CHILENA DE SEGURIDAD": "1",
    "MUTUAL": "2",
    "MUTUAL DE SEGURIDAD": "2",
    "CCHC": "2",
    "IST": "3",
    "INSTITUTO DE SEGURIDAD DEL TRABAJO": "3",
    "ISL": "0",
    "INSTITUTO DE SEGURIDAD LABORAL": "0",
}

CCAF_MAP = {
    "LOS ANDES": "1",
    "CAJA LOS ANDES": "1",
    "LOSANDES": "1",
    "LA ARAUCANA": "2",
    "ARAUCANA": "2",
    "LAARAUCANA": "2",
    "LOS HEROES": "3",
    "LOSHEROES": "3",
    "18 DE SEPTIEMBRE": "6",
    "18DESEPTIEMBRE": "6",
    "GABRIELA MISTRAL": "4",
}


def safe_int(value, default: int = 0) -> int:
    if value is None or value == "":
        return default
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def safe_float(value, default: float = 0.0) -> float:
    if value is None or value == "":
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def clean_text(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFD", str(text).upper())
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = text.replace("Ñ", "N")
    return re.sub(r"[^A-Z0-9 ]", "", text).strip()
    text = text.upper()
    replacements = (
        ("Á", "A"),
        ("É", "E"),
        ("Í", "I"),
        ("Ó", "O"),
        ("Ú", "U"),
        ("Ñ", "N"),
        ("Ä", "A"),
        ("Ë", "E"),
        ("Ï", "I"),
        ("Ö", "O"),
        ("Ü", "U"),
    )
    for old, new in replacements:
        text = text.replace(old, new)
    return re.sub(r"[^A-Z0-9 ]", "", text).strip()


def _extract_movement(snapshot: dict) -> tuple[str, str, str]:
    code = str(snapshot.get("previred_movement_code") or snapshot.get("movement_code") or "0")
    start = str(snapshot.get("previred_movement_from") or snapshot.get("movement_from") or "")
    end = str(snapshot.get("previred_movement_to") or snapshot.get("movement_to") or "")
    return code, start, end


def _infer_movement_from_days(periodo_raw: str, dias_trabajados: int) -> tuple[str, str, str]:
    if dias_trabajados >= 30:
        return "0", "", ""
    periodo_txt = str(periodo_raw or "")
    year = int(periodo_txt[:4])
    month = int(periodo_txt[5:7])
    last_day = calendar.monthrange(year, month)[1]
    since_day = 1 if dias_trabajados <= 0 else min(dias_trabajados + 1, last_day)
    from_date = date(year, month, since_day).strftime("%d%m%Y")
    to_date = date(year, month, last_day).strftime("%d%m%Y")
    return "3", from_date, to_date


def _resolve_mutual_ccaf(settings: dict) -> tuple[str, str]:
    raw_mutual = (settings.get("mutual_code") or "ACHS").upper()
    mutual_code = MUTUAL_MAP.get(raw_mutual, "1")

    raw_ccaf = (settings.get("caja_compensacion_code") or "0").upper().strip()
    if raw_ccaf in ("", "0", "00", "NINGUNA", "SIN CCAF"):
        return mutual_code, "0"
    ccaf_code = CCAF_MAP.get(raw_ccaf, raw_ccaf if raw_ccaf.isdigit() else "0")
    return mutual_code, ccaf_code


def _safe_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in ("1", "true", "t", "yes", "si")


def build_previred_line(liq: dict, emp: dict, settings: dict, p_format: str, legal_params: dict) -> str:
    mutual_code, ccaf_code = _resolve_mutual_ccaf(settings)
    raw_mutual = (settings.get("mutual_code") or "ACHS").upper()
    es_isl = "ISL" in raw_mutual or "INSTITUTO DE SEGURIDAD LABORAL" in raw_mutual
    snapshot = liq.get("calculation_snapshot") or {}
    movement_code, movement_from, movement_to = _extract_movement(snapshot)
    if movement_code == "0":
        movement_code = str(emp.get("previred_movement_code") or "0")

    rut_body, rut_dv = split_rut(emp.get("rut", ""))
    dias_trabajados = safe_int(liq.get("dias_trabajados"), 30)
    if movement_code in ("3", "6") and (not movement_from or not movement_to):
        inferred_code, inferred_from, inferred_to = _infer_movement_from_days(
            str(liq.get("periodo") or ""), dias_trabajados
        )
        movement_from = inferred_from
        movement_to = inferred_to
        if movement_code == "0":
            movement_code = inferred_code
    if movement_code == "0" and dias_trabajados < 30:
        movement_code, movement_from, movement_to = _infer_movement_from_days(
            str(liq.get("periodo") or ""), dias_trabajados
        )
    imponible = safe_int(liq.get("base_imponible_afp"))
    afp_monto = safe_int(liq.get("afp"))

    if imponible == 0 and afp_monto > 0:
        haberes = safe_int(liq.get("total_haberes_brutos"))
        no_imponibles = safe_int(liq.get("asignacion_colacion")) + safe_int(liq.get("asignacion_movilizacion"))
        imponible = haberes - no_imponibles
        if imponible <= 0:
            imponible = int(afp_monto / 0.11)

    afp_name = (emp.get("afp") or "MODELO").upper()
    es_sip = afp_name in ("SIP", "IPS", "")
    tipo_prev = "SIP" if es_sip else "AFP"
    tipo_trab = "2" if es_sip else "0"
    cod_afp = "0" if es_sip else AFP_CODES.get(afp_name, "34")

    # Ajuste de sueldo mínimo AFP para mes completo sin movimiento.
    if not es_sip and dias_trabajados == 30 and movement_code == "0":
        sueldo_minimo = safe_int(legal_params.get("sueldo_minimo"), 539000)
        if 0 < imponible < sueldo_minimo:
            imponible = sueldo_minimo

    imponible_salud = safe_int(liq.get("base_imponible_salud"), imponible) or imponible

    fields = [""] * 105
    fields[0] = rut_body
    fields[1] = rut_dv
    fields[2] = clean_text(emp.get("apellido_paterno", ""))
    fields[3] = clean_text(emp.get("apellido_materno", ""))
    fields[4] = clean_text(emp.get("nombres", ""))
    fields[5] = (emp.get("sexo") or "M").upper()[:1]
    fields[6] = "1" if _safe_bool(emp.get("extranjero")) else "0"
    fields[7] = "1"
    fields[8] = p_format
    fields[9] = p_format
    fields[10] = tipo_prev
    fields[11] = tipo_trab
    fields[12] = str(dias_trabajados)
    fields[13] = "0"
    fields[14] = movement_code
    fields[15] = movement_from
    fields[16] = movement_to

    cargas = safe_int(emp.get("cargas_familiares") or emp.get("family_allowances"))
    tramo = "D"
    if cargas > 0:
        if imponible <= 321928:
            tramo = "A"
        elif imponible <= 474999:
            tramo = "B"
        elif imponible <= 737023:
            tramo = "C"
    fields[17] = tramo
    fields[18] = str(cargas)
    fields[19] = "0"
    fields[20] = "0"
    fields[21] = str(safe_int(liq.get("asignacion_familiar")))
    fields[22] = "0"
    fields[23] = "0"
    fields[24] = "N"

    cot_adic_previred = int(round(imponible * 0.001)) if not es_sip else 0
    fields[25] = cod_afp
    fields[26] = str(imponible if not es_sip else 0)
    fields[27] = str((afp_monto + cot_adic_previred) if not es_sip else 0)
    fields[28] = str(safe_int(liq.get("sis_empresa") or liq.get("seguro_invalidez")))
    fields[29] = ""
    fields[30] = "0"
    fields[31] = "0"
    fields[32] = "0"
    fields[33] = "0"
    fields[34] = ""
    fields[35] = ""
    fields[36] = ""
    fields[37] = "0"
    fields[38] = "0"
    fields[39] = ""
    fields[40] = ""
    fields[41] = ""
    fields[42] = "0"
    fields[43] = "0"
    fields[44] = ""
    fields[45] = ""
    fields[46] = ""
    fields[47] = "0"
    fields[48] = "0"
    fields[49] = "0"
    fields[50] = ""
    fields[51] = ""
    fields[52] = ""
    fields[53] = ""
    fields[54] = "0"
    fields[55] = ""
    fields[56] = ""
    fields[57] = "0"
    fields[58] = "0"
    fields[59] = "0"
    fields[60] = "0"

    salud_name = (emp.get("prevision_salud") or "FONASA").upper()
    is_fonasa = "FONASA" in salud_name
    tiene_ccaf = ccaf_code != "0"
    tasa_fonasa = 0.07
    tasa_fonasa_ccaf = 0.028
    tasa_subsidio_ccaf = 0.042

    fields[61] = "0"
    fields[62] = "0"
    if is_fonasa:
        fields[63] = str(imponible_salud)
        cot_fonasa = int(round(imponible * (tasa_fonasa_ccaf if tiene_ccaf else tasa_fonasa)))
        fields[69] = str(cot_fonasa)
        renta_isapre = 0
        moneda_isapre = "1"
        pactado = "0"
        salud_legal = "0"
        salud_adic = "0"
    else:
        fields[63] = "0"
        fields[69] = "0"
        isapre_code = ISAPRE_CODES.get(salud_name, "1")
        plan_uf = safe_float(emp.get("plan_salud_uf") or snapshot.get("plan_salud_uf"))
        moneda_isapre = "2" if plan_uf > 0 else "1"
        pactado = f"{plan_uf:.3f}" if plan_uf > 0 else "0"
        salud_legal = str(safe_int(liq.get("salud")))
        salud_adic = str(safe_int(liq.get("salud_voluntaria")))
        renta_isapre = imponible_salud
        fields[74] = isapre_code

    if es_isl and not es_sip:
        fields[63] = str(imponible)

    fields[64] = "0"
    fields[65] = "0"
    fields[66] = "0"
    fields[67] = "0"
    fields[68] = "0"
    fields[70] = "0"
    fields[71] = "0"
    fields[72] = "0"
    fields[73] = "0"

    if is_fonasa:
        fields[74] = "7"
        fields[75] = ""
        fields[76] = "0"
        fields[77] = "1"
        fields[78] = "0"
        fields[79] = "0"
        fields[80] = "0"
        fields[81] = "0"
    else:
        fields[75] = ""
        fields[76] = str(renta_isapre)
        fields[77] = moneda_isapre
        fields[78] = pactado
        fields[79] = salud_legal
        fields[80] = salud_adic
        fields[81] = "0"

    fields[82] = ccaf_code
    fields[83] = str(imponible) if tiene_ccaf else "0"
    monto_credito_ccaf = safe_int(
        liq.get("credito_ccaf")
        or liq.get("prestamo_ccaf")
        or snapshot.get("credito_ccaf")
        or snapshot.get("prestamo_ccaf")
    )
    fields[84] = str(monto_credito_ccaf) if tiene_ccaf and monto_credito_ccaf > 0 else "0"
    fields[85] = "0"
    fields[86] = "0"
    fields[87] = "0"
    fields[88] = "0"
    fields[89] = str(int(round(imponible * tasa_subsidio_ccaf))) if (tiene_ccaf and is_fonasa) else "0"
    fields[90] = str(safe_int(liq.get("asignacion_familiar"))) if tiene_ccaf else "0"

    rima_valor = 0
    if movement_code in ("3", "6"):
        if dias_trabajados == 0:
            rima_valor = max(safe_int(emp.get("sueldo_base")), safe_int(legal_params.get("sueldo_minimo"), 539000))
        elif dias_trabajados < 30:
            rima_valor = int(round(imponible * (30 - dias_trabajados) / max(dias_trabajados, 1)))
    renta_sc = rima_valor if movement_code in ("3", "6") and dias_trabajados == 0 else imponible
    tipo_contrato = str(
        emp.get("tipo_contrato") or snapshot.get("tipo_contrato") or "indefinido"
    ).upper()
    if es_sip:
        sc_worker = 0
        sc_employer = 0
    elif "INDEFINIDO" in tipo_contrato:
        sc_worker = int(round(renta_sc * (safe_float(legal_params.get("afc_indefinido_trabajador_pct"), 0.6) / 100)))
        sc_employer = int(round(renta_sc * (safe_float(legal_params.get("afc_indefinido_empresa_pct"), 2.4) / 100)))
    else:
        sc_worker = 0
        sc_employer = int(round(renta_sc * (safe_float(legal_params.get("afc_fijo_empresa_pct"), 3.0) / 100)))
    fields[91] = str(rima_valor) if movement_code in ("3", "6") else "0"
    fields[92] = "2" if bool(emp.get("jornada_parcial")) else "1"
    fields[93] = str(int((imponible + rima_valor) * 0.009)) if not es_sip else "0"
    fields[94] = "0"

    tiene_mutual_privada = (mutual_code != "0") and (not es_sip)
    tasa_m = safe_float(settings.get("tasa_mutual"), 0.93) / 100
    cot_mutual = int(imponible * tasa_m) if tiene_mutual_privada else 0

    fields[95] = mutual_code if tiene_mutual_privada else "0"
    fields[96] = str(imponible) if tiene_mutual_privada else "0"
    fields[97] = str(cot_mutual)
    fields[98] = "0"
    if es_isl and not es_sip:
        fields[70] = str(int(imponible * tasa_m))

    fields[99] = str(renta_sc if not es_sip else 0)
    fields[100] = str(sc_worker)
    fields[101] = str(sc_employer)
    fields[102] = "0"
    fields[103] = ""
    fields[104] = ""
    return ";".join(fields)


@router.get("/export-previred/{organization_id}")
async def export_previred(
    organization_id: str,
    periodo: str,
    current_user: dict = Depends(verify_token),
):
    await verify_org_role(organization_id, auth=current_user)
    db = get_supabase()

    try:
        settings_res = (
            db.table("organization_payroll_settings")
            .select("mutual_code, caja_compensacion_code, tasa_mutual")
            .eq("organization_id", organization_id)
            .limit(1)
            .execute()
        )
        settings = (settings_res.data or [{}])[0]
        legal_params = resolve_legal_payroll_params(db, get_period_start(periodo))

        result = (
            db.table("liquidations")
            .select("*, employees(*)")
            .eq("organization_id", organization_id)
            .eq("periodo", periodo)
            .in_("status", closed_liquidation_statuses())
            .execute()
        )
        liquidations = result.data or []
        if not liquidations:
            raise HTTPException(status_code=404, detail=f"No hay liquidaciones aprobadas o cerradas para {periodo}")

        y, m = periodo.split("-")[:2]
        p_format = f"{m}{y}"
        output = StringIO()
        for liq in liquidations:
            emp = liq.get("employees") or {}
            output.write(build_previred_line(liq, emp, settings, p_format, legal_params) + "\n")

        content = output.getvalue()
        output.close()
        filename = f"PREVIRED_{organization_id[:5]}_{periodo.replace('-', '')}.txt"
        return StreamingResponse(
            iter([content]),
            media_type="text/plain",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
