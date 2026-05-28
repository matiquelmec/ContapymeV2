import psycopg2
import socket

# IP de db.mofkjgfrpfmtnktaepqi.supabase.co
IPV6_HOST = "2600:1f16:111a:af02:3f11:6cb7:7066:22a3"
PASSWORD = "Matigol1234."

def test_conn():
    # 1. Probar resolucion a nivel de socket
    print("[*] Diagnosticando socket...")
    try:
        infos = socket.getaddrinfo("db.mofkjgfrpfmtnktaepqi.supabase.co", 5432, socket.AF_UNSPEC, socket.SOCK_STREAM)
        for family, socktype, proto, canonname, sockaddr in infos:
            print(f"  Familia: {family} | Addr: {sockaddr}")
    except Exception as se:
        print(f"  [-] Error de socket: {se}")

    # 2. Conectar directamente usando brackets de IPv6
    url = f"postgresql://postgres:{PASSWORD}@[{IPV6_HOST}]:5432/postgres?sslmode=require"
    print(f"[*] Intentando conectar a: postgresql://postgres:***@[{IPV6_HOST}]:5432/postgres...")
    try:
        conn = psycopg2.connect(url, connect_timeout=5)
        print("[+++] CONECTADO POR IPV6 CON ÉXITO!")
        conn.close()
    except Exception as e:
        print(f"  [-] Error de conexion directa: {e}")

if __name__ == "__main__":
    test_conn()
