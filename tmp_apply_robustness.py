import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("engine/.env")
url = os.environ.get("DATABASE_URL")

sql = """
-- 1. View para obtener asientos con su total calculado
CREATE OR REPLACE VIEW public.journal_entries_enriched AS
SELECT 
    je.id,
    je.organization_id,
    je.fecha,
    je.glosa,
    je.numero_asiento,
    je.created_at,
    COALESCE(SUM(jel.monto) FILTER (WHERE jel.tipo = 'debe'), 0) as monto_total
FROM 
    public.journal_entries je
LEFT JOIN 
    public.journal_entry_lines jel ON je.id = jel.entry_id
GROUP BY 
    je.id, je.organization_id, je.fecha, je.glosa, je.numero_asiento, je.created_at;

-- 2. RPC para insertar asiento y líneas en una transacción
CREATE OR REPLACE FUNCTION public.create_journal_entry_with_lines(
    p_organization_id uuid,
    p_fecha date,
    p_glosa text,
    p_lines jsonb
) RETURNS uuid AS $$
DECLARE
    v_entry_id uuid;
    v_line jsonb;
BEGIN
    -- 1. Insertar el encabezado
    INSERT INTO public.journal_entries (organization_id, fecha, glosa)
    VALUES (p_organization_id, p_fecha, p_glosa)
    RETURNING id INTO v_entry_id;

    -- 2. Insertar las líneas desde el JSON
    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        INSERT INTO public.journal_entry_lines (
            entry_id, 
            cuenta_codigo, 
            cuenta_nombre, 
            tipo, 
            monto, 
            account_id
        ) VALUES (
            v_entry_id,
            (v_line->>'cuenta_codigo'),
            (v_line->>'cuenta_nombre'),
            (v_line->>'tipo'),
            (v_line->>'monto')::bigint,
            ((v_line->>'account_id')::uuid)
        );
    END LOOP;

    RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
"""

try:
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    cur.execute(sql)
    conn.commit()
    print("SUCCESS: Migration applied successfully.")
except Exception as e:
    print(f"FAILURE: {e}")
finally:
    if 'cur' in locals(): cur.close()
    if 'conn' in locals(): conn.close()
