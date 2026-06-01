import socket

for host in ["mofkjgfrpfmtnktaepqi.supabase.co", "db.mofkjgfrpfmtnktaepqi.supabase.co", "google.com"]:
    try:
        ip = socket.gethostbyname(host)
        print(f"Host: {host} -> IP: {ip}")
    except Exception as e:
        print(f"Host: {host} -> Error: {e}")
