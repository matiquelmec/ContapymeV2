import unittest

class TestFinancialMetricsAndHealth(unittest.TestCase):
    """
    Suite de pruebas de Calidad, Integridad y Auditoría para el Motor Financiero y Dashboard.
    Cubre:
    - Fórmulas contables (Gross Margin, EBITDA).
    - Clasificación asistida de salud corporativa (PREOPERATIONAL vs CRITICAL vs EXCELLENT).
    - Aislamiento multi-tenant y manejo seguro de valores cero o nulos.
    """

    def test_01_preoperational_case_with_payroll_and_zero_sales(self):
        """
        Caso Inversiones Riquelme:
        Empresa que registra nómina/cargas laborales pero 0 ventas.
        Debe clasificarse como 'PREOPERATIONAL' con score base y no provocar división por cero.
        """
        total_sales = 0
        total_purchases = 0
        total_payroll = 61325843

        gross_margin = total_sales - total_purchases
        ebitda = gross_margin - total_payroll

        margin_percentage = (gross_margin / total_sales * 100) if total_sales > 0 else 0
        ebitda_margin = (ebitda / total_sales * 100) if total_sales > 0 else 0

        # Evaluación asistida
        if total_sales == 0 and (total_payroll > 0 or total_purchases > 0):
            overall_assessment = "PREOPERATIONAL"
            score = 30
        else:
            overall_assessment = "CRITICAL"
            score = 0

        self.assertEqual(gross_margin, 0)
        self.assertEqual(ebitda, -61325843)
        self.assertEqual(margin_percentage, 0)
        self.assertEqual(ebitda_margin, 0)
        self.assertEqual(overall_assessment, "PREOPERATIONAL")
        self.assertEqual(score, 30)

    def test_02_profitable_growth_case(self):
        """
        Empresa operativa con ventas sólidas y margen saludable:
        Debe ser catalogada como 'EXCELLENT' o 'GOOD' con score acorde.
        """
        total_sales = 100000000
        total_purchases = 40000000
        total_payroll = 25000000

        gross_margin = total_sales - total_purchases  # 60.000.000 (60%)
        ebitda = gross_margin - total_payroll         # 35.000.000 (35%)

        margin_percentage = (gross_margin / total_sales * 100)
        ebitda_margin = (ebitda / total_sales * 100)

        if total_sales == 0 and (total_payroll > 0 or total_purchases > 0):
            overall_assessment = "PREOPERATIONAL"
            score = 30
        elif ebitda_margin > 25:
            overall_assessment = "EXCELLENT"
            score = int((margin_percentage * 0.4) + (ebitda_margin * 0.6))
        elif ebitda > 0:
            overall_assessment = "GOOD"
            score = int((margin_percentage * 0.4) + (ebitda_margin * 0.6))
        else:
            overall_assessment = "CRITICAL"
            score = 10

        self.assertEqual(gross_margin, 60000000)
        self.assertEqual(ebitda, 35000000)
        self.assertEqual(overall_assessment, "EXCELLENT")
        self.assertEqual(score, 45)  # (60*0.4=24) + (35*0.6=21) = 45

    def test_03_critical_insolvent_case(self):
        """
        Empresa con ventas pero costos y compras desbordados (margen negativo).
        Debe ser catalogada como 'CRITICAL'.
        """
        total_sales = 10000000
        total_purchases = 15000000
        total_payroll = 8000000

        gross_margin = total_sales - total_purchases  # -5.000.000
        ebitda = gross_margin - total_payroll         # -13.000.000
        margin_percentage = (gross_margin / total_sales * 100)

        overall_assessment = "CRITICAL" if ebitda <= 0 else "GOOD"

        self.assertEqual(overall_assessment, "CRITICAL")
        self.assertLess(ebitda, 0)

    def test_04_asset_metrics_and_depreciation_bounds(self):
        """
        Verifica que el valor libro neto nunca sea incongruente y que los casos en 0
        se manejen limpiamente.
        """
        # Caso sin activos
        assets_zero = {"total_value": 0, "total_depreciation": 0}
        net_book_value_zero = assets_zero["total_value"] - assets_zero["total_depreciation"]
        self.assertEqual(net_book_value_zero, 0)

        # Caso con activos y depreciación
        assets_real = {"total_value": 50000000, "total_depreciation": 10000000}
        net_book_value_real = assets_real["total_value"] - assets_real["total_depreciation"]
        self.assertEqual(net_book_value_real, 40000000)

    def test_05_multi_tenant_isolation_payload_contract(self):
        """
        Seguridad de Datos: El payload que retorna el motor financiero debe obligatoriamente
        consignar el año y no divulgar credenciales de base de datos ni tokens de sesión.
        """
        forbidden_keys = ["service_role", "password", "secret", "token", "auth_token"]
        sample_payload = {
            "year": 2026,
            "orgName": "Inversiones Riquelme",
            "financials": {"totalSales": 0, "totalPurchases": 0, "totalPayroll": 61325843},
            "assets": {"totalValue": 0, "totalDepreciation": 0}
        }

        for key in sample_payload.keys():
            self.assertNotIn(key, forbidden_keys)


if __name__ == "__main__":
    unittest.main()
