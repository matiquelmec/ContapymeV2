import asyncio
from core.dte.dte_logic import DTELogic

async def test_xml_gen():
    org_id = "2e9f634b-4087-448c-bfa6-244bfa1eec61"
    logic = DTELogic(org_id)
    
    # Datos de prueba para una factura
    invoice_data = {
        "tipo_dte": 33,
        "receptor_rut": "60803000-K",
        "receptor_razon_social": "SII - PRUEBA INTEGRACION",
        "monto_neto": 10000,
        "monto_iva": 1900,
        "monto_total": 11900,
        "fecha_emision": "2026-05-15"
    }
    
    items = [
        {
            "product_name": "Servicio de Consultoria IT",
            "quantity": 1,
            "unit_price": 10000,
            "total_amount": 10000
        }
    ]
    
    print("--- GENERANDO DTE CON FOLIO REAL DESDE CAF ---")
    try:
        result = await logic.create_and_sign_invoice(invoice_data, items)
        print(f"[OK] DTE Generado con éxito!")
        print(f"ID: {result['id']}")
        print(f"Folio Asignado: {result['folio']}")
        print(f"Estado: {result['status']}")
        
        # Guardar el XML para inspección
        xml_path = r"C:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\tmp\test_factura.xml"
        with open(xml_path, "w", encoding="ISO-8859-1") as f:
            f.write(result['xml'])
        print(f"XML guardado en: {xml_path}")
        
    except Exception as e:
        print(f"[ERROR] {e}")

if __name__ == "__main__":
    asyncio.run(test_xml_gen())
