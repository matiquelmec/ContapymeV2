import sys
import os
import re

# Agregar engine al path
sys.path.append(os.path.abspath("engine"))

print("======================================================================")
print("  CONTAPYMEPUQ - PROGRAMMATIC AUDIT CHECKS")
print("======================================================================")

# ── CHEQUEO 1: Discrepancia de Parámetros Nacionales ──
print("\n[CHECK 1] SSoT: Parametros de Asignacion Familiar")
try:
    from calculators.chilean_payroll import calcular_asignacion_familiar
    from calculators.national_params import ASIGNACION_FAMILIAR
    
    rentas = [500000, 700000, 1000000]
    mismatches = False
    
    for r in rentas:
        val_payroll = calcular_asignacion_familiar(r, 1)
        
        val_params = 0
        for tramo in ["tramo_a", "tramo_b", "tramo_c"]:
            if r <= ASIGNACION_FAMILIAR[tramo]["tope_renta"]:
                val_params = ASIGNACION_FAMILIAR[tramo]["monto"]
                break
                
        if val_payroll != val_params:
            print(f"  [X] DISCREPANCIA para Renta Imponible {r}:")
            print(f"      - calculators/chilean_payroll.py: {val_payroll}")
            print(f"      - calculators/national_params.py: {val_params}")
            mismatches = True
            
    if not mismatches:
        print("  [OK] No se encontraron discrepancias en los tramos de asignacion familiar.")
except Exception as e:
    print(f"  [ERROR] Error ejecutando Check 1: {e}")


# ── CHEQUEO 2: Scope de dte_issued en Criptografía ──
print("\n[CHECK 2] Crypto-Chain: Scope de dte_issued en dte_logic.py")
try:
    with open("engine/core/dte/dte_logic.py", "r", encoding="utf-8") as f:
        dte_content = f.read()
        
    prev_hash_matches = re.search(r"def _get_previous_hash\(.*?\):.*?(?=\n\s*def|\Z)", dte_content, re.DOTALL)
    if prev_hash_matches:
        code_block = prev_hash_matches.group(0)
        if "organization_id" in code_block and "company_id" not in code_block:
            print("  [X] ALERTA: _get_previous_hash utiliza 'organization_id' en lugar de 'company_id'.")
            print("      Esto causara colisiones en esquemas multi-empresa por organizacion.")
        else:
            print("  [OK] _get_previous_hash parece estar utilizando el scope correcto.")
            
    verify_matches = re.search(r"async def verify_chain_integrity\(.*?\):.*?(?=\n\s*def|\Z)", dte_content, re.DOTALL)
    if verify_matches:
        code_block = verify_matches.group(0)
        if "organization_id" in code_block and "company_id" not in code_block:
            print("  [X] ALERTA: verify_chain_integrity utiliza 'organization_id' en lugar de 'company_id'.")
            print("      La verificacion fallara (dara Falso Negativo) si hay mas de una empresa en la organizacion.")
        else:
            print("  [OK] verify_chain_integrity parece estar utilizando el scope correcto.")
except Exception as e:
    print(f"  [ERROR] Error ejecutando Check 2: {e}")


# ── CHEQUEO 3: Variables de Entorno en render.yaml ──
print("\n[CHECK 3] IaC: Variables de entorno en render.yaml")
try:
    with open("render.yaml", "r", encoding="utf-8") as f:
        render_content = f.read()
        
    if "DTE_MASTER_CERT_PASSWORD" not in render_content:
        print("  [X] ALERTA: 'DTE_MASTER_CERT_PASSWORD' no esta declarada como placeholder en render.yaml.")
        print("      Esto puede causar problemas durante el despliegue automatico si se requiere el certificado maestro.")
    else:
        print("  [OK] 'DTE_MASTER_CERT_PASSWORD' esta declarada en render.yaml.")
except Exception as e:
    print(f"  [ERROR] Error ejecutando Check 3: {e}")


# ── CHEQUEO 4: Next.js Hydration Warning en dashboard ──
print("\n[CHECK 4] Frontend: Hydration Warning en dashboard client")
try:
    with open("app/src/app/dashboard/executive-dashboard-client.tsx", "r", encoding="utf-8") as f:
        dash_content = f.read()
        
    if "suppressHydrationWarning" in dash_content:
        print("  [X] ALERTA: Se detecto el uso de 'suppressHydrationWarning' para ocultar warnings de hidratacion.")
        print("      Se debe implementar un chequeo de montaje (useMounted) para evitar discrepancias por Zustand persist.")
    else:
        print("  [OK] No se encontro 'suppressHydrationWarning' en el dashboard client.")
except Exception as e:
    print(f"  [ERROR] Error ejecutando Check 4: {e}")

print("\n======================================================================")
print("  COMPLETED")
print("======================================================================")
