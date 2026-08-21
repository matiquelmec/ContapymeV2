import os
import sys
import pytest

sys.path.append(os.path.join(os.getcwd(), 'engine'))

from api.routers.rcv import (
    DOCUMENT_TYPES_NAMES,
    DOCUMENT_TYPES_SUMA,
    DOCUMENT_TYPES_RESTA,
    _calcular_monto,
    _normalizar_fecha
)

def test_document_types_names():
    assert DOCUMENT_TYPES_NAMES['33'] == 'Factura Electrónica'
    assert DOCUMENT_TYPES_NAMES['61'] == 'Nota de Crédito'
    assert DOCUMENT_TYPES_NAMES['39'] == 'Boleta Electrónica'

def test_calcular_monto_factura_suma():
    monto, is_suma = _calcular_monto(monto_neto=10000, monto_exento=0, tipo_doc='33')
    assert monto == 10000
    assert is_suma is True

def test_calcular_monto_nota_credito_resta():
    monto, is_suma = _calcular_monto(monto_neto=5000, monto_exento=0, tipo_doc='61')
    assert monto == -5000
    assert is_suma is False

def test_normalizar_fecha_formatos():
    assert _normalizar_fecha("2026-05-15") == "2026-05-15"
    assert _normalizar_fecha("15/05/2026") == "2026-05-15"
    assert _normalizar_fecha("") is None
