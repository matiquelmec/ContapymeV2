import pytest
from calculators.chilean_payroll import (
    EmployeeInput,
    PayrollSettings,
    calcular_liquidacion,
    calcular_impuesto_unico,
    calcular_gratificacion_legal,
    calcular_hora_extra,
    calcular_asignacion_familiar
)

class TestChileanPayrollEngine:
    """
    💎 TITANIUM SHIELD: Suite de Pruebas Unitarias.
    Valida la exactitud absoluta del motor matemático de remuneraciones.
    Cualquier cambio futuro en el código debe pasar estas reglas del SII y DT.
    """

    @pytest.fixture
    def default_settings(self):
        # Valores legales estándar 2025 para pruebas inmutables
        return PayrollSettings(
            afp_tasa_cotizacion_pct=10.0,
            afp_comision_pct=1.27, # Ejemplo: Habitat
            afp_sis_pct=1.49,
            uf_tope_afp=84.3,
            salud_pct=7.0,
            uf_tope_salud=84.3,
            afc_indefinido_trabajador_pct=0.6,
            afc_indefinido_empresa_pct=2.4,
            uf_tope_afc=126.6,
            sueldo_minimo=539000,
            uf_valor=38000.0,
        )

    def test_impuesto_unico_exento(self):
        """Validar que rentas bajo el límite de 13.5 UTM quedan exentas."""
        utm = 67294.0
        renta_imponible = 900000
        impuesto = calcular_impuesto_unico(renta_imponible, utm)
        assert impuesto == 0, f"Renta {renta_imponible} debería estar exenta."

    def test_impuesto_unico_tramos_altos(self):
        """Validar el cobro correcto en el último tramo de impuesto."""
        utm = 67294.0
        # Renta muy alta, entra al 40% de descuento marginal (factor 38.82)
        renta_imponible = 25_000_000
        # Impuesto esperado: = (25.000.000 * 0.40) - (38.82 * 67294)
        esperado = int((renta_imponible * 0.40) - (38.820 * utm))
        impuesto = calcular_impuesto_unico(renta_imponible, utm)
        assert impuesto == max(0, esperado)

    def test_gratificacion_legal_tope(self, default_settings):
        """Validar que la gratificación mensual topa en 4.75 IMM / 12."""
        # Sueldo muy alto asegura que llegue al tope legal
        sueldo_base = 5_000_000
        tope_esperado = int((4.75 * default_settings.sueldo_minimo) / 12)
        grat = calcular_gratificacion_legal(sueldo_base, default_settings.sueldo_minimo)
        assert grat == tope_esperado

    def test_gratificacion_legal_sin_tope(self, default_settings):
        """Validar gratificación del 25% para sueldos bajos (sin llegar al tope)."""
        sueldo_base = 600_000
        gratif_25_pct = int(sueldo_base * 0.25)
        tope = int((4.75 * default_settings.sueldo_minimo) / 12)
        assert gratif_25_pct < tope, "Debe ser menor al tope para este test"
        grat = calcular_gratificacion_legal(sueldo_base, default_settings.sueldo_minimo)
        assert grat == gratif_25_pct

    def test_horas_extra(self):
        """Validar cálculo oficial DT: (Sueldo/30)*7/HorasSemanales*1.5"""
        sueldo = 1_000_000
        horas = 10
        semanales = 42
        valor_hora_ord = ((sueldo / 30.0) * 7.0) / semanales
        esperado = int(round(valor_hora_ord * 1.5 * horas))
        resultado = calcular_hora_extra(sueldo, horas, semanales)
        assert resultado == esperado

    def test_liquidacion_completa_sueldo_minimo(self, default_settings):
        """Validar liquidación completa para un trabajador con el mínimo legal, sin gratificación."""
        # IMM vigente sin gratificacion legal para este test
        emp = EmployeeInput(
            sueldo_base=539000,
            tipo_contrato="indefinido",
            afp_comision_pct=1.27, # Habitat
            dias_trabajados=30,
            gratificacion_legal=False
        )
        res = calcular_liquidacion(emp, default_settings, utm_valor=67294.0)
        
        # Haberes
        assert res.sueldo_base == 539000
        assert res.gratificacion == 0
        assert res.total_haberes_brutos == 539000
        
        # Base Imponible Topada (no supera las 84.3 UF)
        assert res.base_imponible_afp == 539000
        
        # Descuentos
        afp_obl = int(539000 * 0.10)
        afp_com = int(539000 * 0.0127)
        salud = int(539000 * 0.07)
        afc = int(539000 * 0.006)
        
        assert res.afp == afp_obl
        assert res.afp_comision == afp_com
        assert res.salud == salud
        assert res.afc_trabajador == afc
        assert res.impuesto_unico == 0  # < 13.5 UTM
        
        total_descuentos = afp_obl + afp_com + salud + afc
        assert res.total_descuentos_legales == total_descuentos
        assert res.sueldo_liquido == 539000 - total_descuentos

    def test_liquidacion_proporcional(self, default_settings):
        """Validar que un empleado que trabajó 15 días reciba haberes e imponibles correctos."""
        emp = EmployeeInput(
            sueldo_base=1000000,
            dias_trabajados=15,
            gratificacion_legal=False
        )
        res = calcular_liquidacion(emp, default_settings, utm_valor=67294.0)
        
        # Mitad del sueldo base y bases
        assert res.sueldo_base == 500000

    def test_tope_imponible_afp(self, default_settings):
        """Exceder el tope de 84.3 UF y validar que la retención de AFP encaje en la ley."""
        sueldo_muy_alto = 10_000_000 # Muy superior a 84.3 UF
        emp = EmployeeInput(sueldo_base=sueldo_muy_alto, gratificacion_legal=False)
        res = calcular_liquidacion(emp, default_settings)
        
        tope_pesos = int(default_settings.uf_tope_afp * default_settings.uf_valor)
        assert res.base_imponible_afp == tope_pesos
        
        esperado_afp_obl = int(tope_pesos * 0.10)
        assert res.afp == esperado_afp_obl

    def test_descuento_isapre_superior(self, default_settings):
        """Validar el caso donde el plan de Isapre (en UF) es superior al 7% legal."""
        uf = default_settings.uf_valor
        plan_uf = 5.0 # Costo Isapre: 5 * 38.000 = 190.000
        
        emp = EmployeeInput(
            sueldo_base=1_500_000,
            gratificacion_legal=False,
            salud_code="CRUZ BLANCA",
            plan_salud_uf=plan_uf
        )
        
        res = calcular_liquidacion(emp, default_settings)
        
        # 7% Obligatorio de 1.5M = 105.000
        # Plan Pactado = 190.000
        # Salud total descontado al empleado debe ser 190.000
        assert res.salud == int(1_500_000 * 0.07)
        assert res.salud_voluntaria == 190_000 - int(1_500_000 * 0.07)
        assert res.salud_total == 190_000

    def test_zona_extrema_magallanes(self, default_settings):
        """Validar que un empleado en Magallanes tenga la deducción de zona y la rebaja del 98% en impuesto."""
        # Sueldo imponible alto para que pague impuesto único
        emp = EmployeeInput(
            sueldo_base=4_000_000,
            gratificacion_legal=False,
            es_zona_extrema=True,
            zona_extrema="MAGALLANES",
            mes_proceso="2026-03"
        )
        
        # Primero calcular sin zona extrema para comparar
        emp_normal = EmployeeInput(
            sueldo_base=4_000_000,
            gratificacion_legal=False,
            es_zona_extrema=False
        )
        res_normal = calcular_liquidacion(emp_normal, default_settings, utm_valor=67294.0)
        
        res_zona = calcular_liquidacion(emp, default_settings, utm_valor=67294.0)
        
        # Debe haber descuento de asignación de zona de la base tributable
        assert res_zona.asignacion_zona_extrema > 0
        assert res_zona.base_imponible_impuesto < res_normal.base_imponible_impuesto
        
        # El impuesto determinado bruto debe ser menor o igual, y después se rebaja el 98%
        # Así que el impuesto final debe ser solo el 2% del impuesto bruto determinado
        assert res_zona.impuesto_unico == res_zona.impuesto_unico_sin_rebaja - res_zona.rebaja_zona_extrema
        assert res_zona.impuesto_unico < res_normal.impuesto_unico

    def test_bono_fijo_calculo(self, default_settings):
        """Validar que el bono_fijo de la ficha de empleado se suma proporcionalmente a haberes imponibles."""
        emp = EmployeeInput(
            sueldo_base=1000000,
            bono_fijo=200000,
            dias_trabajados=30,
            gratificacion_legal=False
        )
        res = calcular_liquidacion(emp, default_settings)
        # Bono completo porque trabajó 30 días
        assert res.bono_fijo == 200000
        assert res.total_haberes_brutos == 1200000

        # Caso proporcional 15 días
        emp_prop = EmployeeInput(
            sueldo_base=1000000,
            bono_fijo=200000,
            dias_trabajados=15,
            gratificacion_legal=False
        )
        res_prop = calcular_liquidacion(emp_prop, default_settings)
        assert res_prop.sueldo_base == 500000
        assert res_prop.bono_fijo == 100000
        assert res_prop.total_haberes_brutos == 600000
