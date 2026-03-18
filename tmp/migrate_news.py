import os
import psycopg2
from dotenv import load_dotenv

# Reemplaza con tu DATABASE_URL si es necesario o cárgala del .env
DATABASE_URL = "postgresql://postgres:Matigol1234.@db.mofkjgfrpfmtnktaepqi.supabase.co:5432/postgres"

def migrate():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        sql = """
        -- ============================================================
        -- CONTAPYME V2 — MÓDULO DIARIO REGIONAL
        -- Propósito: Almacenar noticias dinámicas para Punta Arenas
        -- ============================================================

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

        -- Insertar datos iniciales
        INSERT INTO public.regional_news (title, category, content, image_url, published_at, is_featured)
        VALUES 
        ('Era del Hidrógeno Verde: Magallanes proyecta inversión histórica de US$ 15.000 millones.', 'INVERSIONES', 'La región de Magallanes se prepara para liderar la transición energética global con proyectos de gran escala.', '/news-hydrogen.png', now(), true),
        ('Deportes: Regional de Fútbol inicia con récord de asistencia en el Estadio Fiscal.', 'DEPORTES', 'Miles de magallánicos se reunieron para celebrar el inicio del torneo más importante del extremo sur.', '/news-stadium.png', now(), false),
        ('Alerta Climática: Vientos de hasta 100km/h se esperan para el fin de semana en Magallanes.', 'CLIMA', 'La Onemi regional hace un llamado a la precaución debido a las fuertes ráfagas pronosticadas.', '/news-weather.png', now(), false),
        ('Horóscopo Regional: ¿Qué dicen los astros del sur sobre el inicio de este nuevo ciclo?', 'CULTURA', 'Descubre lo que el cielo de la Patagonia tiene preparado para tu signo este mes.', '/news-horoscopo.png', now(), false)
        ON CONFLICT DO NOTHING;
        """
        
        print("Ejecutando migración...")
        cur.execute(sql)
        conn.commit()
        print("Migración completada exitosamente.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
