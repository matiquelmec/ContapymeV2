import time
import random
import sys
from calculators.chilean_payroll import (
    PayrollSettings, EmployeeInput, calcular_liquidacion
)

def run_stress_test(num_iterations=1000):
    print(f"Starting Payroll Stress Test: {num_iterations} iterations...")
    
    settings = PayrollSettings(
        sueldo_minimo=529000,
        uf_valor=38045.54,
        uf_tope_afp=84.3,
        uf_tope_salud=84.3,
        uf_tope_afc=126.6,
        afp_sis_pct=1.49
    )
    
    start_time = time.time()
    errors = 0
    error_details = []
    
    for i in range(num_iterations):
        try:
            base = random.randint(500000, 15000000)
            worked_days = random.randint(1, 30)
            contract = random.choice(["indefinido", "fijo", "obra"])
            salud_code = random.choice(["FONASA", "COLMENA", "CONSALUD"])
            plan_uf = round(random.uniform(0, 10), 2) if salud_code != "FONASA" else 0
            
            emp = EmployeeInput(
                sueldo_base=base,
                dias_trabajados=worked_days,
                tipo_contrato=contract,
                salud_code=salud_code,
                plan_salud_uf=plan_uf,
                gratificacion_legal=True,
                afc_active=True
            )
            
            res = calcular_liquidacion(emp, settings, utm_valor=67294.0)
            
            # Sanity checks
            if res.sueldo_liquido < 0:
                msg = f"Liquido negativo: base={base}, dias={worked_days}, contrato={contract}, salud={salud_code}, plan_uf={plan_uf}, liquido={res.sueldo_liquido}"
                error_details.append(msg)
                errors += 1
            if res.total_haberes_brutos < res.sueldo_base and worked_days == 30:
                msg = f"Haberes<Base: base={base}, haberes={res.total_haberes_brutos}"
                error_details.append(msg)
                errors += 1
                 
        except Exception as e:
            msg = f"Exception i={i}: base={base}, dias={worked_days}, contrato={contract}, salud={salud_code}, plan_uf={plan_uf} -> {str(e)}"
            error_details.append(msg)
            errors += 1
            
    end_time = time.time()
    duration = end_time - start_time
    
    print("-" * 60)
    print(f"Stress Test Finished!")
    print(f"Total time: {duration:.2f} seconds")
    print(f"Avg speed: {num_iterations/duration:.2f} calc/sec")
    print(f"Total errors: {errors}")
    
    if error_details:
        print(f"\n--- FIRST 10 ERRORS ---")
        for i, detail in enumerate(error_details[:10]):
            print(f"  [{i+1}] {detail}")
    else:
        print("ALL TESTS PASSED - 0 errors")
    print("-" * 60)

if __name__ == "__main__":
    run_stress_test()
