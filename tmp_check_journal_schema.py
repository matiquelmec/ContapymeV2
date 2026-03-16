
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("engine/.env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

try:
    res = supabase.table("journal_entries").select("*").limit(1).execute()
    if res.data:
        cols = ",".join(list(res.data[0].keys()))
        print(f"ENTRIES_COLS:{cols}")
    else:
        print("ENTRIES_EMPTY")
    
    res_lines = supabase.table("journal_entry_lines").select("*").limit(1).execute()
    if res_lines.data:
        cols = ",".join(list(res_lines.data[0].keys()))
        print(f"LINES_COLS:{cols}")
    else:
        print("LINES_EMPTY")
except Exception as e:
    print(f"ERR:{str(e)}")
