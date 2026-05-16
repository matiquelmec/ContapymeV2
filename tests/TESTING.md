# 🧪 Centro de Pruebas Unificado — Contapymepuq

Este directorio centraliza todas las verificaciones del sistema para garantizar la estabilidad institucional.

---

## 🚀 Cómo ejecutar las pruebas

### 1. Pruebas del Motor (Python)
Valida la lógica de cálculos y nómina chilena.
```powershell
pytest tests/engine
```

### 2. Pruebas de Base de Datos
Valida la conexión con Supabase y la integridad de los esquemas.
```powershell
pytest tests/database
```

### 3. Pruebas de Integración (DTE / RCV)
Valida el flujo completo de emisión de documentos y auditoría real.
```powershell
pytest tests/integration
```

---

## 🛡️ Estándares de Calidad
- **Aislamiento**: Cada prueba debe limpiar sus propios datos.
- **Determinismo**: Las pruebas deben dar el mismo resultado independientemente del entorno.
- **SSoT**: Las pruebas de integración usan el motor real para validar la base de datos.
