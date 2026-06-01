import httpx

url = "https://cloudflare-dns.com/dns-query"
headers = {"accept": "application/dns-json"}
host = "aws-0-us-east-2.pooler.supabase.com"

try:
    resp = httpx.get(url, headers=headers, params={"name": host, "type": "A"}, timeout=10.0)
    data = resp.json()
    print(f"=== {host} ===")
    if "Answer" in data:
        for ans in data["Answer"]:
            print(f"IP: {ans['data']}")
    else:
        print("No se encontró respuesta A.")
except Exception as e:
    print(f"Error DoH: {e}")
