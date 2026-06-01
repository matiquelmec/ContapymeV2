import httpx
import ipaddress

ipv6_target = "2600:1f16:111a:af02:3f11:6cb7:7066:22a3"
target_ip = ipaddress.IPv6Address(ipv6_target)

url = "https://ip-ranges.amazonaws.com/ip-ranges.json"

try:
    print("Descargando rangos de IP de AWS...")
    resp = httpx.get(url, timeout=15.0)
    data = resp.json()
    
    found_region = None
    print("Buscando coincidencia de subred IPv6...")
    for prefix in data.get("ipv6_prefixes", []):
        net = ipaddress.IPv6Network(prefix["ipv6_prefix"])
        if target_ip in net:
            found_region = prefix["region"]
            print(f"¡Coincidencia encontrada!")
            print(f"Prefijo: {prefix['ipv6_prefix']}")
            print(f"Región: {found_region}")
            print(f"Servicio: {prefix['service']}")
            break
            
    if not found_region:
        print("No se encontró una coincidencia exacta de subred IPv6 en los rangos publicados de AWS.")
except Exception as e:
    print(f"Error: {e}")
