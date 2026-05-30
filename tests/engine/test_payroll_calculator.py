import pytest
from calculators.chilean_payroll import (
    PayrollSettings, EmployeeInput, calcular_liquidacion, 
    calcular_impuesto_unico, calcular_gratificacion_legal
)

# Constants for testing
UF_VALOR = 38045.54 # Value for late 2024 / early 2025
UTM_VALOR = 67294.0 # Value for Jan 2025
SUELDO_MINIMO = 539000

@pytest.fixture
def default_settings():
    return PayrollSettings(
        sueldo_minimo=SUELDO_MINIMO,
        uf_valor=UF_VALOR,
        uf_tope_afp=84.3,
        uf_tope_salud=84.3,
        uf_tope_afc=126.6,
        afp_sis_pct=1.49
    )

def test_standard_salary_calculation(default_settings):
    """Test a 1,000,000 CLP salary with Fonasa and Indefinite contract."""
    emp = EmployeeInput(
        sueldo_base=1000000,
        tipo_contrato="indefinido",
        afp_comision_pct=1.27, # Habitat default
        salud_code="FONASA",
        plan_salud_uf=0,
        gratificacion_legal=True,
        dias_trabajados=30
    )
    
    res = calcular_liquidacion(emp, default_settings, utm_valor=UTM_VALOR)
    
    # Assertions
    # Gratificacion: 25% of 1M but capped at (4.75 * IMM)/12.
    expected_grat = int((4.75 * SUELDO_MINIMO) / 12)
    assert res.gratificacion == expected_grat
    assert res.sueldo_base == 1000000
    
    assert res.total_haberes_brutos == 1000000 + expected_grat
    
    # Check legal discounts
    assert res.afp == int(res.base_imponible_afp * 0.10)
    assert res.salud == int(res.base_imponible_salud * 0.07)
    
    # Liquido should be around 950k-980k depending on tax
    assert res.sueldo_liquido > 0
    assert res.sueldo_liquido < res.total_haberes_brutos

def test_fixed_contract_afc(default_settings):
    """Test fixed contract: Worker pays 0% AFC, Company pays 3%."""
    emp = EmployeeInput(
        sueldo_base=800000,
        tipo_contrato="plazo_fijo",
        gratificacion_legal=True,
        afc_active=True
    )
    
    res = calcular_liquidacion(emp, default_settings, utm_valor=UTM_VALOR)
    
    assert res.afc_trabajador == 0
    assert res.afc_empresa == int(res.base_imponible_afp * 0.03)

def test_topes_uf(default_settings):
    """Test salary above the UF cap (~3.2M CLP in 2025)."""
    emp = EmployeeInput(
        sueldo_base=10000000, # 10M salary
        gratificacion_legal=True
    )
    
    res = calcular_liquidacion(emp, default_settings, utm_valor=UTM_VALOR)
    
    # Tope AFP is 84.3 UF
    expected_tope = int(84.3 * UF_VALOR)
    assert res.base_imponible_afp == expected_tope
    assert res.afp == int(expected_tope * 0.10)

def test_impuesto_unico_calculation():
    """Verify tax tiers for a person with ~2.5M imponible."""
    # UTM Jan 2025 = 67,294
    # Tramo 2 (4%): 13.5 to 30 UTM
    # If imponible = 1,500,000 -> 22.28 UTM (First tier with tax)
    renta_imponible = 1500000
    expected_tax = int((renta_imponible * 0.04) - (0.54 * UTM_VALOR))
    # 60,000 - 36,338 = 23,662
    
    tax = calcular_impuesto_unico(renta_imponible, UTM_VALOR)
    assert tax == expected_tax

def test_proportional_days(default_settings):
    """Verify pay for 15 days out of 30."""
    emp = EmployeeInput(
        sueldo_base=1000000,
        dias_trabajados=15
    )
    
    res = calcular_liquidacion(emp, default_settings, utm_valor=UTM_VALOR)
    
    assert res.sueldo_base == 500000
    assert res.dias_trabajados == 15

def test_isapre_vs_fonasa(default_settings):
    """Verify Isapre plan in UF vs 7% minimum."""
    plan_uf = 4.0 # ~152k pesos
    emp = EmployeeInput(
        sueldo_base=1000000,
        salud_code="COLMENA",
        plan_salud_uf=plan_uf
    )
    
    res = calcular_liquidacion(emp, default_settings, utm_valor=UTM_VALOR)
    
    # 7% of 1,209,404 (inc. gratif) = ~84,658
    # Plan 4 UF = 4 * 38045.54 = ~152,182
    # Should pay the plan because it's higher than 7%
    expected_salud = int(plan_uf * UF_VALOR)
    assert res.salud_total == expected_salud
