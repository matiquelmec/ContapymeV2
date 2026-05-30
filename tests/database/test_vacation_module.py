import pytest
from api.routers.accounting import get_supabase
from postgrest.exceptions import APIError

def test_vacation_module_lifecycle():
    db = get_supabase()
    
    # 1. Obtener una organización y un empleado
    org_res = db.table("organizations").select("id").limit(1).execute()
    assert org_res.data, "Se requiere al menos una organizacion."
    org_id = org_res.data[0]["id"]
    
    emp_res = db.table("employees").select("id").eq("organization_id", org_id).limit(1).execute()
    assert emp_res.data, "Se requiere al menos un empleado para la prueba de vacaciones."
    emp_id = emp_res.data[0]["id"]
    
    # 2. Limpieza de pruebas previas
    db.table("vacation_ledger").delete().eq("employee_id", emp_id).execute()
    db.table("vacation_requests").delete().eq("employee_id", emp_id).execute()
    
    # 3. Insertar abono (accrual) de 15 días en el ledger
    accrual_res = db.table("vacation_ledger").insert({
        "organization_id": org_id,
        "employee_id": emp_id,
        "tipo": "accrual",
        "dias": 15.0,
        "comentarios": "Abono anual de vacaciones de prueba"
    }).execute()
    assert len(accrual_res.data) == 1
    
    # 4. Crear una solicitud de 10 días (estado 'pending')
    request_res = db.table("vacation_requests").insert({
        "organization_id": org_id,
        "employee_id": emp_id,
        "fecha_inicio": "2029-01-10",
        "fecha_fin": "2029-01-20",
        "dias_solicitados": 10.0,
        "status": "pending"
    }).execute()
    assert len(request_res.data) == 1
    request_id = request_res.data[0]["id"]
    
    # 5. Aprobar la solicitud de 10 días
    approve_res = db.table("vacation_requests").update({"status": "approved"}).eq("id", request_id).execute()
    assert approve_res.data[0]["status"] == "approved"
    
    # Verificar que se creó automáticamente la transacción de uso ('usage') con -10 días
    ledger_usage = db.table("vacation_ledger").select("*") \
        .eq("request_id", request_id) \
        .eq("tipo", "usage") \
        .execute()
    assert len(ledger_usage.data) == 1
    assert float(ledger_usage.data[0]["dias"]) == -10.0
    
    # 6. Intentar crear y aprobar una solicitud que exceda el saldo real disponible
    balance_res = db.rpc("fn_employee_vacation_balance", {"p_employee_id": emp_id}).execute()
    current_balance = float(balance_res.data)
    exceed_days = round(current_balance + 1.0, 1)

    exceed_req_res = db.table("vacation_requests").insert({
        "organization_id": org_id,
        "employee_id": emp_id,
        "fecha_inicio": "2029-02-01",
        "fecha_fin": "2029-02-10",
        "dias_solicitados": exceed_days,
        "status": "pending"
    }).execute()
    assert len(exceed_req_res.data) == 1
    exceed_req_id = exceed_req_res.data[0]["id"]
    
    # Debe fallar al intentar aprobar
    with pytest.raises(APIError) as exc_info:
        db.table("vacation_requests").update({"status": "approved"}).eq("id", exceed_req_id).execute()
    assert "no posee suficientes dias de vacaciones" in str(exc_info.value)
    
    # 7. Cancelar la primera solicitud y verificar la remoción del registro de uso en el ledger
    cancel_res = db.table("vacation_requests").update({"status": "cancelled"}).eq("id", request_id).execute()
    assert cancel_res.data[0]["status"] == "cancelled"
    
    # Verificar que el registro de uso en el ledger desapareció
    ledger_usage_cancelled = db.table("vacation_ledger").select("*") \
        .eq("request_id", request_id) \
        .eq("tipo", "usage") \
        .execute()
    assert len(ledger_usage_cancelled.data) == 0
    
    # 8. Verificar restricción CHECK (vacation_ledger_dias_check)
    # 8.1. Intentar accrual con días negativos
    with pytest.raises(APIError) as exc_info:
        db.table("vacation_ledger").insert({
            "organization_id": org_id,
            "employee_id": emp_id,
            "tipo": "accrual",
            "dias": -5.0
        }).execute()
    assert "new row for relation" in str(exc_info.value) or "violates check constraint" in str(exc_info.value)

    # 8.2. Intentar usage con días positivos
    with pytest.raises(APIError) as exc_info:
        db.table("vacation_ledger").insert({
            "organization_id": org_id,
            "employee_id": emp_id,
            "tipo": "usage",
            "dias": 5.0
        }).execute()
    assert "new row for relation" in str(exc_info.value) or "violates check constraint" in str(exc_info.value)

    # 8.3. Intentar adjustment con 0 días
    with pytest.raises(APIError) as exc_info:
        db.table("vacation_ledger").insert({
            "organization_id": org_id,
            "employee_id": emp_id,
            "tipo": "adjustment",
            "dias": 0.0
        }).execute()
    assert "new row for relation" in str(exc_info.value) or "violates check constraint" in str(exc_info.value)

    # 9. Limpieza final de la prueba
    db.table("vacation_ledger").delete().eq("employee_id", emp_id).execute()
    db.table("vacation_requests").delete().eq("employee_id", emp_id).execute()
