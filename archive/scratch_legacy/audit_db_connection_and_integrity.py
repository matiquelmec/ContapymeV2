from pathlib import Path
import runpy


ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "tools" / "db" / "audit_db_connection_and_integrity.py"

runpy.run_path(str(TARGET), run_name="__main__")
