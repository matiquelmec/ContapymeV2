from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from core.database import get_supabase

router = APIRouter()

class GenerateFromRCVRequest(BaseModel):
    organization_id: str
    periodo: str
    type: str

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

class UpdateAccountingConfigRequest(BaseModel):
    tax_account_code: str
    tax_account_name: str
    revenue_account_code: str
    revenue_account_name: str
    asset_account_code: str
    asset_account_name: str

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
    return None

@router.post("/generate-from-rcv")
async def generate_from_rcv(req: GenerateFromRCVRequest):
    db = get_supabase()
    try:
        # Normalizar periodo globalmente para la función
        periodo_query = req.periodo
        if len(periodo_query) == 7: # YYYY-MM -> YYYY-MM-01
            periodo_query = f"{periodo_query}-01"

        config = get_accounting_config(db, req.organization_id, 'rcv', req.type)
        if not config:
            raise HTTPException(status_code=400, detail=f"No hay configuración contable para {req.type}")

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

        count = 0
        if req.type == 'purchases':
            res = db.table("purchase_records").select("*") \
                .eq("organization_id", req.organization_id) \
                .eq("periodo", periodo_query) \
                .is_("journal_entry_id", "null") \
                .execute()
            records = res.data or []
            
            for rec in records:
                # Aseguramos conversión a int robusta
                def to_int(val):
                    try: return int(float(val or 0))
                    except: return 0

                monto_total = to_int(rec.get("monto_total"))
                if monto_total == 0:
                    print(f"Saltando registro Folio {rec.get('folio')} por monto $0")
                    continue

                es_suma = rec.get("es_suma", True)
                tipo_doc_id = str(rec.get("tipo_documento", "33"))
                doc_name = doc_names.get(tipo_doc_id, f"Doc.{tipo_doc_id}")
                partner = rec.get('razon_social_emisor', 'S/N')
                glosa = f"{doc_name} Folio {rec['folio']} - {partner}"
                
                if not es_suma:
                    glosa = f"[AJUSTE] {glosa}"

                monto_neto = int(rec.get("monto_neto", 0) or 0)
                monto_exento = int(rec.get("monto_exento", 0) or 0)
                monto_iva = int(rec.get("monto_iva", 0) or 0)
                monto_base = monto_neto + monto_exento

                if abs(monto_base + monto_iva) != abs(monto_total):
                    monto_base = abs(monto_total) - abs(monto_iva)

                lines_to_insert = []
                tipo_gasto = "debe" if es_suma else "haber"
                tipo_pasivo = "haber" if es_suma else "debe"

                if monto_base != 0:
                    lines_to_insert.append({
                        "cuenta_codigo": config["revenue_account_code"], 
                        "cuenta_nombre": config["revenue_account_name"], 
                        "tipo": tipo_gasto, "monto": abs(monto_base)
                    })
                
                if monto_iva != 0:
                    lines_to_insert.append({
                        "cuenta_codigo": config["tax_account_code"], 
                        "cuenta_nombre": config["tax_account_name"], 
                        "tipo": tipo_gasto, "monto": abs(monto_iva)
                    })
                
                if monto_total != 0:
                    lines_to_insert.append({
                        "cuenta_codigo": config["asset_account_code"], 
                        "cuenta_nombre": config["asset_account_name"], 
                        "tipo": tipo_pasivo, "monto": abs(monto_total)
                    })

                if lines_to_insert:
                    # USAR RPC PARA ATOMICIDAD (Insertar cabecera + líneas en un solo paso DB)
                    rpc_res = db.rpc("create_journal_entry_with_lines", {
                        "p_organization_id": req.organization_id,
                        "p_fecha": rec["fecha_docto"],
                        "p_glosa": glosa,
                        "p_lines": lines_to_insert
                    }).execute()
                    
                    if rpc_res.data:
                        eid = rpc_res.data
                        db.table("purchase_records").update({"journal_entry_id": eid}).eq("id", rec["id"]).execute()
                        count += 1

        elif req.type == 'sales':
            res = db.table("sales_records").select("*") \
                .eq("organization_id", req.organization_id) \
                .eq("periodo", periodo_query) \
                .is_("journal_entry_id", "null") \
                .execute()
            records = res.data or []
            
            for rec in records:
                monto_total = int(rec.get("monto_total", 0) or 0)
                if monto_total == 0:
                    continue

                es_suma = rec.get("es_suma", True)
                tipo_doc_id = str(rec.get("tipo_documento", "33"))
                doc_name = doc_names.get(tipo_doc_id, f"Doc.{tipo_doc_id}")
                partner = rec.get('razon_social_receptor', 'S/N')
                glosa = f"{doc_name} Folio {rec['folio']} - {partner}"

                if not es_suma:
                    glosa = f"[AJUSTE] {glosa}"

                monto_neto = int(rec.get("monto_neto", 0) or 0)
                monto_exento = int(rec.get("monto_exento", 0) or 0)
                monto_iva = int(rec.get("monto_iva", 0) or 0)
                monto_base = monto_neto + monto_exento

                if abs(monto_base + monto_iva) != abs(monto_total):
                    monto_base = abs(monto_total) - abs(monto_iva)

                lines_to_insert = []
                tipo_activo = "debe" if es_suma else "haber"
                tipo_ingreso = "haber" if es_suma else "debe"

                if monto_total != 0:
                    lines_to_insert.append({
                        "cuenta_codigo": config["asset_account_code"], 
                        "cuenta_nombre": config["asset_account_name"], 
                        "tipo": tipo_activo, "monto": abs(monto_total)
                    })
                
                if monto_iva != 0:
                    lines_to_insert.append({
                        "cuenta_codigo": config["tax_account_code"], 
                        "cuenta_nombre": config["tax_account_name"], 
                        "tipo": tipo_ingreso, "monto": abs(monto_iva)
                    })
                
                if monto_base != 0:
                    lines_to_insert.append({
                        "cuenta_codigo": config["revenue_account_code"], 
                        "cuenta_nombre": config["revenue_account_name"], 
                        "tipo": tipo_ingreso, "monto": abs(monto_base)
                    })

                if lines_to_insert:
                    # USAR RPC PARA ATOMICIDAD
                    rpc_res = db.rpc("create_journal_entry_with_lines", {
                        "p_organization_id": req.organization_id,
                        "p_fecha": rec["fecha_docto"],
                        "p_glosa": glosa,
                        "p_lines": lines_to_insert
                    }).execute()
                    
                    if rpc_res.data:
                        eid = rpc_res.data
                        db.table("sales_records").update({"journal_entry_id": eid}).eq("id", rec["id"]).execute()
                        count += 1

        return {"success": True, "entries_created": count}
    except Exception as e:
        print(f"[ERROR generate_from_rcv] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chart-of-accounts")
