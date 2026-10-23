import os
import json
from datetime import datetime, timezone
from supabase import create_client

url = 'https://mofkjgfrpfmtnktaepqi.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMzg3MSwiZXhwIjoyMDg5MTA5ODcxfQ.4Dt6aFWe-0aDpY2LpeTC-CRkh2nh7YHFAGSr-M7uBvI'

sb = create_client(url, key)

comunicado = {
    'title': 'Concejala Alicia Stipicic pide evitar que la Costanera de Punta Arenas se convierta en basurero',
    'slug': 'concejala-alicia-stipicic-pide-evitar-que-la-costanera-de-punta-arenas-se-convierta-en-basurero',
    'category': 'REGIONAL',
    'content_type': 'comunicado',
    'is_featured': True,
    'is_protected': True,
    'source_name': 'Oficina Concejala Alicia Stipicic',
    'author_name': 'Oficina de Comunicaciones — Concejala Alicia Stipicic',
    'source_url': 'https://www.contapymepuq.cl/noticias/concejala-alicia-stipicic-pide-evitar-que-la-costanera-de-punta-arenas-se-convierta-en-basurero',
    'normalized_title': 'concejala alicia stipicic pide evitar que la costanera de punta arenas se convierta en basurero',
    'published_at': datetime.now(timezone.utc).isoformat(),
    'image_url': 'https://mofkjgfrpfmtnktaepqi.supabase.co/storage/v1/object/public/news_images/stipicic-costanera/costanera-portada-alicia-stipicic.webp',
    'summary': 'La concejala de Punta Arenas, Alicia Stipicic, realizó un urgente llamado a la comunidad para cuidar la limpieza de la costanera y de los espacios naturales ante la llegada de la temporada estival en la región.',
    'seo_description': 'La concejala Alicia Stipicic pide cuidar la Costanera del Estrecho de Punta Arenas y evitar microbasurales ante la llegada de la temporada estival.',
    'seo_keywords': 'costanera punta arenas, alicia stipicic, concejala, basura borde costero, estrecho de magallanes, rio de las minas, medio ambiente magallanes',
    'media': [
        {
            'type': 'image',
            'url': 'https://mofkjgfrpfmtnktaepqi.supabase.co/storage/v1/object/public/news_images/stipicic-costanera/costanera-residuos-punta-arenas.webp',
            'caption': 'Restos de basura, plásticos y escombros acumulados a orillas de la Costanera del Estrecho.',
            'credit': 'Gentileza Oficina Concejala Alicia Stipicic'
        },
        {
            'type': 'image',
            'url': 'https://mofkjgfrpfmtnktaepqi.supabase.co/storage/v1/object/public/news_images/stipicic-costanera/concejala-alicia-stipicic.webp',
            'caption': 'Alicia Stipicic, concejala de la comuna de Punta Arenas.',
            'credit': 'Registro Oficial'
        },
        {
            'type': 'video',
            'url': 'https://mofkjgfrpfmtnktaepqi.supabase.co/storage/v1/object/public/news_images/stipicic-costanera/video-concejala-alicia-stipicic.mp4',
            'poster': 'https://mofkjgfrpfmtnktaepqi.supabase.co/storage/v1/object/public/news_images/stipicic-costanera/video-poster-alicia-stipicic.webp',
            'caption': 'Declaraciones de la concejala Alicia Stipicic sobre el cuidado del borde costero.',
            'credit': 'Oficina de Comunicaciones'
        }
    ],
    'content': """La concejala de Punta Arenas, Alicia Stipicic, realizó un llamado a la comunidad a cuidar la limpieza de la costanera y de los espacios naturales de la ciudad. Al mismo tiempo, manifestó su preocupación por la gran cantidad de basura que se observa diariamente en el borde costero.

Al respecto, señaló que "nuestra costanera es un patrimonio de todos los puntarenenses y tenemos la responsabilidad de cuidarla". En ese sentido, precisó que la Costanera del Estrecho es uno de los espacios públicos más emblemáticos de Punta Arenas, es punto de encuentro para residentes, deportistas y miles de turistas nacionales e internacionales que visitan la Región de Magallanes.

La edil sostuvo que "el deterioro de este espacio afecta directamente la calidad de vida de las familias puntarenenses. Basta caminar por nuestra costanera para encontrarse con vasos de café desechables, papeles, botellas plásticas, latas de cerveza y todo tipo de desperdicios abandonados en la playa. Incluso, se han encontrado neumáticos y televisores. Esta es una situación que no podemos seguir normalizando".

Stipicic recordó que, a lo largo de la costanera, existen basureros y lugares habilitados para depositar residuos, por lo que hizo un llamado a utilizarlos y a evitar arrojar desperdicios en los espacios públicos.

SE VIENE LA TEMPORADA ESTIVAL

Hay que considerar que, debido a los fuertes vientos de la zona (que superan fácilmente los 80 a 100 km/h en época estival), la basura que no se deposita adecuadamente o que queda en contenedores abiertos se dispersa con rapidez hacia el mar.

La concejala Alicia Stipicic planteó que los residuos plásticos, latas y botellas abandonados en el borde costero terminan en el ecosistema marino, afectando, por ejemplo, a los pingüinos, las gaviotas y, en general, a la biodiversidad marina. "Estamos entrando en una época del año en que los días comienzan a estar más agradables y muchas familias salen a caminar, hacer deporte o simplemente disfrutar de nuestro hermoso Estrecho de Magallanes. No podemos permitir que uno de los lugares más lindos y emblemáticos de Punta Arenas termine convertido en un basurero", expresó.

La concejala extendió este llamado al cuidado de los ríos y sus cauces, especialmente al Río de las Minas, advirtiendo que los residuos arrojados a sus lechos pueden ser arrastrados durante las crecidas, contaminando otros sectores de la ciudad y llegando finalmente al mar.

Añadió que la retirada constante de microbasurales y la limpieza extraordinaria de áreas verdes y borde costero significan un gasto fiscal permanente que podría destinarse a otras necesidades comunales.

Alicia Stipicic manifestó que "cuidar nuestra ciudad no es solamente una responsabilidad de las autoridades municipales. Es una tarea de todos. Si llevamos un café, una bebida o alimentos para disfrutar de nuestra costanera, también debemos hacernos responsables de los residuos que generamos. Y si no encontramos un basurero cerca, podemos llevarlos con nosotros hasta encontrar un lugar habilitado".

Y reiteró su invitación a los vecinos a comprometerse con la limpieza de Punta Arenas: "Quiero hacer un llamado sencillo, pero muy importante: cuidemos nuestra costanera, cuidemos nuestros ríos y cuidemos nuestra ciudad. No arrojemos basura donde caminamos, donde juegan nuestros niños y donde disfrutamos de la naturaleza. Punta Arenas es nuestra casa y mantenerla limpia es responsabilidad de todos", concluyó."""
}

print("Buscando si el comunicado ya existe...")
existing = sb.table('regional_news').select('id').eq('slug', comunicado['slug']).execute()

if existing.data and len(existing.data) > 0:
    eid = existing.data[0]['id']
    print(f"Actualizando registro ID {eid}...")
    res = sb.table('regional_news').update(comunicado).eq('id', eid).execute()
else:
    print("Insertando nuevo registro...")
    res = sb.table('regional_news').insert(comunicado).execute()

print("Resultado exitoso:")
print("Data:", res.data[0]['id'], "| Slug:", res.data[0]['slug'])
