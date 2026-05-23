from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from core.database import get_supabase
from core.auth import verify_token, verify_org_role
from core.logger import log_activity

router = APIRouter()

class GenerateFromRCVRequest(BaseModel):
    organization_id: str
    periodo: str
    type: str

class GenerateFromPayrollRequest(BaseModel):
    organization_id: str
    periodo: str

class CreateAccountRequest(BaseModel):
    organization_id: str
    codigo: str
    nombre: str
    nivel: int
    tipo: str
    naturaleza: str
    parent_codigo: Optional[str] = None
    acepta_movimiento: bool = True
    descripcion: Optional[str] = None

class UpdateAccountRequest(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    is_active: Optional[bool] = None
    tipo: Optional[str] = None
    naturaleza: Optional[str] = None

class UpdateAccountingConfigRequest(BaseModel):
    module_name: Optional[str] = "accounting"
    transaction_type: Optional[str] = "generic"
    # Cuentas Generales / RCV
    tax_account_code: Optional[str] = None
    tax_account_name: Optional[str] = None
    revenue_account_code: Optional[str] = None
    revenue_account_name: Optional[str] = None
    asset_account_code: Optional[str] = None
    asset_account_name: Optional[str] = None
    # Cuentas de Nómina (Payroll)
    expense_salary_code: Optional[str] = None
    expense_salary_name: Optional[str] = None
    expense_social_code: Optional[str] = None
    expense_social_name: Optional[str] = None
    liability_afp_code: Optional[str] = None
    liability_afp_name: Optional[str] = None
    liability_salud_code: Optional[str] = None
    liability_salud_name: Optional[str] = None
    liability_afc_code: Optional[str] = None
    liability_afc_name: Optional[str] = None
    liability_tax_code: Optional[str] = None
    liability_tax_name: Optional[str] = None
    liability_net_code: Optional[str] = None
    liability_net_name: Optional[str] = None
    # Cuentas de Impuestos (F29)
    tax_iva_debito_code: Optional[str] = None
    tax_iva_debito_name: Optional[str] = None
    tax_iva_credito_code: Optional[str] = None
    tax_iva_credito_name: Optional[str] = None
    tax_ppm_code: Optional[str] = None
    tax_ppm_name: Optional[str] = None
    tax_retentions_code: Optional[str] = None
    tax_retentions_name: Optional[str] = None
    tax_f29_payable_code: Optional[str] = None
    tax_f29_payable_name: Optional[str] = None
    tax_iva_remanente_code: Optional[str] = None
    tax_iva_remanente_name: Optional[str] = None
    # Cuentas de Activos Fijos (Assets)
    asset_depreciation_expense_code: Optional[str] = None
    asset_depreciation_expense_name: Optional[str] = None
    asset_accumulated_depreciation_code: Optional[str] = None
    asset_accumulated_depreciation_name: Optional[str] = None
    is_active: Optional[bool] = True

class AccountMappingRuleRequest(BaseModel):
    organization_id: str
    context: str # Puede ser RUT o concepto
    account_id: str
    is_active: bool = True

def get_accounting_config(db, org_id: str, module: str, tx_type: str):
    """
    Busca la configuración de cuentas para un módulo y tipo.
    Si no existe, devuelve valores por defecto.
    """
    res = db.table("centralized_account_config").select("*") \
        .eq("organization_id", org_id) \
        .eq("module_name", module) \
        .eq("transaction_type", tx_type) \
        .eq("is_active", True) \
        .execute()
    
    if res.data and len(res.data) > 0:
        return res.data[0]
    
    # Valores por defecto (compatibilidad hacia atrás)
    if module == 'rcv' and tx_type == 'purchases':
        return {
            "tax_account_code": "1.1.03.001", "tax_account_name": "IVA Crédito Fiscal",
            "revenue_account_code": "5.1.01.001", "revenue_account_name": "Costo de Ventas",
            "asset_account_code": "2.1.01.001", "asset_account_name": "Proveedores Nacionales"
        }
    elif module == 'rcv' and tx_type == 'sales':
        return {
            "tax_account_code": "2.1.02.001", "tax_account_name": "IVA Débito Fiscal",
            "revenue_account_code": "4.1.01.001", "revenue_account_name": "Ventas de Mercaderías",
            "asset_account_code": "1.1.02.001", "asset_account_name": "Clientes Nacionales"
        }
    elif module == 'payroll':
        # Default accounts for Payroll (Remuneraciones)
        return {
            "expense_salary_code": "5.1.02.001", "expense_salary_name": "Sueldos y Salarios",
            "expense_social_code": "5.1.02.002", "expense_social_name": "Leyes Sociales Empresa",
            "liability_afp_code": "2.1.04.004", "liability_afp_name": "AFP por Pagar",
            "liability_salud_code": "2.1.04.005", "liability_salud_name": "Salud por Pagar",
            "liability_afc_code": "2.1.04.006", "liability_afc_name": "AFC por Pagar",
            "liability_tax_code": "2.1.03.001", "liability_tax_name": "Impuesto Único Retenido por Pagar",
            "liability_net_code": "2.1.04.001", "liability_net_name": "Sueldos por Pagar"
        }
    return None

def get_all_mapping_rules(db, org_id: str) -> Dict[str, Dict[str, str]]:
    """Busca todas las reglas de mapeo para una organización y las devuelve en un mapa."""
    res = db.table("account_mapping_rules").select("context, chart_of_accounts(codigo, nombre)") \
        .eq("organization_id", org_id) \
        .eq("is_active", True) \
        .execute()
    
    mapping_map = {}
    for rule in (res.data or []):
        ctx = rule.get("context")
        acc = rule.get("chart_of_accounts")
        if ctx and acc:
            mapping_map[ctx] = {"codigo": acc["codigo"], "nombre": acc["nombre"]}
    return mapping_map

@router.post("/generate-from-rcv")
async def generate_from_rcv(
    req: GenerateFromRCVRequest,
    current_user: dict = Depends(verify_token)
):
    db = get_supabase()
    try:
        # Normalizar periodo globalmente para la función
        periodo_query = req.periodo
        if len(periodo_query) == 7: # YYYY-MM -> YYYY-MM-01
            periodo_query = f"{periodo_query}-01"

        config = get_accounting_config(db, req.organization_id, 'rcv', req.type)
        if not config:
            raise HTTPException(status_code=400, detail=f"No hay configuración contable para {req.type}")

        # Optimizando: obtenemos todas las reglas de una vez (Adiós N+1)
        mapping_rules = get_all_mapping_rules(db, req.organization_id)

        # Mapa de nombres de documentos para la glosa
        doc_names = {
            '33': 'Factura Electrónica',
            '34': 'Factura Exenta',
            '39': 'Boleta Electrónica',
            '41': 'Boleta Exenta',
            '45': 'Factura de Compra',
            '46': 'Factura de Compra Elect.',
            '56': 'Nota de Débito',
            '61': 'Nota de Crédito',
            '110': 'Factura Exportación',
            '111': 'Nota de Débito Export.',
            '112': 'Nota de Crédito Export.'
        }

        def to_int(val):
            try: return int(float(val or 0))
            except: return 0

        # ===== BATCH ATÓMICO: Recopilamos TODOS los asientos antes de insertarlos =====
        batch_entries = []

        if req.type == 'purchases':
            # 1. Identificar el lote (import_id) de este periodo
            imp_res = db.table("rcv_imports").select("id").eq("organization_id", req.organization_id).eq("periodo", periodo_query).eq("tipo", "purchases").execute()
            imp_ids = [i["id"] for i in (imp_res.data or [])]

            # 2. Buscar registros por periodo O por pertenencia al lote (import_id)
            # Esto resuelve el problema de facturas de meses pasados que el trigger movió de periodo
            query = db.table("purchase_records").select("*").eq("organization_id", req.organization_id).is_("journal_entry_id", "null")
            
            if imp_ids:
                res = query.or_(f"periodo.eq.{periodo_query},import_id.in.({','.join(imp_ids)})").execute()
            else:
                res = query.eq("periodo", periodo_query).execute()
            
            records = res.data or []
            
            for rec in records:
                monto_total = to_int(rec.get("monto_total"))
                if monto_total == 0:
                    continue

                rut_emisor = str(rec.get("rut_emisor", ""))
                mapping_acc = mapping_rules.get(rut_emisor) # Búsqueda O(1) en el mapa local
                
                gasto_code = mapping_acc["codigo"] if mapping_acc else config["revenue_account_code"]
                gasto_name = mapping_acc["nombre"] if mapping_acc else config["revenue_account_name"]

                es_suma = rec.get("es_suma", True)
                tipo_doc_id = str(rec.get("tipo_documento", "33"))
                doc_name = doc_names.get(tipo_doc_id, f"Doc.{tipo_doc_id}")
                partner = rec.get('razon_social_emisor', 'S/N')
                glosa = f"{doc_name} Folio {rec['folio']} - {partner}"
                if not es_suma: glosa = f"[AJUSTE] {glosa}"

                monto_neto = to_int(rec.get("monto_neto"))
                monto_exento = to_int(rec.get("monto_exento"))
                monto_iva = to_int(rec.get("monto_iva"))
                monto_base = monto_neto + monto_exento

                if abs(monto_base + monto_iva) != abs(monto_total):
                    monto_base = abs(monto_total) - abs(monto_iva)

                lines = []
                tipo_gasto = "debe" if es_suma else "haber"
                tipo_pasivo = "haber" if es_suma else "debe"

                if monto_base != 0:
                    lines.append({"cuenta_codigo": gasto_code, "cuenta_nombre": gasto_name, "tipo": tipo_gasto, "monto": abs(monto_base)})
                if monto_iva != 0:
                    lines.append({"cuenta_codigo": config["tax_account_code"], "cuenta_nombre": config["tax_account_name"], "tipo": tipo_gasto, "monto": abs(monto_iva)})
                if monto_total != 0:
                    lines.append({"cuenta_codigo": config["asset_account_code"], "cuenta_nombre": config["asset_account_name"], "tipo": tipo_pasivo, "monto": abs(monto_total)})

                if lines:
                    batch_entries.append({
                        "fecha": rec["fecha_docto"],
                        "glosa": glosa,
                        "record_id": rec["id"],
                        "record_table": "purchase_records",
                        "lines": lines
                    })

        elif req.type == 'sales':
            # 1. Identificar el lote (import_id)
            imp_res = db.table("rcv_imports").select("id").eq("organization_id", req.organization_id).eq("periodo", periodo_query).eq("tipo", "sales").execute()
            imp_ids = [i["id"] for i in (imp_res.data or [])]

            # 2. Buscar por periodo O lote (permite contabilizar facturas emitidas con fecha anterior)
            query = db.table("sales_records").select("*").eq("organization_id", req.organization_id).is_("journal_entry_id", "null")
            
            if imp_ids:
                res = query.or_(f"periodo.eq.{periodo_query},import_id.in.({','.join(imp_ids)})").execute()
            else:
                res = query.eq("periodo", periodo_query).execute()

            records = res.data or []
            
            for rec in records:
                monto_total = to_int(rec.get("monto_total"))
                if monto_total == 0:
                    continue

                rut_receptor = str(rec.get("rut_receptor", ""))
                mapping_acc = mapping_rules.get(rut_receptor) # Búsqueda O(1) en el mapa local
                
                ingreso_code = mapping_acc["codigo"] if mapping_acc else config["revenue_account_code"]
                ingreso_name = mapping_acc["nombre"] if mapping_acc else config["revenue_account_name"]

                es_suma = rec.get("es_suma", True)
                tipo_doc_id = str(rec.get("tipo_documento", "33"))
                doc_name = doc_names.get(tipo_doc_id, f"Doc.{tipo_doc_id}")
                partner = rec.get('razon_social_receptor', 'S/N')
                glosa = f"{doc_name} Folio {rec['folio']} - {partner}"
                if not es_suma: glosa = f"[AJUSTE] {glosa}"

                monto_neto = to_int(rec.get("monto_neto"))
                monto_exento = to_int(rec.get("monto_exento"))
                monto_iva = to_int(rec.get("monto_iva"))
                monto_base = monto_neto + monto_exento

                if abs(monto_base + monto_iva) != abs(monto_total):
                    monto_base = abs(monto_total) - abs(monto_iva)

                lines = []
                tipo_activo = "debe" if es_suma else "haber"
                tipo_ingreso = "haber" if es_suma else "debe"

                if monto_total != 0:
                    lines.append({"cuenta_codigo": config["asset_account_code"], "cuenta_nombre": config["asset_account_name"], "tipo": tipo_activo, "monto": abs(monto_total)})
                if monto_iva != 0:
                    lines.append({"cuenta_codigo": config["tax_account_code"], "cuenta_nombre": config["tax_account_name"], "tipo": tipo_ingreso, "monto": abs(monto_iva)})
                if monto_base != 0:
                    lines.append({"cuenta_codigo": ingreso_code, "cuenta_nombre": ingreso_name, "tipo": tipo_ingreso, "monto": abs(monto_base)})

                if lines:
                    batch_entries.append({
                        "fecha": rec["fecha_docto"],
                        "glosa": glosa,
                        "record_id": rec["id"],
                        "record_table": "sales_records",
                        "lines": lines
                    })

        # ===== EJECUTAR BATCH ATÓMICO =====
        count = 0
        if batch_entries:
            try:
                rpc_res = db.rpc("batch_create_journal_entries", {
                    "p_organization_id": req.organization_id,
                    "p_entries": batch_entries
                }).execute()
                
                if rpc_res.data and rpc_res.data.get("success"):
                    count = rpc_res.data.get("entries_created", 0)
            except Exception as batch_err:
                # Fallback: si la RPC batch no existe todavía, usar método legacy individual
                print(f"[WARN] batch_create_journal_entries no disponible, usando fallback individual: {batch_err}")
                for entry in batch_entries:
                    try:
                        rpc_res = db.rpc("create_journal_entry_with_lines", {
                            "p_organization_id": req.organization_id,
                            "p_fecha": entry["fecha"],
                            "p_glosa": entry["glosa"],
                            "p_lines": entry["lines"]
                        }).execute()
                        
                        if rpc_res.data:
                            table = entry["record_table"]
                            db.table(table).update({"journal_entry_id": rpc_res.data}).eq("id", entry["record_id"]).execute()
                            count += 1
                    except Exception as e_inner:
                        print(f"[ERROR] Fallback entry failed: {e_inner}")

        # REGISTRAR EN BITÁCORA (AUDIT LOG)
        log_activity(
            action="generate_accounting_from_rcv",
            organization_id=req.organization_id,
            user_id=current_user.get("id"),
            entity_type="accounting_period",
            entity_id=f"{req.organization_id}_{req.periodo}_{req.type}",
            details={
                "periodo": req.periodo,
                "type": req.type,
                "entries_created": count,
                "mode": "batch_atomic" if batch_entries and count == len(batch_entries) else "legacy_fallback"
            }
        )

        return {"success": True, "entries_created": count}
    except Exception as e:
        print(f"[ERROR generate_from_rcv] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-from-payroll")
async def generate_from_payroll(req: GenerateFromPayrollRequest):
    """
    Centraliza las remuneraciones aprobadas en un asiento contable.
    Crea un comprobante por todas las liquidaciones en estado 'aprobado'.
    """
    db = get_supabase()
    try:
        config = get_accounting_config(db, req.organization_id, 'payroll', 'monthly')
        
        # Obtener liquidaciones
        res = db.table("liquidations").select("*") \
            .eq("organization_id", req.organization_id) \
            .eq("periodo", req.periodo) \
            .execute()
        
        liquidations = res.data or []
        if not liquidations:
            return {"success": True, "entries_created": 0, "message": "No hay liquidaciones."}

        # Totales para el asiento agrupado
        t_haberes = 0
        t_leyes_empresa = 0
        t_afp = 0
        t_salud = 0
        t_afc = 0
        t_impuestos = 0
        t_liquido = 0

        # Sumarización
        for liq in liquidations:
            t_haberes += int(liq.get("total_haberes_brutos", 0) or 0)
            
            # Gasto leyes sociales: Seguro Invalidez + AFC empleador
            sis = int(liq.get("sis_empresa", 0) or liq.get("seguro_invalidez", 0) or 0)
            afc_emp = int(liq.get("afc_empresa", 0) or 0)
            t_leyes_empresa += (sis + afc_emp)
            
            # Pasivos
            afp_total = int(liq.get("afp", 0) or 0) + int(liq.get("afp_comision", 0) or 0) + sis
            t_afp += afp_total
            
            t_salud += int(liq.get("salud", 0) or 0) + int(liq.get("salud_voluntaria", 0) or 0)
            
            afc_trab = int(liq.get("afc_trabajador", 0) or 0)
            t_afc += (afc_trab + afc_emp)
            
            t_impuestos += int(liq.get("impuesto_unico", 0) or 0)
            t_liquido += int(liq.get("sueldo_liquido", 0) or 0)

        # Auto-crear las cuentas contables de nómina si no existen (RPC robusta con ON CONFLICT)
        try:
            db.rpc("ensure_payroll_accounts", {"p_org_id": req.organization_id}).execute()
        except Exception as e:
            print(f"[PRE-CHECK] Error asegurando cuentas de nómina: {e}")

        # Preparar las líneas del asiento
        lines_to_insert = []
        
        # --- CARGOS (Debe - Gastos) ---
        if t_haberes > 0:
            lines_to_insert.append({
                "cuenta_codigo": config.get("expense_salary_code", "5.1.02.001"), 
                "cuenta_nombre": config.get("expense_salary_name", "Sueldos y Salarios"), 
                "tipo": "debe", "monto": t_haberes
            })
        if t_leyes_empresa > 0:
            lines_to_insert.append({
                "cuenta_codigo": config.get("expense_social_code", "5.1.02.002"), 
                "cuenta_nombre": config.get("expense_social_name", "Leyes Sociales Empresa"), 
                "tipo": "debe", "monto": t_leyes_empresa
            })

        # --- ABONOS (Haber - Pasivos) ---
        if t_afp > 0:
            lines_to_insert.append({
                "cuenta_codigo": config.get("liability_afp_code", "2.1.04.004"), 
                "cuenta_nombre": config.get("liability_afp_name", "AFP por Pagar"), 
                "tipo": "haber", "monto": t_afp
            })
        if t_salud > 0:
            lines_to_insert.append({
                "cuenta_codigo": config.get("liability_salud_code", "2.1.04.005"), 
                "cuenta_nombre": config.get("liability_salud_name", "Salud por Pagar"), 
                "tipo": "haber", "monto": t_salud
            })
        if t_afc > 0:
            lines_to_insert.append({
                "cuenta_codigo": config.get("liability_afc_code", "2.1.04.006"), 
                "cuenta_nombre": config.get("liability_afc_name", "AFC por Pagar"), 
                "tipo": "haber", "monto": t_afc
            })
        if t_impuestos > 0:
            lines_to_insert.append({
                "cuenta_codigo": config.get("liability_tax_code", "2.1.03.001"), 
                "cuenta_nombre": config.get("liability_tax_name", "Impuesto Unico por Pagar"), 
                "tipo": "haber", "monto": t_impuestos
            })
        if t_liquido > 0:
            lines_to_insert.append({
                "cuenta_codigo": config.get("liability_net_code", "2.1.04.001"), 
                "cuenta_nombre": config.get("liability_net_name", "Sueldos por Pagar"), 
                "tipo": "haber", "monto": t_liquido
            })

        # --- VALIDACION DE CUADRATURA ESTRICTA ---
        if not lines_to_insert:
            return {"success": True, "entries_created": 0}

        total_debe = sum(l["monto"] for l in lines_to_insert if l["tipo"] == "debe")
        total_haber = sum(l["monto"] for l in lines_to_insert if l["tipo"] == "haber")
        diff = abs(total_debe - total_haber)

        if diff > 0:
            # Si el descuadre es menor a 10 pesos, ajustamos por redondeo en la cuenta de sueldos por pagar
            if diff < 10:
                for l in lines_to_insert:
                    if l["cuenta_codigo"] == config.get("liability_net_code", "2.1.04.001"):
                        l["monto"] += (total_debe - total_haber)
                        break
            else:
                # Si el descuadre es mayor, ES UN ERROR FUNCIONAL. Bloqueamos para proteger la integridad.
                raise HTTPException(
                    status_code=400, 
                    detail=f"Error de Integridad: El asiento de remuneraciones esta descuadrado por ${diff:,.0f}. Auditoria requerida en liquidaciones."
                )

        glosa = f"Centralización de Remuneraciones {req.periodo[:7]}"
        
        # ELIMINAR centralización previa de este mes (Idempotencia)
        db.table("journal_entries").delete() \
            .eq("organization_id", req.organization_id) \
            .eq("glosa", glosa) \
            .execute()

        # Ajustamos fecha al último día del mes
        from datetime import datetime
        import calendar
        # Parseamos asumiendo que puede venir como YYYY-MM-DD o YYYY-MM
        base_period = req.periodo[:7]
        p_date = datetime.strptime(base_period + "-01", "%Y-%m-%d")
        last_day = calendar.monthrange(p_date.year, p_date.month)[1]
        fecha_asiento = f"{p_date.year}-{p_date.month:02d}-{last_day}"

        rpc_res = db.rpc("create_journal_entry_with_lines", {
            "p_organization_id": req.organization_id,
            "p_fecha": fecha_asiento,
            "p_glosa": glosa,
            "p_lines": lines_to_insert
        }).execute()
        
        if rpc_res.data:
            return {"success": True, "entries_created": 1, "journal_entry_id": rpc_res.data}
            
        return {"success": False, "error": "Falló RPC"}
    except Exception as e:
        import traceback
        print(f"[ERROR generate_from_payroll] {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chart-of-accounts")
async def get_chart_of_accounts(
    organization_id: str,
    current_user: dict = Depends(verify_token)
):
    await verify_org_role(organization_id, auth=current_user)
    db = get_supabase()
    res = db.table("chart_of_accounts").select("*").eq("organization_id", organization_id).order("codigo").execute()
    return res.data or []

@router.post("/chart-of-accounts/initialize")
async def initialize_chart_of_accounts(organization_id: str):
    db = get_supabase()
    db.rpc("create_default_chart_of_accounts", {"p_org_id": organization_id}).execute()
    return {"success": True}

@router.post("/chart-of-accounts")
async def create_account(req: CreateAccountRequest):
    db = get_supabase()
    try:
        data = req.dict()
        res = db.table("chart_of_accounts").insert(data).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Error al crear cuenta")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chart-of-accounts/{account_id}")
