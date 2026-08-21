import os
import sys
import pytest

sys.path.append(os.path.join(os.getcwd(), 'engine'))

from api.routers.lre import DT_HEADERS
from calculators.national_params import get_tramo_asignacion

def test_lre_dt_headers_count():
    assert len(DT_HEADERS) == 147

def test_lre_essential_headers_present():
    headers_str = " ".join(DT_HEADERS)
    assert "Rut trabajador(1101)" in headers_str
    assert "AFP(1141)" in headers_str
    assert "Sueldo(2101)" in headers_str
    assert "Gratificación(2106)" in headers_str
    assert "FONASA - ISAPRE(1143)" in headers_str

def test_get_tramo_asignacion():
    assert get_tramo_asignacion(300000) == "A"
    assert get_tramo_asignacion(600000) == "B"
    assert get_tramo_asignacion(900000) == "C"
    assert get_tramo_asignacion(2500000) == "D"
