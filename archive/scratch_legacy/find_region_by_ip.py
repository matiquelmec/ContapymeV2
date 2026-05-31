import json
import requests
import ipaddress

ipv6_target = "2600:1f16:111a:af02:3f11:6cb7:7066:22a3"
target_ip = ipaddress.IPv6Address(ipv6_target)

print(f"Searching region for target IPv6: {ipv6_target}...")

url = "https://ip-ranges.amazonaws.com/ip-ranges.json"
try:
    r = requests.get(url, timeout=10)
    data = r.json()
    
    found_region = None
    for prefix in data.get("ipv6_prefixes", []):
        try:
            net = ipaddress.IPv6Network(prefix["ipv6_prefix"])
            if target_ip in net:
                print(f"Found match: {prefix['ipv6_prefix']} | Region: {prefix['region']} | Service: {prefix['service']}")
                found_region = prefix['region']
        except Exception:
            continue
            
    if not found_region:
        print("No matching IPv6 prefix found in AWS ip-ranges.json.")
except Exception as e:
    print(f"Error fetching/parsing AWS ip-ranges: {e}")
