import os
import sys
from lxml import etree
from dotenv import load_dotenv

# Load env
load_dotenv()

# We need to import get_supabase from core.database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from core.database import get_supabase

db = get_supabase()

def run():
    print("Buscando empresas registradas en la plataforma...")
    comp_res = db.table("dte_companies").select("id, organization_id, rut").execute()
    if not comp_res.data:
        print("No se encontraron empresas en dte_companies!")
        return
        
    from core.utils import clean_rut_simple
    companies_by_rut = {clean_rut_simple(c["rut"]): c for c in comp_res.data}
    print(f"Encontradas {len(companies_by_rut)} empresas en DB")
    
    caf_dir = r"C:\Users\Matías Riquelme\Desktop\SistemaOC\caf\cert"
    if not os.path.exists(caf_dir):
        print(f"El directorio CAF no se encuentra: {caf_dir}")
        return
        
    print(f"Revisando archivos en {caf_dir}...")
    for filename in os.listdir(caf_dir):
        if not filename.endswith(".xml"):
            continue
            
        filepath = os.path.join(caf_dir, filename)
        try:
            with open(filepath, "rb") as f:
                xml_bytes = f.read()
                
            parser = etree.XMLParser(remove_blank_text=True)
            root = etree.fromstring(xml_bytes, parser)
            
            caf_node = root.find(".//CAF")
            if caf_node is None and root.tag == "CAF":
                caf_node = root
            
            if caf_node is None:
                continue
                
            da_node = caf_node.find("DA")
            rut_emisor = da_node.find("RE").text
            tipo_dte = int(da_node.find("TD").text)
            range_start = int(da_node.find(".//D").text)
            range_end = int(da_node.find(".//H").text)
            fecha_auth = da_node.find("FA").text
            
            cleaned_xml_rut = clean_rut_simple(rut_emisor)
            if cleaned_xml_rut not in companies_by_rut:
                # print(f"[{filename}] Ignorado: El RUT {rut_emisor} no coincide con tu empresa.")
                continue
                
            comp = companies_by_rut[cleaned_xml_rut]
            
            # Desactivar folios previos del mismo tipo
            db.table("dte_caf_folios")\
                .update({"is_active": False})\
                .eq("organization_id", comp["organization_id"])\
                .eq("company_id", comp["id"])\
                .eq("tipo_dte", tipo_dte)\
                .eq("environment", "certification")\
                .execute()
                
            # Insertar nuevos folios
            # Decodificar usando ISO-8859-1 que es el estándar del SII
            caf_data = {
                "organization_id": comp["organization_id"],
                "company_id": comp["id"],
                "tipo_dte": tipo_dte,
                "range_start": range_start,
                "range_end": range_end,
                "last_used_folio": range_start - 1,
                "environment": "certification",
                "caf_xml": xml_bytes.decode('ISO-8859-1'),
                "authorized_at": fecha_auth,
                "is_active": True
            }
            try:
                db.table("dte_caf_folios").insert(caf_data).execute()
                print(f"[{filename}] CARGADO: RUT {rut_emisor} | Tipo {tipo_dte} | Rango: {range_start} a {range_end}")
            except Exception as insert_e:
                if "duplicate key" in str(insert_e).lower() or "23505" in str(insert_e):
                    print(f"[{filename}] YA EXISTE: RUT {rut_emisor} | Tipo {tipo_dte}")
                else:
                    print(f"[{filename}] Error al insertar: {str(insert_e)}")
            
        except Exception as e:
            print(f"[{filename}] Error: {str(e)}")

if __name__ == "__main__":
    run()
