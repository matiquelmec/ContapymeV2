import requests
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), 'engine', '.env'))

ENGINE_URL = "http://localhost:8000"
# We need a valid employee ID. 
# I'll just skip the token for now since health is open.

def test_endpoint():
    try:
        r = requests.get(f"{ENGINE_URL}/health")
        print(f"Health: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"Error connecting: {e}")

test_endpoint()
