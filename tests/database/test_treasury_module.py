import pytest
from api.routers.accounting import get_supabase
from postgrest.exceptions import APIError


def test_rut_normalization():
    db = get_supabase()

    res = db.rpc("normalize_rut", {"p_rut": "12.345.678-k"}).execute()
    assert res.data == "12345678-K"

    res = db.rpc("normalize_rut", {"p_rut": "  76.123.456-9   "}).execute()
    assert res.data == "76123456-9"


def test_treasury_flow():
    db = get_supabase()

    org_res = db.table("organizations").select("id").limit(1).execute()
    assert org_res.data, "Se requiere al menos una organizacion."
    org_id = org_res.data[0]["id"]

    coa_res = (
        db.table("chart_of_accounts")
        .select("id")
        .eq("organization_id", org_id)
        .limit(2)
        .execute()
    )
    assert len(coa_res.data) >= 2, "Se requieren al menos 2 cuentas contables."
    acc_bank = coa_res.data[0]["id"]

    method_res = db.table("payment_methods").insert({
        "organization_id": org_id,
        "nombre": "Test Transferencia Tesoreria",
        "tipo": "transferencia",
        "chart_account_id": acc_bank,
    }).execute()
    assert len(method_res.data) == 1
    method_id = method_res.data[0]["id"]

    try:
        purchase_res = db.table("purchase_records").insert({
            "organization_id": org_id,
            "rut_emisor": "76.123.456-k",
            "razon_social_emisor": "Proveedor Test Tesoreria",
            "folio": 99999,
            "tipo_documento": "33",
            "fecha_docto": "2029-08-01",
            "monto_neto": 100000,
            "monto_iva": 19000,
            "monto_total": 119000,
            "periodo": "2029-08-01",
            "payment_status": "pending",
        }).execute()
        assert len(purchase_res.data) == 1
        purchase_id = purchase_res.data[0]["id"]
        assert purchase_res.data[0]["rut_emisor"] == "76123456-K"

        payment_res = db.table("treasury_payments").insert({
            "organization_id": org_id,
            "tipo": "pago_proveedor",
            "payment_method_id": method_id,
            "monto": 119000,
            "fecha_pago": "2029-08-05",
            "referencia": "TRANSF-001928",
        }).execute()
        assert len(payment_res.data) == 1
        payment_id = payment_res.data[0]["id"]
        journal_entry_id = payment_res.data[0]["journal_entry_id"]
        assert journal_entry_id is not None

        lines_res = (
            db.table("journal_entry_lines")
            .select("tipo, monto")
            .eq("entry_id", journal_entry_id)
            .execute()
        )
        assert len(lines_res.data) == 2
        assert sum(line["monto"] for line in lines_res.data if line["tipo"] == "debe") == 119000
        assert sum(line["monto"] for line in lines_res.data if line["tipo"] == "haber") == 119000

        link_res = db.table("treasury_payment_documents").insert({
            "payment_id": payment_id,
            "document_type": "purchase_record",
            "document_id": purchase_id,
            "monto_aplicado": 119000,
            "organization_id": org_id,
        }).execute()
        assert len(link_res.data) == 1

        updated_purchase = (
            db.table("purchase_records")
            .select("payment_status")
            .eq("id", purchase_id)
            .single()
            .execute()
        )
        assert updated_purchase.data["payment_status"] == "paid"

        with pytest.raises(APIError):
            db.table("treasury_payment_documents").insert({
                "payment_id": payment_id,
                "document_type": "purchase_record",
                "document_id": purchase_id,
                "monto_aplicado": 1,
                "organization_id": org_id,
            }).execute()

    finally:
        db.table("treasury_payment_documents").delete().eq("organization_id", org_id).execute()
        db.table("treasury_payments").delete().eq("organization_id", org_id).execute()
        db.table("purchase_records").delete().eq("organization_id", org_id).eq("folio", 99999).execute()
        db.table("payment_methods").delete().eq("id", method_id).execute()
