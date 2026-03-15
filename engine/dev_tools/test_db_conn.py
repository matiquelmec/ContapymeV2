import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Using the IP found via nslookup/ping earlier if possible
# Let's try to get the IP again but via a different method
import socket

try:
    # Supabase projects usually have static IPs or predictable ones
    # But since nslookup failed for A, let's try to connect via the hostname but with a longer timeout
    hostname = "db.mofkjgfrpfmtnktaepqi.supabase.co"
    print(f"Resolving {hostname}...")
    addr_info = socket.getaddrinfo(hostname, 5432)
    print(f"Addresses: {addr_info}")
except Exception as e:
    print(f"Resolution failed: {e}")

db_url = os.environ.get("DATABASE_URL")

try:
    print(f"Connecting to {db_url}...")
    conn = psycopg2.connect(db_url, connect_timeout=10)
    print("Success!")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
