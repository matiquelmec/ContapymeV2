import os
import sys
import glob
from io import BytesIO
from datetime import datetime, timezone
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from dotenv import load_dotenv
from pathlib import Path

# Cargar entorno
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "engine"))
load_dotenv(ROOT / ".env")

from core.database import get_supabase

def process_and_upload_image(source_img_path: str) -> str:
    print(f"Cargando imagen: {source_img_path}")
    im = Image.open(source_img_path)
    if im.mode in ("RGBA", "P"):
        im = im.convert("RGB")
    
    # Encuadre 16:9 respetando la cabeza del sujeto (centering vertical 0.25)
    target_w, target_h = 1280, 720
    im_16_9 = ImageOps.fit(im, (target_w, target_h), method=Image.Resampling.LANCZOS, centering=(0.5, 0.25))
    
    # Revelado óptico editorial
    im_16_9 = ImageEnhance.Color(im_16_9).enhance(0.96)
    im_16_9 = ImageEnhance.Contrast(im_16_9).enhance(1.04)
    im_16_9 = im_16_9.filter(ImageFilter.UnsharpMask(radius=1.2, percent=115, threshold=3))
    
    out_buf = BytesIO()
    im_16_9.save(out_buf, format="WEBP", quality=92, method=6)
    webp_bytes = out_buf.getvalue()
    print(f"Imagen procesada a WebP: {len(webp_bytes) / 1024:.1f} KB")
    
    db = get_supabase()
    dest_filename = "comunicados/abogado-juan-jose-srdanovic-demanda-hospital-puerto-natales.webp"
    
    # Subir con upsert
    try:
        db.storage.from_("news_images").upload(
            path=dest_filename,
            file=webp_bytes,
            file_options={"content-type": "image/webp", "upsert": "true"}
        )
    except Exception as e:
        print(f"Aviso en upload (puede existir, intentando obtener URL): {e}")
        
    public_url = db.storage.from_("news_images").get_public_url(dest_filename).split('?')[0]
    print(f"URL pública de la imagen en Supabase: {public_url}")
    return public_url

