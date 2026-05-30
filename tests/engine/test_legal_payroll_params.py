import sys

sys.path.append("engine")

from calculators.national_params import SUELDO_MINIMO
from calculators.chilean_payroll import PayrollSettings, calcular_gratificacion_legal
from core.payroll_legal_params import resolve_legal_payroll_params


class _FakeQuery:
    def __init__(self, data):
        self._data = data

    def select(self, *_args):
        return self

    def lte(self, *_args):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def limit(self, *_args):
        return self

    def execute(self):
        return type("Result", (), {"data": self._data})()


class _FakeDb:
    def __init__(self, data):
        self._data = data

    def table(self, name):
        assert name == "national_payroll_params"
        return _FakeQuery(self._data)


def test_imm_2026_fallback_is_current():
    assert SUELDO_MINIMO == 539000
    assert PayrollSettings().sueldo_minimo == 539000
    assert calcular_gratificacion_legal(5_000_000, SUELDO_MINIMO) == 213354


def test_imm_2026_resolves_from_central_params():
    db = _FakeDb([{"periodo": "2026-01-01", "sueldo_minimo": 539000}])
    params = resolve_legal_payroll_params(db, "2026-05-01")
    assert params["sueldo_minimo"] == 539000
