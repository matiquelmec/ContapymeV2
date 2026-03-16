
import sys
import os

# Añadir el directorio engine al sys.path para importar los módulos correctamente
sys.path.append(r'c:\Users\Matías Riquelme\Desktop\Contapymepuq\engine')

from calculators.chilean_payroll import (
    EmployeeInput,
    PayrollSettings,
    calcular_liquidacion,
    to_db_dict
)

def test_dry_run():
    print("=== TEST DE ALINEACIÓN PROFESIONAL (DRY RUN) ===")
    
    # 1. Configuración Mock (Valores de Marzo 2026 proyectados)
    settings = PayrollSettings(
        uf_valor=38500.0,
        uf_tope_afp=87.8,
        sueldo_minimo=529000,
        afp_sis_pct=1.49
    )
    
    # 2. Entrada de Empleado con campos nuevos
    emp_input = EmployeeInput(
        sueldo_base=1200000,
        tipo_contrato="indefinido",
        afp_code="HABITAT",
        afp_comision_pct=1.27,
        salud_code="FONASA",
        salud_pct=7.0,
        gratificacion_legal=True,
        asignacion_colacion=60000,
        asignacion_movilizacion=40000,
        horas_extra=0,
        dias_trabajados=30
    )
    
    # 3. Calcular
    result = calcular_liquidacion(emp_input, settings, utm_valor=67300.0)
    
    # 4. Generar Diccionario para DB
    db_payload = to_db_dict(
        result, 
        org_id="00000000-0000-0000-0000-000000000000", 
        emp_id="11111111-1111-1111-1111-111111111111", 
        periodo="2026-03-01"
    )
    
    # 5. Verificar campos críticos alineados
    critical_fields = [
        "seguro_invalidez", "sis_empresa", 
        "bono_colacion", "asignacion_colacion",
        "afp_comision", "uf_valor_usado", 
        "base_imponible_afp", "dias_trabajados"
    ]
    
    print("\n[RESUMEN DE CAMPOS ALINEADOS]")
    for field in critical_fields:
        val = db_payload.get(field, "MISSING ❌")
        print(f" -> {field:25}: {val}")
    
    print("\n[PAYLOAD COMPLETO PARA SUPABASE]")
    import json
    print(json.dumps(db_payload, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    test_dry_run()
