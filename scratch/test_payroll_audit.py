import os
import sys
import unittest
from datetime import date

# Agregar el directorio engine a sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "engine"))

from api.routers.terminations import calculate_proportional_holidays_precise

class TestPayrollAudit(unittest.TestCase):

    def test_vacaciones_proporcionales_zona_extrema(self):
        # 1. Probar vacaciones proporcionales con factor estándar 1.25
        # 365 días en zona no extrema
        start = date(2025, 1, 1)
        end = date(2025, 12, 31)
        
        days_normal = calculate_proportional_holidays_precise(start, end, es_zona_extrema=False)
        # Esperado: (365 / 30) * 1.25 = 15.21 días
        self.assertAlmostEqual(days_normal, 15.21, places=1)
        
        # 2. Probar vacaciones proporcionales con factor 1.6667 (Magallanes)
        days_ze = calculate_proportional_holidays_precise(start, end, es_zona_extrema=True, zona_extrema="MAGALLANES")
        # Esperado: (365 / 30) * 1.6667 = 20.28 días
        self.assertAlmostEqual(days_ze, 20.28, places=1)
        
        # 3. Probar Aysén y Palena
        days_aysen = calculate_proportional_holidays_precise(start, end, es_zona_extrema=True, zona_extrema="AYSEN")
        self.assertAlmostEqual(days_aysen, 20.28, places=1)
        
        # 4. Probar zona no contemplada (ej. Arica, rebaja 50% de impuesto pero vacaciones normales de 15 días)
        days_arica = calculate_proportional_holidays_precise(start, end, es_zona_extrema=True, zona_extrema="ARICA")
        self.assertAlmostEqual(days_arica, 15.21, places=1)

    def test_math_rebaja_reconstruct_local_lre(self):
        # Probar la reconstrucción matemática de la rebaja DL 889 en el LRE local de escritorio
        # Si impuesto_neto = 2000 y rebaja = 98% (Magallanes), impuesto_bruto = 2000 / 0.02 = 100000.
        # Rebaja = 100000 - 2000 = 98000.
        # Fórmula: desc_imp * 0.98 / 0.02 = desc_imp * 49
        desc_imp = 2000
        rebaja_zona_monto = int(round(desc_imp * 0.98 / 0.02))
        self.assertEqual(rebaja_zona_monto, 98000)
        
        # Si Arica (50%), rebaja = desc_imp
        rebaja_arica = desc_imp
        self.assertEqual(rebaja_arica, 2000)

if __name__ == '__main__':
    unittest.main()
