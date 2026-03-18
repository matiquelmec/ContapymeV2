import os
import sys
from pathlib import Path

# Agregar el directorio engine al sys.path para importar core.database
sys.path.append(str(Path(__file__).parent.parent / 'engine'))

from core.database import get_supabase

def migrate():
    try:
        db = get_supabase()
        
        # SQL para crear la tabla
        sql = """
        CREATE TABLE IF NOT EXISTS public.regional_news (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          title text NOT NULL,
          category text NOT NULL,
          content text NOT NULL,
          image_url text,
          published_at timestamp with time zone NOT NULL DEFAULT now(),
          is_featured boolean DEFAULT false,
          created_at timestamp with time zone NOT NULL DEFAULT now(),
          updated_at timestamp with time zone NOT NULL DEFAULT now(),
          CONSTRAINT regional_news_pkey PRIMARY KEY (id)
        );
        """
        
        print("Ejecutando migración vía RPC/SQL...")
        # Nota: Supabase Python no tiene cur.execute(sql) directo al menos que usemos postgres-py
        # Pero podemos usar rpc si hay una función db.run_sql (que suele estar habilitada en entornos dev)
        # O simplemente usar el cliente db para insertar datos si la tabla ya existe.
        
        # Como no tenemos rpc general, intentaremos insertar datos asumiendo que la tabla existe
        # (Si no existe, fallará y sabremos que necesitamos crearla por otro medio)
        
        news_data = [
            {'title': 'Era del Hidrógeno Verde: Magallanes proyecta inversión histórica de US$ 15.000 millones.', 'category': 'INVERSIONES', 'content': 'La región de Magallanes se prepara para liderar la transición energética global con proyectos de gran escala.', 'image_url': '/news-hydrogen.png', 'is_featured': True},
            {'title': 'Deportes: Regional de Fútbol inicia con récord de asistencia en el Estadio Fiscal.', 'category': 'DEPORTES', 'content': 'Miles de magallánicos se reunieron para celebrar el inicio del torneo más importante del extremo sur.', 'image_url': '/news-stadium.png', 'is_featured': False},
            {'title': 'Alerta Climática: Vientos de hasta 100km/h se esperan para el fin de semana en Magallanes.', 'category': 'CLIMA', 'content': 'La Onemi regional hace un llamado a la precaución debido a las fuertes ráfagas pronosticadas.', 'image_url': '/news-weather.png', 'is_featured': False},
            {'title': 'Horóscopo Regional: ¿Qué dicen los astros del sur sobre el inicio de este nuevo ciclo?', 'category': 'CULTURA', 'content': 'Descubre lo que el cielo de la Patagonia tiene preparado para tu signo este mes.', 'image_url': '/news-horoscopo.png', 'is_featured': False}
        ]
        
        for item in news_data:
            db.table('regional_news').upsert(item, on_conflict='title').execute()
            print(f"Noticia '{item['title'][:20]}...' sincronizada.")
            
        print("Migración de datos completada.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
