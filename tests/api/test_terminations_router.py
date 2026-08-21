import os
import sys
from datetime import date
import pytest

sys.path.append(os.path.join(os.getcwd(), 'engine'))

from api.routers.terminations import (
    calculate_years_of_service,
    calculate_proportional_holidays_precise,
    TerminationRequest
)

def test_years_of_service_under_one_year():
    start = date(2025, 1, 1)
    end = date(2025, 6, 30)
    res = calculate_years_of_service(start, end)
    assert res["years"] == 0
    assert res["severance_years"] == 0

def test_years_of_service_one_year_seven_months_rounds_up():
    start = date(2024, 1, 1)
    end = date(2025, 8, 15)  # 1 year + 7.5 months -> 2 severance years
    res = calculate_years_of_service(start, end)
    assert res["years"] == 1
    assert res["severance_years"] == 2

def test_years_of_service_capped_at_11():
    start = date(2000, 1, 1)
    end = date(2026, 1, 1)  # 26 years -> capped at 11
    res = calculate_years_of_service(start, end)
    assert res["severance_years"] == 11

def test_proportional_holidays_standard():
    start = date(2025, 1, 1)
    end = date(2025, 12, 31)
    res = calculate_proportional_holidays_precise(start, end, es_zona_extrema=False)
    assert res >= 15.0

def test_proportional_holidays_magallanes_zona_extrema():
    start = date(2025, 1, 1)
    end = date(2025, 12, 31)
    res = calculate_proportional_holidays_precise(start, end, es_zona_extrema=True, zona_extrema="MAGALLANES")
    assert res >= 20.0
