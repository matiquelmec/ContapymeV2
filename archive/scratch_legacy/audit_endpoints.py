import os
import re

ROUTERS_DIR = "engine/api/routers"

print("======================================================================")
print("  CONTAPYMEPUQ - FASTAPI ENDPOINTS SECURITY AUDIT")
print("======================================================================")

endpoints_found = 0
unprotected_endpoints = 0

for filename in os.listdir(ROUTERS_DIR):
    if not filename.endswith(".py") or filename == "__init__.py":
        continue
        
    filepath = os.path.join(ROUTERS_DIR, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Buscar decoradores de ruta tipo @router.get, @router.post, etc.
    # Y capturar la definición de la función asociada para analizar sus argumentos.
    matches = re.finditer(r"@router\.(get|post|put|delete|patch)\(\"([^\"]+)\".*?\)\s*async\s+def\s+(\w+)\((.*?)\):", content, re.DOTALL)
    
    file_printed = False
    for match in matches:
        method = match.group(1).upper()
        path = match.group(2)
        func_name = match.group(3)
        args = match.group(4)
        
        endpoints_found += 1
        
        # Verificar si usa Depends(verify_token) o Depends(verify_org_role) o similares
        is_protected = "Depends(" in args
        
        if not is_protected:
            if not file_printed:
                print(f"\n[FILE] {filename}")
                file_printed = True
            print(f"  [UNPROTECTED] {method} {path} -> {func_name}()")
            unprotected_endpoints += 1

print("\n======================================================================")
print(f"  AUDITORÍA FINALIZADA")
print(f"  Endpoints evaluados: {endpoints_found}")
print(f"  Endpoints desprotegidos detectados: {unprotected_endpoints}")
print("======================================================================")
