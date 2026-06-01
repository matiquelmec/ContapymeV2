"""Contrato: resolver de UF/UTM por código.

Reproduce el escenario real (UF diaria, UTM mensual) donde una consulta conjunta
con limit(2) traería dos UF y ninguna UTM. El resolver debe entregar el último
valor de CADA indicador.
"""

import sys

sys.path.append("engine")

from core.payroll_legal_params import resolve_economic_indicators


class _FakeQuery:
    """Builder mínimo que filtra por codigo y devuelve la fila más reciente."""

    def __init__(self, rows):
        self._rows = rows
        self._codigo = None

    def select(self, *_a, **_k):
        return self

    def eq(self, col, val):
        if col == "codigo":
            self._codigo = val
        return self

    def lte(self, *_a, **_k):
        return self

    def order(self, *_a, **_k):
        return self

    def limit(self, *_a, **_k):
        return self

    def execute(self):
        filas = [r for r in self._rows if r["codigo"] == self._codigo]
        filas.sort(key=lambda r: r["fecha"], reverse=True)
        return type("Res", (), {"data": [{"valor": filas[0]["valor"]}] if filas else []})()


class _FakeDB:
    def __init__(self, rows):
        self._rows = rows

    def table(self, _name):
        return _FakeQuery(self._rows)


def test_resolver_devuelve_uf_y_utm_correctos():
    # Muchas UF recientes + una UTM del día 1: el caso que rompía limit(2).
    rows = [
        {"codigo": "uf", "valor": 39000.0, "fecha": "2026-06-01"},
        {"codigo": "uf", "valor": 38990.0, "fecha": "2026-05-31"},
        {"codigo": "uf", "valor": 38980.0, "fecha": "2026-05-30"},
        {"codigo": "utm", "valor": 69000.0, "fecha": "2026-06-01"},
        {"codigo": "utm", "valor": 68500.0, "fecha": "2026-05-01"},
    ]
    res = resolve_economic_indicators(_FakeDB(rows), "2026-06-01")
    assert res["uf_valor"] == 39000.0
    assert res["utm_valor"] == 69000.0   # NO el fallback 67294


def test_resolver_usa_fallback_si_no_hay_datos():
    res = resolve_economic_indicators(_FakeDB([]), "2026-06-01")
    assert res["uf_valor"] == 38000.0
    assert res["utm_valor"] == 67294.0