async def delete_account(account_id: str, organization_id: str):
    db = get_supabase()
    try:
        # 1. Obtener el código de la cuenta
        acc_res = db.table("chart_of_accounts").select("codigo").eq("id", account_id).eq("organization_id", organization_id).execute()
        if not acc_res.data:
            raise HTTPException(status_code=404, detail="Cuenta no encontrada")
        
        codigo = acc_res.data[0]["codigo"]

        # 2. Verificar si tiene movimientos (seguridad financiera)
        moves = db.table("journal_entry_lines").select("id").eq("cuenta_codigo", codigo).limit(1).execute()
        if moves.data:
            raise HTTPException(status_code=400, detail="No se puede borrar una cuenta que ya tiene movimientos contables.")

        # 3. Eliminar
        db.table("chart_of_accounts").delete().eq("id", account_id).execute()
        return {"success": True}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/chart-of-accounts/{account_id}")
async def update_account(account_id: str, req: UpdateAccountRequest):
    """Actualiza parcialmente una cuenta contable."""
    db = get_supabase()
    try:
        data = req.dict(exclude_unset=True)
        res = db.table("chart_of_accounts").update(data).eq("id", account_id).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Error al actualizar la cuenta")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chart-of-accounts/stats")
async def get_chart_stats(
    organization_id: str,
    current_user: dict = Depends(verify_token)
):
    """Obtiene estadísticas de salud del plan de cuentas."""
    await verify_org_role(organization_id, auth=current_user)
    db = get_supabase()
    try:
        res = db.table("chart_of_accounts").select("*").eq("organization_id", organization_id).execute()
        accounts = res.data or []
        
        return {
          "total": len(accounts),
          "imputables": len([a for a in accounts if a.get("acepta_movimiento")]),
          "activos": len([a for a in accounts if a.get("tipo") == "activo"]),
          "pasivos": len([a for a in accounts if a.get("tipo") == "pasivo"]),
          "patrimonio": len([a for a in accounts if a.get("tipo") == "patrimonio"]),
          "ingresos": len([a for a in accounts if a.get("tipo") == "ingreso"]),
          "gastos": len([a for a in accounts if a.get("tipo") == "gasto"]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trial-balance")
async def get_trial_balance(
    organization_id: str, 
    start_date: str, 
    end_date: str,
    current_user: dict = Depends(verify_token)
):
    """
    Genera el Balance de Comprobación y Saldos (Trial Balance) con integridad histórica.
    Calcula: 
    1. Sumas del Periodo (Debe/Haber).
    2. Saldos Finales Acumulados (Deudor/Acreedor) incluyendo arrastre anterior.
    """
    await verify_org_role(organization_id, auth=current_user)
    
    # Registrar visualización de balance en bitácora de auditoría
    log_activity(
        action="view_trial_balance",
        organization_id=organization_id,
        user_id=current_user.get("user_id"),
        entity_type="accounting_period",
        entity_id=f"{organization_id}_{start_date}_{end_date}",
        details={"start_date": start_date, "end_date": end_date}
    )
    
    db = get_supabase()
    try:
        # 1. Obtener TODO el Plan de Cuentas para asegurar integridad
        acc_res = db.table("chart_of_accounts") \
            .select("codigo, nombre, naturaleza, tipo") \
            .eq("organization_id", organization_id) \
            .execute()
        
        catalog = {a["codigo"]: a for a in acc_res.data}
        accounts_data: Dict[str, Dict[str, Any]] = {}

        # Inicializar catálogo
        for code, info in catalog.items():
            accounts_data[code] = {
                "codigo": code,
                "nombre": info["nombre"],
                "naturaleza": info["naturaleza"].lower(),
                "saldo_anterior": 0,
                "debe": 0,
                "haber": 0,
                "saldo_deudor": 0,
                "saldo_acreedor": 0
            }

        # 2. CÁLCULO DE SALDO ANTERIOR (Optimizado: Omitimos organization_id en select de relación)
        prev_res = db.table("journal_entry_lines") \
            .select("cuenta_codigo, monto, tipo, journal_entries!inner(fecha)") \
            .eq("journal_entries.organization_id", organization_id) \
            .lt("journal_entries.fecha", start_date) \
            .execute()
        
        for m in (prev_res.data or []):
            code = m["cuenta_codigo"]
            if code not in accounts_data: continue
            
            monto = int(m["monto"])
            nature = accounts_data[code]["naturaleza"]
            
            if (m["tipo"] == "debe" and nature == "deudora") or (m["tipo"] == "haber" and nature == "acreedora"):
                accounts_data[code]["saldo_anterior"] += monto
            else:
                accounts_data[code]["saldo_anterior"] -= monto

        # 3. MOVIMIENTOS DEL PERIODO (Optimizado: Omitimos organization_id en select de relación)
        period_res = db.table("journal_entry_lines") \
            .select("cuenta_codigo, monto, tipo, journal_entries!inner(fecha)") \
            .eq("journal_entries.organization_id", organization_id) \
            .gte("journal_entries.fecha", start_date) \
            .lte("journal_entries.fecha", end_date) \
            .execute()
        
        for m in (period_res.data or []):
            code = m["cuenta_codigo"]
            if code not in accounts_data: continue
            
            monto = int(m["monto"])
            if m["tipo"] == "debe":
                accounts_data[code]["debe"] += monto
            else:
                accounts_data[code]["haber"] += monto

        # 4. CONSOLIDACIÓN FINAL
        result = []
        for code in sorted(accounts_data.keys()):
            acc = accounts_data[code]
            if acc["debe"] == 0 and acc["haber"] == 0 and acc["saldo_anterior"] == 0:
                continue
                
            if acc["naturaleza"] == "deudora":
                total_balance = acc["saldo_anterior"] + acc["debe"] - acc["haber"]
                acc["saldo_deudor"] = total_balance if total_balance > 0 else 0
                acc["saldo_acreedor"] = -total_balance if total_balance < 0 else 0
            else:
                total_balance = acc["saldo_anterior"] + acc["haber"] - acc["debe"]
                acc["saldo_acreedor"] = total_balance if total_balance > 0 else 0
                acc["saldo_deudor"] = -total_balance if total_balance < 0 else 0
            
            result.append(acc)
            
        return result
    except Exception as e:
        print(f"[ERROR Trial Balance Engine] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Falla crítica en cálculo de balance: {str(e)}")

@router.get("/ledger")
async def get_ledger(
    organization_id: str, 
    account_code: str, 
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    current_user: dict = Depends(verify_token)
):
    """Obtiene el libro mayor con saldo acumulado y SALDO ANTERIOR (Apertura)."""
    await verify_org_role(organization_id, auth=current_user)
    
    # Registrar visualización de libro mayor en bitácora de auditoría
    log_activity(
        action="view_ledger",
        organization_id=organization_id,
        user_id=current_user.get("user_id"),
        entity_type="account",
        entity_id=f"{organization_id}_{account_code}",
        details={"account_code": account_code, "start_date": start_date, "end_date": end_date}
    )
    
    db = get_supabase()
    account_code = account_code.strip()
    
    print(f"[AUDITORÍA] Solicitando Mayor para cuenta: {account_code} en Org: {organization_id}")
    
    try:
        # 1. Info de la cuenta
        acc_res = db.table("chart_of_accounts").select("nombre, naturaleza").eq("organization_id", organization_id).eq("codigo", account_code).execute()
        if not acc_res.data: 
            print(f"[AUDITORÍA] ! Cuenta {account_code} no encontrada.")
            return None
            
        info = acc_res.data[0]
        nature = info.get("naturaleza", "deudora").lower()

        # 2. CÁLCULO DE SALDO ANTERIOR (Auditoría Histórica)
        saldo_inicial = 0
        if start_date and start_date.strip():
            prev_query = db.table("journal_entry_lines") \
                .select("monto, tipo, journal_entries!inner(fecha, organization_id)") \
                .eq("cuenta_codigo", account_code) \
                .eq("journal_entries.organization_id", organization_id) \
                .lt("journal_entries.fecha", start_date) \
                .execute()
            
            for m in (prev_query.data or []):
                monto = int(m.get("monto", 0))
                # Si es Deudora: Debe suma, Haber resta. Si es Acreedora: Haber suma, Debe resta.
                es_suma = (m.get("tipo") == "debe" and nature == "deudora") or (m.get("tipo") == "haber" and nature == "acreedora")
                saldo_inicial += monto if es_suma else -monto

        # 3. Obtener movimientos del periodo actual
        query = db.table("journal_entry_lines") \
            .select("*, journal_entries!inner(fecha, glosa, organization_id)") \
            .eq("cuenta_codigo", account_code) \
            .eq("journal_entries.organization_id", organization_id)
        
        if start_date and start_date.strip():
            query = query.gte("journal_entries.fecha", start_date)
        if end_date and end_date.strip():
            query = query.lte("journal_entries.fecha", end_date)
            
        res = query.order("fecha", foreign_table="journal_entries", desc=False).execute()
        raw_moves = res.data or []
        
        print(f"[AUDITORÍA] ✅ Se encontraron {len(raw_moves)} movimientos + Saldo Anterior de ${saldo_inicial}")

        # 4. Procesar movimientos y calcular saldo acumulado
        movements = []
        saldo_acumulado = saldo_inicial
        total_debe = 0
        total_haber = 0

        for m in raw_moves:
            je = m.get("journal_entries")
            if isinstance(je, list) and je: je = je[0]
            if not je: continue
            
            monto = int(m.get("monto", 0))
            debe = monto if m.get("tipo") == "debe" else 0
            haber = 0 if m.get("tipo") == "debe" else monto
            
            total_debe += debe
            total_haber += haber
            
            if nature == "deudora":
                saldo_acumulado += (debe - haber)
            else:
                saldo_acumulado += (haber - debe)
                
            movements.append({
                "fecha": je.get("fecha"),
                "glosa": je.get("glosa", "S/G"),
                "numero_asiento": str(m.get("journal_entry_id", ""))[:8].upper() if m.get("journal_entry_id") else "S/N",
                "debe": debe,
                "haber": haber,
                "saldo": saldo_acumulado
            })

        return {
            "account_code": account_code,
            "account_name": info["nombre"],
            "naturaleza": nature,
            "saldo_anterior": saldo_inicial,
            "movements": movements,
            "total_debe": total_debe,
            "total_haber": total_haber,
            "saldo_final": saldo_acumulado
        }
    except Exception as e:
        print(f"ERROR CRÍTICO get_ledger: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en auditoría de mayor: {str(e)}")

@router.get("/reports")
async def get_financial_reports(
    organization_id: str, 
    year: int, 
    month: Optional[int] = None,
    current_user: dict = Depends(verify_token)
):
    """Genera Estado de Resultados y Balance General."""
    await verify_org_role(organization_id, auth=current_user)
    
    # Registrar visualización de reportes financieros en bitácora de auditoría
    log_activity(
        action="view_financial_reports",
        organization_id=organization_id,
        user_id=current_user.get("user_id"),
        entity_type="financial_report",
        entity_id=f"{organization_id}_{year}_{month or 'annual'}",
        details={"year": year, "month": month}
    )
    
    db = get_supabase()
    try:
        import calendar
        # 1. Definir rango de fechas
        if month:
            start_date = f"{year}-{month:02d}-01"
            last_day = calendar.monthrange(year, month)[1]
            end_date = f"{year}-{month:02d}-{last_day}"
        else:
            start_date = f"{year}-01-01"
            end_date = f"{year}-12-31"

        # 3. Llamar al Motor SQL Recursivo (Fase 3 Sovereign ERP)
        # Esto reemplaza miles de loops en Python y obtiene el saldo real histórico ultra rápido
        res = db.rpc(
            "rpc_get_recursive_trial_balance",
            {"p_organization_id": organization_id, "p_end_date": end_date}
        ).execute()

        rollup_accounts = res.data or []

        # 4. Estructurar Reportes
        ingresos_total = 0
        gastos_total = 0
        activos_total = 0
        pasivos_total = 0
        patrimonio_antes_resultado = 0
        
        er_detalles = []
        bg_detalles = []

        for acc in rollup_accounts:
            # Para los cálculos de totales evitamos sumar cuentas padre (solo sumamos hojas)
            # para no duplicar el valor en el frontend actual, aunque enviamos el nivel.
            is_leaf = acc.get("acepta_movimiento", False)
            saldo = float(acc.get("saldo", 0))
            
            if saldo == 0: continue 
                
            tipo = acc.get("tipo", "desconocido")
            item = {
                "codigo": acc.get("codigo"), 
                "nombre": acc.get("nombre"), 
                "monto": saldo, 
                "tipo": tipo,
                "nivel": acc.get("nivel"),
                "is_leaf": is_leaf
            }
            
            # Solo sumamos a los totales matriciales si es hoja
            if is_leaf:
                if tipo == "ingreso":
                    ingresos_total += saldo
                    er_detalles.append(item)
                elif tipo == "gasto":
                    gastos_total += saldo
                    er_detalles.append(item)
                elif tipo == "activo":
                    activos_total += saldo
                    bg_detalles.append(item)
                elif tipo == "pasivo":
                    pasivos_total += saldo
                    bg_detalles.append(item)
                elif tipo == "patrimonio":
                    patrimonio_antes_resultado += saldo
                    bg_detalles.append(item)
            else:
                # Las cuentas padre también las enviamos para que React arme un árbol visual después
                if tipo in ["ingreso", "gasto"]:
                    er_detalles.append(item)
                elif tipo in ["activo", "pasivo", "patrimonio"]:
                    bg_detalles.append(item)

        # 6. INTEGRIDAD CONTABLE: El resultado neto se suma al patrimonio para el balance
        resultado_neto = ingresos_total - gastos_total
        
        # Añadir el resultado del ejercicio al detalle del Balance General
        bg_detalles.append({
            "codigo": "RE-001", 
            "nombre": "UTILIDAD/PERDIDA DEL EJERCICIO", 
            "monto": resultado_neto, 
            "tipo": "patrimonio",
            "is_virtual": True
        })
        
        final_patrimonio = patrimonio_antes_resultado + resultado_neto

        return {
            "estado_resultados": {
                "ingresos": ingresos_total,
                "gastos": gastos_total,
                "resultado": resultado_neto,
                "detalles": er_detalles
            },
            "balance_general": {
                "activos": activos_total,
                "pasivos": pasivos_total,
                "patrimonio": final_patrimonio,
                "detalles": bg_detalles,
                "is_balanced": abs(activos_total - (pasivos_total + final_patrimonio)) < 1
            }
        }
    except Exception as e:
        print(f"ERROR get_financial_reports: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config")
async def get_accounting_config_endpoint(
    organization_id: str,
    current_user: dict = Depends(verify_token)
):
    """Retorna todas las configuraciones contables activas."""
    await verify_org_role(organization_id, auth=current_user)
    db = get_supabase()
    try:
        res = db.table("centralized_account_config").select("*").eq("organization_id", organization_id).execute()
        return res.data or []
    except Exception as e:
        print(f"ERROR get_accounting_config_endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/config/initialize")
async def initialize_accounting_config(organization_id: str):
    """Inicializa la tabla de configuraciones con valores por defecto si está vacía."""
    db = get_supabase()
    try:
        # 1. Verificar si ya existen
        check = db.table("centralized_account_config").select("id").eq("organization_id", organization_id).limit(1).execute()
        if check.data:
            return {"success": True, "message": "Configuración ya existe."}
        
        # 2. Filas por defecto
        default_rows = [
            {
                "organization_id": organization_id,
                "module_name": "rcv", "transaction_type": "purchases", "display_name": "Configuración Compras (RCV)",
                "tax_account_code": "1.1.03.001", "tax_account_name": "IVA Crédito Fiscal",
                "revenue_account_code": "5.1.01.001", "revenue_account_name": "Costo de Ventas",
                "asset_account_code": "2.1.01.001", "asset_account_name": "Proveedores Nacionales"
            },
            {
                "organization_id": organization_id,
                "module_name": "rcv", "transaction_type": "sales", "display_name": "Configuración Ventas (RCV)",
                "tax_account_code": "2.1.02.001", "tax_account_name": "IVA Débito Fiscal",
                "revenue_account_code": "4.1.01.001", "revenue_account_name": "Ventas de Mercaderías",
                "asset_account_code": "1.1.02.001", "asset_account_name": "Clientes Nacionales"
            },
            {
                "organization_id": organization_id,
                "module_name": "payroll", "transaction_type": "monthly", "display_name": "Configuración Remuneraciones",
                "expense_salary_code": "5.1.02.001", "expense_salary_name": "Sueldos y Salarios",
                "expense_social_code": "5.1.02.002", "expense_social_name": "Leyes Sociales Empresa",
                "liability_afp_code": "2.1.04.004", "liability_afp_name": "AFP por Pagar",
                "liability_salud_code": "2.1.04.005", "liability_salud_name": "Salud por Pagar",
                "liability_afc_code": "2.1.04.006", "liability_afc_name": "AFC por Pagar",
                "liability_tax_code": "2.1.03.001", "liability_tax_name": "Impuesto Único Retenido por Pagar",
                "liability_net_code": "2.1.04.001", "liability_net_name": "Sueldos por Pagar",
                "tax_account_code": "0.0.0", "tax_account_name": "N/A", "revenue_account_code": "0.0.0", "revenue_account_name": "N/A", "asset_account_code": "0.0.0", "asset_account_name": "N/A"
            },
            {
                "organization_id": organization_id,
                "module_name": "f29", "transaction_type": "generic", "display_name": "Configuración Formulario 29",
                "tax_iva_debito_code": "2.1.02.001", "tax_iva_debito_name": "IVA Débito Fiscal",
                "tax_iva_credito_code": "1.1.03.001", "tax_iva_credito_name": "IVA Crédito Fiscal",
                "tax_ppm_code": "1.1.03.003", "tax_ppm_name": "PPM por Recuperar",
                "tax_retentions_code": "2.1.03.002", "tax_retentions_name": "Retenciones 2da Categoría",
                "tax_f29_payable_code": "2.1.03.003", "tax_f29_payable_name": "F29 por Pagar",
                "tax_account_code": "0.0.0", "tax_account_name": "N/A", "revenue_account_code": "0.0.0", "revenue_account_name": "N/A", "asset_account_code": "0.0.0", "asset_account_name": "N/A"
            },
            {
                "organization_id": organization_id,
                "module_name": "assets", "transaction_type": "generic", "display_name": "Configuración Activos Fijos",
                "asset_depreciation_expense_code": "5.1.03.001", "asset_depreciation_expense_name": "Depreciación del Ejercicio",
                "asset_accumulated_depreciation_code": "1.2.01.001", "asset_accumulated_depreciation_name": "Depreciación Acumulada",
                "tax_account_code": "0.0.0", "tax_account_name": "N/A", "revenue_account_code": "0.0.0", "revenue_account_name": "N/A", "asset_account_code": "0.0.0", "asset_account_name": "N/A"
            }
        ]
        
        db.table("centralized_account_config").insert(default_rows).execute()
        
        return {"success": True, "message": "Configuración inicializada correctamente."}
    except Exception as e:
        print(f"ERROR initialize_accounting_config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/config/{config_id}")
async def update_accounting_config_endpoint(config_id: str, req: UpdateAccountingConfigRequest):
    """Actualiza un mapeo de cuentas específico."""
    db = get_supabase()
    try:
        data = req.model_dump(exclude_unset=True)
        res = db.table("centralized_account_config").update(data).eq("id", config_id).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Error al actualizar configuración")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- ENDPOINTS PARA REGLAS DE MAPEO (RCV ENTITY MAPPING) ---

@router.get("/mapping-rules")
async def get_mapping_rules(
    organization_id: str,
    current_user: dict = Depends(verify_token)
):
    """Obtiene las reglas de mapeo específicas (RUT -> Cuenta)."""
    await verify_org_role(organization_id, auth=current_user)
    db = get_supabase()
    try:
        res = db.table("account_mapping_rules") \
            .select("*, chart_of_accounts(codigo, nombre)") \
            .eq("organization_id", organization_id) \
            .execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mapping-rules")
async def create_mapping_rule(req: AccountMappingRuleRequest):
    """Crea una nueva regla de mapeo específica."""
    db = get_supabase()
    try:
        res = db.table("account_mapping_rules").insert(req.dict()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Error al crear regla de mapeo")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/mapping-rules/{rule_id}")
async def delete_mapping_rule(rule_id: str):
    """Elimina una regla de mapeo."""
    db = get_supabase()
    try:
        db.table("account_mapping_rules").delete().eq("id", rule_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ====================================================================
# EXPORTADOR OFICIAL LCE (XML SII) - LIBRO MAYOR ELECTRÓNICO
# ====================================================================

import xml.etree.ElementTree as ET
import datetime
from fastapi.responses import Response

def get_iso_time():
    return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3))).replace(microsecond=0).isoformat()

