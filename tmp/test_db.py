import psycopg2
import os

url = "postgresql://postgres:Matigol1234.@db.mofkjgfrpfmtnktaepqi.supabase.co:5432/postgres"
try:
    print("Intentando conectar...")
    conn = psycopg2.connect(url)
    print("¡Conexión exitosa!")
    conn.close()
except Exception as e:
    print(f"Error de conexión: {e}")
