import sys

sys.path.append("engine")

from api.routers.previred import build_previred_line


def _base_liq():
    return {
        "base_imponible_afp": 400000,
        "afp": 40000,
        "base_imponible_salud": 400000,
        "dias_trabajados": 30,
        "asignacion_familiar": 0,
        "sis_empresa": 0,
        "seguro_invalidez": 0,
        "salud": 28000,
        "salud_voluntaria": 0,
        "afc_trabajador": 2400,
        "afc_empresa": 9600,
        "calculation_snapshot": {},
    }


def _base_emp():
    return {
        "rut": "12.345.678-5",
        "apellido_paterno": "Perez",
        "apellido_materno": "Gomez",
        "nombres": "Juan",
        "sexo": "M",
        "afp": "MODELO",
        "prevision_salud": "FONASA",
        "cargas_familiares": 0,
        "family_allowances": 0,
        "jornada_parcial": False,
        "sueldo_base": 500000,
        "tipo_contrato": "indefinido",
    }


def _settings():
    return {"mutual_code": "ACHS", "caja_compensacion_code": ""}


def test_previred_line_has_105_fields():
    line = build_previred_line(_base_liq(), _base_emp(), _settings(), "052026", {"sueldo_minimo": 539000})
    assert len(line.split(";")) == 105


def test_previred_identity_and_default_fields_match_reference():
    emp = _base_emp()
    emp["extranjero"] = True
    line = build_previred_line(_base_liq(), emp, _settings(), "052026", {"sueldo_minimo": 539000})
    fields = line.split(";")
    assert fields[6] == "1"
    assert fields[7] == "1"
    assert fields[13] == "0"
    assert fields[19] == "0"
    assert fields[20] == "0"
    assert fields[22] == "0"
    assert fields[23] == "0"
    assert fields[24] == "N"
    assert fields[29] == ""
    assert fields[31:39] == ["0", "0", "0", "", "", "", "0", "0"]
    assert fields[42] == "0"
    assert fields[60] == "0"


def test_previred_movement_and_rima_for_subsidy_partial():
    liq = _base_liq()
    liq["dias_trabajados"] = 15
    liq["calculation_snapshot"] = {
        "movement_code": "3",
        "movement_from": "01052026",
        "movement_to": "15052026",
    }
    line = build_previred_line(liq, _base_emp(), _settings(), "052026", {"sueldo_minimo": 539000})
    fields = line.split(";")
    assert fields[14] == "3"
    assert fields[15] == "01052026"
    assert fields[16] == "15052026"
    assert int(fields[91]) > 0


def test_previred_applies_minimum_salary_for_full_month():
    liq = _base_liq()
    liq["base_imponible_afp"] = 300000
    line = build_previred_line(liq, _base_emp(), _settings(), "052026", {"sueldo_minimo": 539000})
    fields = line.split(";")
    assert fields[26] == "539000"


def test_previred_infers_movement_from_days_when_missing_snapshot_code():
    liq = _base_liq()
    liq["periodo"] = "2026-05-01"
    liq["dias_trabajados"] = 20
    liq["calculation_snapshot"] = {}
    line = build_previred_line(liq, _base_emp(), _settings(), "052026", {"sueldo_minimo": 539000})
    fields = line.split(";")
    assert fields[14] == "3"
    assert fields[15] == "21052026"
    assert fields[16] == "31052026"


def test_previred_keeps_explicit_accident_movement_code():
    liq = _base_liq()
    liq["periodo"] = "2026-05-01"
    liq["dias_trabajados"] = 20
    liq["calculation_snapshot"] = {
        "movement_code": "6",
        "movement_from": "21052026",
        "movement_to": "31052026",
    }
    line = build_previred_line(liq, _base_emp(), _settings(), "052026", {"sueldo_minimo": 539000})
    fields = line.split(";")
    assert fields[14] == "6"
    assert fields[15] == "21052026"
    assert fields[16] == "31052026"


def test_previred_uses_employee_movement_code_when_snapshot_missing():
    liq = _base_liq()
    liq["periodo"] = "2026-05-01"
    liq["dias_trabajados"] = 20
    liq["calculation_snapshot"] = {}
    emp = _base_emp()
    emp["previred_movement_code"] = "6"
    line = build_previred_line(liq, emp, _settings(), "052026", {"sueldo_minimo": 539000})
    fields = line.split(";")
    assert fields[14] == "6"
    assert fields[15] == "21052026"
    assert fields[16] == "31052026"


def test_previred_isl_sets_fonasa_base_and_isl_accident_field():
    emp = _base_emp()
    emp["prevision_salud"] = "Banmedica"
    liq = _base_liq()
    settings = {"mutual_code": "ISL", "caja_compensacion_code": ""}
    line = build_previred_line(liq, emp, settings, "052026", {"sueldo_minimo": 539000})
    fields = line.split(";")
    assert fields[63] == fields[26]
    assert int(fields[70]) > 0
    assert fields[95] == "0"


def test_previred_ccaf_credit_and_code_match_reference():
    liq = _base_liq()
    liq["credito_ccaf"] = 5000
    settings = {"mutual_code": "ACHS", "caja_compensacion_code": "LOS ANDES"}
    line = build_previred_line(liq, _base_emp(), settings, "052026", {"sueldo_minimo": 539000})
    fields = line.split(";")
    assert fields[82] == "1"
    assert fields[84] == "5000"
    assert int(fields[89]) > 0


def test_previred_afc_is_calculated_from_contract_type():
    emp = _base_emp()
    liq = _base_liq()
    line = build_previred_line(liq, emp, _settings(), "052026", {"sueldo_minimo": 539000})
    fields = line.split(";")
    assert fields[99] == "539000"
    assert fields[100] == "3234"
    assert fields[101] == "12936"

    emp["tipo_contrato"] = "plazo_fijo"
    line = build_previred_line(liq, emp, _settings(), "052026", {"sueldo_minimo": 539000})
    fields = line.split(";")
    assert fields[100] == "0"
    assert fields[101] == "16170"
