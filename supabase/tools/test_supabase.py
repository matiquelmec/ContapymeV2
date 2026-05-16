from supabase import create_client, Client
import os

URL = "https://mofkjgfrpfmtnktaepqi.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MzM4NzEsImV4cCI6MjA4OTEwOTg3MX0.KNAio9v-sL3BGTLst_M11duLmaoJ2C8hFsFWLtBbJvY"

def test():
    try:
        supabase: Client = create_client(URL, KEY)
        response = supabase.table("employees").select("*").limit(1).execute()
        print("[SUCCESS] Connection established via REST API")
        print(f"[DATA] {response.data}")
    except Exception as e:
        print(f"[ERROR] {str(e)}")

if __name__ == "__main__":
    test()
