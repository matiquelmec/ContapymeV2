
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("engine/.env")
url = os.environ.get("DATABASE_URL")

conn = psycopg2.connect(url)
cur = conn.cursor()

try:
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'journal_entries'")
    cols = [r[0] for r in cur.fetchall()]
    print(f"JOURNAL_ENTRIES_COLS:{','.join(cols)}")
    
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'journal_entry_lines'")
    cols_lines = [r[0] for r in cur.fetchall()]
    print(f"JOURNAL_ENTRY_LINES_COLS:{','.join(cols_lines)}")
except Exception as e:
    print(f"ERR:{e}")
finally:
    cur.close()
    conn.close()
