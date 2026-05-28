import os
from dotenv import load_dotenv
from supabase import create_client

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
db = create_client(url, key)

# Get Folio 10 record
res = db.table("dte_issued")\
    .select("company_id, organization_id, folio")\
    .eq("folio", 10)\
    .eq("tipo_dte", 39)\
    .execute()

if res.data:
    d = res.data[0]
    comp_id = d["company_id"]
    org_id = d["organization_id"]
    print(f"\nFolio 10 details:")
    print(f"  Company ID:      {comp_id}")
    print(f"  Organization ID: {org_id}")
    
    # Query company details
    comp_res = db.table("dte_companies")\
        .select("*")\
        .eq("id", comp_id)\
        .execute()
        
    if comp_res.data:
        c = comp_res.data[0]
        print(f"\nCompany details from DB:")
        print(f"  ID:            {c['id']}")
        print(f"  RUT:           {c['rut']}")
        print(f"  Razon Social:  {c['razon_social']}")
        print(f"  ACTECO:        '{c['acteco']}' (type: {type(c['acteco'])})")
    else:
        print("Company not found in dte_companies!")
else:
    print("DTE Folio 10 not found.")