@router.get("/lce_mayor")
async def export_lce_mayor_xml(
    organization_id: str, 
    periodo: str,
    current_user: dict = Depends(verify_token)
):
    """
    Genera el archivo XML Oficial del SII LceEnvioLibros -> LceMayor y LceMayorRes.
    Periodo debe venir en formato YYYY-MM.
    """
    await verify_org_role(organization_id, auth=current_user)
    db = get_supabase()
    try:
        # 1. Obtener datos Organización
        org_res = db.table("organizations").select("rut_empresa").eq("id", organization_id).single().execute()
        rut_org = org_res.data.get("rut_empresa", "1-9") if org_res.data else "1-9"

        # 2. Fechas para el período
        year_str, month_str = periodo.split("-")
        try:
            import calendar
            last_day = calendar.monthrange(int(year_str), int(month_str))[1]
            end_date = f"{year_str}-{month_str}-{last_day:02d}"
        except:
            raise HTTPException(status_code=400, detail="Formato periodo inválido. Use YYYY-MM.")

        # 3. Obtener Plan de Cuentas (solo hojas)
        acc_res = db.table("chart_of_accounts").select("*").eq("organization_id", organization_id).eq("acepta_movimiento", True).execute()
        accounts = acc_res.data or []
        
        # 4. Obtener Movimientos Acumulados y del Mes
        # Para simplificar y hacerlo 100% seguro sin RPC, llamaré las tablas y las uniré en Python (para LCE es vital la precisión).
        je_res = db.table("journal_entries").select("id, fecha, glosa, numero_asiento, tipo_comprobante").eq("organization_id", organization_id).lte("fecha", end_date).execute()
        journal_entries = je_res.data or []
        je_map = {je["id"]: je for je in journal_entries}
        
        if not je_map:
            raise HTTPException(status_code=400, detail="No hay asientos contables ingresados hasta ese período.")

        # Obtener las líneas de esos asientos
        entry_ids = list(je_map.keys())
        jel_res = db.table("journal_entry_lines").select("entry_id, account_id, tipo, monto").in_("entry_id", entry_ids).execute()
        
        # 5. Agrupar la data:
        sum_accounts = {}
        for acc in accounts:
            sum_accounts[acc["id"]] = {
                "codigo": acc["codigo"], 
                "nombre": acc["nombre"],
                "naturaleza": acc["naturaleza"],
                
                "acumulado_debe": 0, "acumulado_haber": 0,
                "periodo_debe": 0, "periodo_haber": 0,
                "movimientos_ms": []
            }

        for line in jel_res.data or []:
            aid = line["account_id"]
            if aid not in sum_accounts: continue
            
            je = je_map.get(line["entry_id"])
            if not je: continue
            
            is_period = je["fecha"].startswith(periodo)
            debe = line["monto"] if line["tipo"] == "debe" else 0
            haber = line["monto"] if line["tipo"] == "haber" else 0
            
            # Acumulados Totales Históricos + Este mes inclusive
            sum_accounts[aid]["acumulado_debe"] += debe
            sum_accounts[aid]["acumulado_haber"] += haber
            
            # Movimientos SOLO del Mes consultado
            if is_period:
                sum_accounts[aid]["periodo_debe"] += debe
                sum_accounts[aid]["periodo_haber"] += haber
                
                sum_accounts[aid]["movimientos_ms"].append({
                    "fecha": je["fecha"],
                    "glosa": je["glosa"][:40], # Límite SII
                    "num_comp": je.get("numero_asiento") or 1,
                    "tpo_comp": je.get("tipo_comprobante") or "T",
                    "debe": debe,
                    "haber": haber
                })
        
        # -------------- CONSTRUCCIÓN DEL XML --------------
        # Elementos Raíz con Namespaces Oficiales
        ET.register_namespace('', "http://www.sii.cl/SiiLce")
        ET.register_namespace('ds', "http://www.w3.org/2000/09/xmldsig#")
        ET.register_namespace('xsi', "http://www.w3.org/2001/XMLSchema-instance")
        
        root = ET.Element("{http://www.sii.cl/SiiLce}LceEnvioLibros", {"version": "1.0"})
        root.set("{http://www.w3.org/2001/XMLSchema-instance}schemaLocation", "http://www.sii.cl/SiiLce LceEnvioLibros_v10.xsd")
        
        doc_envio = ET.SubElement(root, "DocumentoEnvioLibros", {"ID": f"ENVIO_MAYOR_{periodo.replace('-', '')}"})
        ET.SubElement(doc_envio, "RutEnvia").text = "YOUR-SIGNER-RUT-HERE" # A inyectar por Homologador
        ET.SubElement(doc_envio, "RutContribuyente").text = rut_org
        notificacion = ET.SubElement(doc_envio, "Notificacion")
        ET.SubElement(notificacion, "Tipo").text = "1"
        ET.SubElement(notificacion, "Folio").text = "0" # Opcional Folio
        ET.SubElement(doc_envio, "TmstFirmaEnv").text = get_iso_time()

        lce = ET.SubElement(root, "LCE")
        lce_mayor = ET.SubElement(lce, "LceMayor", {"version": "1.0"})
        
        # NODO: LceMayorRes (Resumen Agrupado)
        lce_mayor_res = ET.SubElement(lce_mayor, "{http://www.sii.cl/SiiLce}LceMayorRes", {"version": "1.0"})
        doc_mayor_res = ET.SubElement(lce_mayor_res, "DocumentoMayorRes", {"ID": f"MAYOR_RES_{periodo.replace('-', '')}"})
        
        identificacion = ET.SubElement(doc_mayor_res, "Identificacion")
        ET.SubElement(identificacion, "RutContribuyente").text = rut_org
        per_trib = ET.SubElement(identificacion, "PeriodoTributario")
        ET.SubElement(per_trib, "Inicial").text = periodo
        ET.SubElement(per_trib, "Final").text = periodo
        
        for aid, data in sorted(sum_accounts.items(), key=lambda x: x[1]["codigo"]):
            # Solo si la cuenta tuvo movimiento este mes OR tiene saldo acumulado
            if data["acumulado_debe"] == 0 and data["acumulado_haber"] == 0:
                continue
                
            qty_movs = len(data["movimientos_ms"])
            if qty_movs == 0 and data["acumulado_debe"] == 0 and data["acumulado_haber"] == 0: continue

            per_db = data["periodo_debe"]
            per_hb = data["periodo_haber"]
            acu_db = data["acumulado_debe"]
            acu_hb = data["acumulado_haber"]
            
            per_saldo = per_db - per_hb if data["naturaleza"] == "deudora" else per_hb - per_db
            acu_saldo = acu_db - acu_hb if data["naturaleza"] == "deudora" else acu_hb - acu_db

            # NODO: Resumen de la Cuenta en DocumentoMayorRes
            cuenta_res = ET.SubElement(doc_mayor_res, "Cuenta")
            ET.SubElement(cuenta_res, "CodigoCuenta").text = data["codigo"]
            ET.SubElement(cuenta_res, "CantidadMovimientos").text = str(qty_movs)
            
            cierre = ET.SubElement(cuenta_res, "Cierre")
            m_per = ET.SubElement(cierre, "MontosPeriodo")
            if per_db > 0: ET.SubElement(m_per, "Debe").text = str(per_db)
            if per_hb > 0: ET.SubElement(m_per, "Haber").text = str(per_hb)
            if per_saldo > 0 and data["naturaleza"] == "deudora": ET.SubElement(m_per, "SaldoDeudor").text = str(per_saldo)
            if per_saldo > 0 and data["naturaleza"] == "acreedora": ET.SubElement(m_per, "SaldoAcreedor").text = str(per_saldo)

            m_acu = ET.SubElement(cierre, "MontosAcumulado")
            if acu_db > 0: ET.SubElement(m_acu, "Debe").text = str(acu_db)
            if acu_hb > 0: ET.SubElement(m_acu, "Haber").text = str(acu_hb)
            if acu_saldo > 0 and data["naturaleza"] == "deudora": ET.SubElement(m_acu, "SaldoDeudor").text = str(acu_saldo)
            if acu_saldo > 0 and data["naturaleza"] == "acreedora": ET.SubElement(m_acu, "SaldoAcreedor").text = str(acu_saldo)

        ET.SubElement(doc_mayor_res, "RutFirma").text = "YOUR-SIGNER-RUT-HERE"
        ET.SubElement(doc_mayor_res, "TmstFirma").text = get_iso_time()

        # NODO: Detalle de Movimientos en LceMayor (Fuera del Resumen)
        for aid, data in sorted(sum_accounts.items(), key=lambda x: x[1]["codigo"]):
            if len(data["movimientos_ms"]) == 0: continue
            
            cuenta_det = ET.SubElement(lce_mayor, "Cuenta")
            ET.SubElement(cuenta_det, "CodigoCuenta").text = data["codigo"]
            
            # Ordenados por Fecha y Correlativo
            for mov in sorted(data["movimientos_ms"], key=lambda m: (m["fecha"], m["num_comp"])):
                movs = ET.SubElement(cuenta_det, "Movimientos")
                ET.SubElement(movs, "TpoComp").text = mov["tpo_comp"] # I, E, T
                ET.SubElement(movs, "NumComp").text = str(mov["num_comp"])
                ET.SubElement(movs, "FechaContable").text = mov["fecha"]
                ET.SubElement(movs, "GlosaAnalisis").text = mov["glosa"]
                if mov["debe"] > 0: ET.SubElement(movs, "Debe").text = str(mov["debe"])
                if mov["haber"] > 0: ET.SubElement(movs, "Haber").text = str(mov["haber"])

        xml_str = ET.tostring(root, encoding='utf-8', xml_declaration=True).decode('utf-8')
        
        # Inyectar instrucción de procesamiento XML del SII y comentarios manuales
        header = '<?xml version="1.0" encoding="ISO-8859-1"?>\n<!-- Generado por Contapymepuq - Libro Mayor LCE -->\n'
        xml_final = header + xml_str.replace("<?xml version='1.0' encoding='utf-8'?>\n", "")
        
        return Response(content=xml_final, media_type="application/xml")

    except Exception as e:
        print(f"ERROR export_lce_mayor_xml: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

