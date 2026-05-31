import os
import psycopg2
from dotenv import load_dotenv

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

import re
match = re.search(r"postgresql://([^:]+):([^@]+)@db\.([^.]+)\.supabase\.co:5432/(.+)", db_url)
if not match:
    print("Could not parse DATABASE_URL to get project details.")
    exit(1)

user_base, password, project_ref, dbname = match.groups()
print(f"Parsed project ref: {project_ref}")

regions = [
    "sa-east-1", "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "ca-central-1", "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1",
    "eu-north-1", "ap-south-1", "ap-southeast-1", "ap-southeast-2",
    "ap-northeast-1", "ap-northeast-2"
]

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    pooler_user = f"{user_base}.{project_ref}"
    print(f"Region '{region}' ({host}):")
    try:
        conn = psycopg2.connect(
            host=host,
            port=6543,
            user=pooler_user,
            password=password,
            database=dbname,
            connect_timeout=2
        )
        print("  Connected!")
        conn.close()
        break
    except Exception as e:
        print(f"  Error: {e}")