def main():
    folder = os.path.expanduser(r"~\Desktop\Comunicados y noticias\comunicado del abogado, Juan José Srdanovic")
    img_candidates = glob.glob(os.path.join(folder, "*.jpeg")) + glob.glob(os.path.join(folder, "*.jpg"))
    if not img_candidates:
        # Fallback a la copia en brain si no se encuentra
        brain_copy = r"C:\Users\Matías Riquelme\.gemini\antigravity\brain\55bb36db-1d6c-4550-80e9-7840c6c4ba93\comunicado_srdanovic_img.jpeg"
        if os.path.exists(brain_copy):
            img_path = brain_copy
        else:
            raise FileNotFoundError("No se encontró la imagen del comunicado.")
    else:
        img_path = img_candidates[0]

    image_url = process_and_upload_image(img_path)
    
    title = "Padres de adolescente fallecida en Hospital de Puerto Natales demandan al Servicio de Salud Magallanes por $400 millones"
    slug = "padres-adolescente-fallecida-hospital-puerto-natales-demandan-servicio-salud-magallanes"
    
    summary = (
        "La acción judicial denuncia presuntas deficiencias en la atención de una joven de 16 años, "
        "cuya causa de muerte fue taponamiento cardíaco. La demanda (Causa Rol C-1581-2026) fue presentada "
        "ante el 2.° Juzgado de Letras de Punta Arenas por el abogado Juan José Srdanovic Arcos."
    )
    
    content = """Padres de adolescente fallecida en Hospital de Puerto Natales demandan al Servicio de Salud Magallanes por $400 millones

La acción judicial denuncia presuntas deficiencias en la atención de una joven de 16 años, cuya causa de muerte fue establecida posteriormente como taponamiento cardíaco.

Una demanda de indemnización de perjuicios por $400 millones fue presentada ante el 2.° Juzgado de Letras de Punta Arenas contra el Servicio de Salud Magallanes, a raíz del fallecimiento de la menor, en ese entonces, de 16 años de iniciales F.E.R.B., ocurrido el 21 de marzo de 2023 en el Hospital Dr. Augusto Essmann Burgos de Puerto Natales.

Se trata de la Causa Rol C-1581-2026, «Risco con Servicio de Salud de Magallanes», 2.° Juzgado de Letras de Punta Arenas.

La acción judicial fue interpuesta por sus padres de iniciales L.J.B.M. y M.A.R.T., representados por el abogado Juan José Srdanovic Arcos, y persigue establecer la responsabilidad del organismo sanitario por las presuntas deficiencias que habrían afectado la atención médica de su hija.

### Una primera consulta y un desenlace fatal

Según los antecedentes expuestos en la demanda, la menor acudió al servicio de urgencia el 19 de marzo de 2023, presentando diversos síntomas que, inicialmente, fueron asociados a un cuadro respiratorio viral.

Luego de recibir tratamiento sintomático, fue enviada a su domicilio. Sin embargo, su estado de salud empeoró progresivamente, obligándola a regresar al hospital durante la noche del 20 de marzo, oportunidad en que presentaba síntomas graves, entre ellos, palidez, taquicardia, hipotensión y signos de compromiso circulatorio. A pesar de los esfuerzos médicos posteriores, la adolescente falleció durante la madrugada del 21 de marzo.

La investigación médico-legal estableció posteriormente que la causa de muerte fue un taponamiento cardíaco, condición caracterizada por la acumulación de líquido alrededor del corazón que puede comprometer gravemente su funcionamiento.

### Auditoría del propio Servicio de Salud detectó deficiencias

Uno de los principales antecedentes invocados en la demanda corresponde a una auditoría efectuada por el propio Servicio de Salud Magallanes durante 2023. De acuerdo con el documento citado en la acción judicial, la auditoría calificó como de criticidad alta la ausencia de un examen físico completo documentado, durante la primera atención de urgencia.

La demanda también cuestiona la demora en obtener informes radiológicos, la falta de evaluación cardiológica oportuna y la ausencia de una derivación temprana a un establecimiento de mayor complejidad.

### La familia solicita justicia y esclarecimiento de los hechos

Los padres de la entonces menor sostienen que las presuntas fallas en la atención sanitaria privaron a su hija de una oportunidad real de acceder a un diagnóstico y tratamiento oportunos.

Por ello, solicitan una indemnización de $200 millones para cada uno, por concepto del daño moral sufrido como consecuencia de su fallecimiento.

La demanda no sólo busca una reparación económica, sino también que se esclarezcan judicialmente las circunstancias en que se produjo el fallecimiento y se determine si existió responsabilidad del servicio público de salud.

### Un caso que plantea interrogantes sobre la atención de urgencia

La acción judicial abre un debate sobre la capacidad de respuesta de los establecimientos hospitalarios ante emergencias médicas complejas, especialmente cuando se requiere diagnóstico especializado, coordinación asistencial y el eventual traslado a hospitales de mayor complejidad.

El caso se encuentra en una etapa procesal inicial y corresponderá a los tribunales determinar la existencia de una eventual falta de servicio, su relación con el fallecimiento y la procedencia de la indemnización solicitada."""

    now_iso = datetime.now(timezone.utc).isoformat()
    
    comunicado_data = {
        "title": title,
        "slug": slug,
        "category": "SII / LEGAL",
        "content_type": "comunicado",
        "is_featured": True,
        "is_protected": True,  # Blindado contra purgas automáticas del crawler
        "source_name": "Juan José Srdanovic / Daisy Castillo",
        "author_name": "Abogado Juan José Srdanovic Arcos (Difusión: Periodista Daisy Castillo)",
        "source_url": f"https://contapymepuq.cl/noticias/{slug}",
        "normalized_title": "padres de adolescente fallecida en hospital de puerto natales demandan al servicio de salud magallanes por 400 millones",
        "published_at": now_iso,
        "image_url": image_url,
        "summary": summary,
        "seo_description": "Demanda de indemnización por $400 millones contra el Servicio de Salud Magallanes ante el 2° Juzgado de Letras de Punta Arenas por caso en Hospital de Puerto Natales.",
        "seo_keywords": "Hospital Puerto Natales, Servicio de Salud Magallanes, demanda negligencia médica, Juan José Srdanovic, Daisy Castillo, Punta Arenas, taponamiento cardíaco",
        "media": [
            {
                "type": "image",
                "url": image_url,
                "caption": "Abogado Juan José Srdanovic Arcos, patrocinante de la demanda contra el Servicio de Salud Magallanes.",
                "credit": "Registro Oficial / Periodista Daisy Castillo"
            }
        ],
        "content": content
    }
    
    db = get_supabase()
    print("Verificando si la noticia/comunicado ya existe...")
    existing = db.table("regional_news").select("id").eq("slug", slug).execute()
    
    if existing.data and len(existing.data) > 0:
        eid = existing.data[0]["id"]
        print(f"Actualizando registro existente ID {eid}...")
        res = db.table("regional_news").update(comunicado_data).eq("id", eid).execute()
    else:
        print("Insertando nuevo comunicado oficial...")
        res = db.table("regional_news").insert(comunicado_data).execute()
        
    print("Publicación completada con éxito:")
    print("ID:", res.data[0]["id"])
    print("Slug:", res.data[0]["slug"])
    print(f"URL de visualización: https://contapymepuq.cl/noticias/{res.data[0]['slug']}")

if __name__ == "__main__":
    main()
