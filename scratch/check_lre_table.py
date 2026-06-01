import os
import sys
sys.path.append(r"C:\Users\Matías Riquelme\Desktop\SistemaRemuneraciones_Export")

import sqlite3

conn = sqlite3.connect(r"C:\Users\Matías Riquelme\Desktop\SistemaRemuneraciones_Export\database\remuneraciones.db")
cursor = conn.cursor()

# Consultar columnas de la tabla liquidaciones
cursor.execute("PRAGMA table_info(liquidaciones)")
cols = cursor.fetchall()
print("Columnas de liquidaciones:")
for col in cols:
    print(f" - {col[1]} ({col[2]})")

# Consultar columnas de la tabla trabajadores
cursor.execute("PRAGMA table_info(trabajadores)")
cols_t = cursor.fetchall()
print("\nColumnas de trabajadores:")
for col in cols_t:
    print(f" - {col[1]} ({col[2]})")

conn.close()