async def get_chart_of_accounts(organization_id: str):
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

@router.get("/trial-balance")
async def get_trial_balance(organization_id: str, start_date: str, end_date: str):
    """
    Genera el Balance de Comprobación y Saldos (Trial Balance) con integridad histórica.
    Calcula: 
    1. Sumas del Periodo (Debe/Haber).
    2. Saldos Finales Acumulados (Deudor/Acreedor) incluyendo arrastre anterior.
    """
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

        # 2. CÁLCULO DE SALDO ANTERIOR
        prev_res = db.table("journal_entry_lines") \
            .select("cuenta_codigo, monto, tipo, journal_entries!inner(fecha, organization_id)") \
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

        # 3. MOVIMIENTOS DEL PERIODO
        period_res = db.table("journal_entry_lines") \
            .select("cuenta_codigo, monto, tipo, journal_entries!inner(fecha, organization_id)") \
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
async def get_ledger(organization_id: str, account_code: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Obtiene el libro mayor con saldo acumulado y SALDO ANTERIOR (Apertura)."""
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
async def get_financial_reports(organization_id: str, year: int, month: Optional[int] = None):
    """Genera Estado de Resultados y Balance General."""
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

        # 2. Obtener catálogo para metadatos de cuenta
        acc_res = db.table("chart_of_accounts") \
            .select("codigo, nombre, tipo, naturaleza") \
            .eq("organization_id", organization_id) \
            .execute()
        catalog = {a["codigo"]: a for a in acc_res.data}

        # 3. Obtener movimientos
        res = db.table("journal_entry_lines") \
            .select("*, journal_entries!inner(fecha)") \
            .eq("journal_entries.organization_id", organization_id) \
            .gte("journal_entries.fecha", start_date) \
            .lte("journal_entries.fecha", end_date) \
            .execute()
        
        lines = res.data or []
        
        # 4. Consolidar saldos
        account_sums: Dict[str, Dict[str, Any]] = {}
        for l in lines:
            code = l["cuenta_codigo"]
            if code not in account_sums:
                info = catalog.get(code, {"nombre": l["cuenta_nombre"], "tipo": "desconocido", "naturaleza": "deudora"})
                account_sums[code] = {
                    "codigo": code,
                    "nombre": info["nombre"],
                    "tipo": info.get("tipo", "desconocido"),
                    "naturaleza": info.get("naturaleza", "deudora"),
                    "debe": 0,
                    "haber": 0
                }
            
            monto = int(l["monto"])
            if l["tipo"] == "debe":
                account_sums[code]["debe"] += monto
            else:
                account_sums[code]["haber"] += monto

        # 5. Estructurar Reportes
        # 5. Estructurar Reportes
        ingresos_total = 0
        gastos_total = 0
        activos_total = 0
        pasivos_total = 0
        patrimonio_total = 0
        
        er_detalles = []
        bg_detalles = []

        for code in sorted(account_sums.keys()):
            acc = account_sums[code]
            debe = acc["debe"]
            haber = acc["haber"]
            nature = acc["naturaleza"]
            tipo = acc["tipo"]
            
            # Saldo según naturaleza
            saldo = (debe - haber) if nature == "deudora" else (haber - debe)
            if saldo == 0: continue # Omitir cuentas sin saldo en el periodo
                
            item = {"codigo": code, "nombre": acc["nombre"], "monto": saldo, "tipo": tipo}
            
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
                patrimonio_total += saldo
                bg_detalles.append(item)

        return {
            "estado_resultados": {
                "ingresos": ingresos_total,
                "gastos": gastos_total,
                "resultado": ingresos_total - gastos_total,
                "detalles": er_detalles
            },
            "balance_general": {
                "activos": activos_total,
                "pasivos": pasivos_total,
                "patrimonio": patrimonio_total,
                "detalles": bg_detalles
            }
        }
    except Exception as e:
        print(f"ERROR get_financial_reports: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config")
async def get_accounting_config_endpoint(organization_id: str):
    """Retorna todas las configuraciones contables activas."""
    db = get_supabase()
    try:
        res = db.table("centralized_account_config").select("*").eq("organization_id", organization_id).execute()
        return res.data or []
    except Exception as e:
        print(f"ERROR get_accounting_config_endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/config/{config_id}")
async def update_accounting_config_endpoint(config_id: str, req: UpdateAccountingConfigRequest):
    """Actualiza un mapeo de cuentas específico."""
    db = get_supabase()
    try:
        data = req.dict()
        res = db.table("centralized_account_config").update(data).eq("id", config_id).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Error al actualizar configuración")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
