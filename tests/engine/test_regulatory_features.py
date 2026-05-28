import pytest
from datetime import date
from api.routers.terminations import (
    calculate_years_of_service,
    calculate_proportional_holidays_precise,
    TerminationRequest
)
from api.routers.dj1887 import (
    calcular_datos_anuales,
    clean_rut,
    format_rut
)
from api.routers.previred_importer import (
    detectar_periodo,
    normalizar_rut
)

class TestRegulatoryFeatures:
    """
    Test suite for Chilean regulatory requirements (SII, DT, Previred, DL 889) 
    integrated into Contapymepuq.
    """

    def test_years_of_service_standard(self):
        """Test calculation of years of service under Chilean Labor Code."""
        # Under 1 year
        start = date(2025, 1, 1)
        end = date(2025, 6, 30) # 6 months
        res = calculate_years_of_service(start, end)
        assert res["years"] == 0
        assert res["severance_years"] == 0

        # Exactly 1 year
        start = date(2025, 1, 1)
        end = date(2025, 12, 31) # 1 year
        res = calculate_years_of_service(start, end)
        assert res["years"] == 1
        assert res["severance_years"] == 1

        # 1 year and 5 months (does not round up, severance_years remains 1)
        start = date(2024, 1, 1)
        end = date(2025, 5, 31)
        res = calculate_years_of_service(start, end)
        assert res["years"] == 1
        assert res["severance_years"] == 1

        # 1 year and 7 months (rounds up to 2 severance_years because fraction > 6 months)
        start = date(2024, 1, 1)
        end = date(2025, 7, 31)
        res = calculate_years_of_service(start, end)
        assert res["years"] == 1
        assert res["severance_years"] == 2

    def test_years_of_service_limit_cap(self):
        """Test that years of service cap for severance is 11 years (Art. 163 CT)."""
        start = date(2010, 1, 1)
        end = date(2025, 12, 31) # 16 years
        res = calculate_years_of_service(start, end)
        assert res["years"] == 16
        assert res["severance_years"] == 11

    def test_proportional_holidays_dt_formula(self):
        """Test proportional holiday calculation according to DT guidelines (1.25 days per 30 days)."""
        # Exactly 30 days worked = 1.25 days earned
        start = date(2025, 1, 1)
        end = date(2025, 1, 30)
        res = calculate_proportional_holidays_precise(start, end)
        assert res == 1.25

        # Exactly 60 days worked = 2.50 days earned
        start = date(2025, 1, 1)
        end = date(2025, 3, 1) # Jan has 31 days, Feb has 28 days -> total 31+28+1 = 60 days
        res = calculate_proportional_holidays_precise(start, end)
        assert res == 2.50

    def test_rut_formatting_rules(self):
        """Verify clean and format helpers for RUT validation."""
        assert clean_rut("12.345.678-9") == "123456789"
        assert clean_rut(" 18.284.893-K ") == "18284893K"
        
        assert format_rut("123456789") == "12.345.678-9"
        assert format_rut("18284893K") == "18.284.893-K"

    def test_previred_period_detection(self):
        """Verify that the period is correctly parsed from the Previred PDF text layout."""
        text1 = "INFORMACION DE REMUNERACIONES PERIODO DE REMUNERACIÓN 03 2026 GENERAL"
        text2 = "Detalle de Cotizaciones\nPeríodo de Remuneraciones: 12/2025\nEmpresa: CONTAPYME"
        text3 = "Planilla Resumen de Cotizaciones Periodo 01/2025"
        
        assert detectar_periodo(text1) == (3, 2026)
        assert detectar_periodo(text2) == (12, 2025)
        assert detectar_periodo(text3) == (1, 2025)

    def test_previred_rut_normalization(self):
        """Verify that RUT is normalized to standard format (XX.XXX.XXX-X)."""
        assert normalizar_rut("12345678-9") == "12.345.678-9"
        assert normalizar_rut("12.345.678-9") == "12.345.678-9"
        assert normalizar_rut("18284893-k") == "18.284.893-K"

    def test_dj1887_annual_data_aggregation(self):
        """Verify aggregation of monthly liquidations into annual summary for SII."""
        liquidations = [
            {
                "employees": {"id": "emp1", "rut": "12.345.678-9", "nombres": "Juan", "apellido_paterno": "Perez"},
                "total_haberes_brutos": 1200000,
                "asignacion_colacion": 50000,
                "asignacion_movilizacion": 50000,
                "asignacion_familiar": 0,
                "afp": 120000,
                "afp_comision": 15000,
                "salud": 84000,
                "salud_voluntaria": 0,
                "afc_trabajador": 7200,
                "impuesto_unico": 12000
            },
            {
                "employees": {"id": "emp1", "rut": "12.345.678-9", "nombres": "Juan", "apellido_paterno": "Perez"},
                "total_haberes_brutos": 1200000,
                "asignacion_colacion": 50000,
                "asignacion_movilizacion": 50000,
                "asignacion_familiar": 0,
                "afp": 120000,
                "afp_comision": 15000,
                "salud": 84000,
                "salud_voluntaria": 0,
                "afc_trabajador": 7200,
                "impuesto_unico": 12000
            }
        ]

        datos = calcular_datos_anuales(liquidations)
        assert len(datos) == 1
        d = datos[0]
        assert d["meses"] == 2
        # Renta imponible: 1.2M - 50k (colacion) - 50k (movilizacion) = 1.1M per month -> 2.2M total
        assert d["renta_imponible"] == 2200000
        # Renta no imponible: 50k + 50k = 100k per month -> 200k total
        assert d["renta_no_imponible"] == 200000
        # Cotiz AFP: 120k + 15k = 135k per month -> 270k total
        assert d["cotiz_afp"] == 270000
        # Cotiz Salud: 84k per month -> 168k total
        assert d["cotiz_salud"] == 168000
        # Impuesto: 12k per month -> 24k total
        assert d["impuesto"] == 24000
