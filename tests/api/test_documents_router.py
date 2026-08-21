import os
import sys
import pytest
from pydantic import ValidationError

sys.path.append(os.path.join(os.getcwd(), 'engine'))

from api.routers.documents import GenerateDocRequest
from core.utils.shared_utils import clean_rut, format_clp, to_words, format_date_cl

def test_generate_doc_request_validation():
    req = GenerateDocRequest(employee_id="emp-123", type="contrato", description="Contrato indefinido")
    assert req.employee_id == "emp-123"
    assert req.type == "contrato"
    assert req.description == "Contrato indefinido"
    assert req.signature_base64 is None

def test_clean_rut_utility():
    assert clean_rut(" 19876543-k ") == "19.876.543-K"
    assert clean_rut("76.123.456-0") == "76.123.456-0"
    assert clean_rut("11111111-1") == "11.111.111-1"

def test_format_clp_utility():
    assert "$" in format_clp(500000)
    assert "500.000" in format_clp(500000)
    assert "0" in format_clp(0)

def test_to_words_utility():
    palabras = to_words(500000)
    assert "PESOS" in palabras.upper()

def test_format_date_cl():
    assert "mayo" in format_date_cl("2026-05-15").lower()
    assert "2026" in format_date_cl("2026-05-15")
