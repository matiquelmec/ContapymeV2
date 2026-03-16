
import socket

def check_port(host, port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        try:
            s.connect((host, port))
            return True
        except (socket.timeout, ConnectionRefusedError):
            return False

app_up = check_port('localhost', 3000)
engine_up = check_port('localhost', 8000)

print(f"App (3000): {'UP' if app_up else 'DOWN'}")
print(f"Engine (8000): {'UP' if engine_up else 'DOWN'}")
