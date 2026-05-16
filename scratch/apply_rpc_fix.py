import psycopg2
import os

DB_URL = "postgresql://postgres:Matigol1234.@db.mofkjgfrpfmtnktaepqi.supabase.co:5432/postgres"

SQL = """
-- ============================================================
-- 🛠️ REPARACIÓN DE INTEGRIDAD: RPC DE ASIENTOS CONTABLES (v2)
-- Objetivo: Garantizar que cada línea tenga account_id y organization_id
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_journal_entry_with_lines(
    p_organization_id uuid,
    p_fecha date,
    p_glosa text,
    p_lines jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_journal_id uuid;
    v_line jsonb;
    v_account_id uuid;
BEGIN
    INSERT INTO public.journal_entries (organization_id, fecha, glosa) 
    VALUES (p_organization_id, p_fecha, p_glosa) 
    RETURNING id INTO v_journal_id;

    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        SELECT id INTO v_account_id FROM public.chart_of_accounts 
        WHERE codigo = (v_line->>'cuenta_codigo') AND organization_id = p_organization_id LIMIT 1;

        INSERT INTO public.journal_entry_lines (
            organization_id, entry_id, account_id, cuenta_codigo, cuenta_nombre, tipo, monto
        ) VALUES (
            p_organization_id, v_journal_id, v_account_id, (v_line->>'cuenta_codigo'), (v_line->>'cuenta_nombre'), (v_line->>'tipo')::text, (v_line->>'monto')::numeric
        );
    END LOOP;
    RETURN v_journal_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.batch_create_journal_entries(
    p_organization_id uuid,
    p_entries jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entry jsonb;
    v_line jsonb;
    v_journal_id uuid;
    v_account_id uuid;
    v_record_id uuid;
    v_record_table text;
    v_count int := 0;
    v_results jsonb := '[]'::jsonb;
BEGIN
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
    LOOP
        INSERT INTO public.journal_entries (organization_id, fecha, glosa) 
        VALUES (p_organization_id, (v_entry->>'fecha')::date, (v_entry->>'glosa')::text) 
        RETURNING id INTO v_journal_id;

        FOR v_line IN SELECT * FROM jsonb_array_elements(v_entry->'lines')
        LOOP
            SELECT id INTO v_account_id FROM public.chart_of_accounts 
            WHERE codigo = (v_line->>'cuenta_codigo') AND organization_id = p_organization_id LIMIT 1;

            INSERT INTO public.journal_entry_lines (
                organization_id, entry_id, account_id, cuenta_codigo, cuenta_nombre, tipo, monto
            ) VALUES (
                p_organization_id, v_journal_id, v_account_id, (v_line->>'cuenta_codigo'), (v_line->>'cuenta_nombre'), (v_line->>'tipo')::text, (v_line->>'monto')::numeric
            );
        END LOOP;

        v_record_id := (v_entry->>'record_id')::uuid;
        v_record_table := (v_entry->>'record_table')::text;
        IF v_record_table = 'purchase_records' THEN
            UPDATE public.purchase_records SET journal_entry_id = v_journal_id WHERE id = v_record_id;
        ELSIF v_record_table = 'sales_records' THEN
            UPDATE public.sales_records SET journal_entry_id = v_journal_id WHERE id = v_record_id;
        END IF;

        v_count := v_count + 1;
        v_results := v_results || jsonb_build_object('record_id', v_record_id, 'journal_entry_id', v_journal_id);
    END LOOP;
    RETURN jsonb_build_object('success', true, 'entries_created', v_count, 'details', v_results);
END;
$$;
"""

def apply_fix():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        cur.execute(SQL)
        conn.commit()
        cur.close()
        conn.close()
        print("✅ RPCs actualizadas con éxito. La integridad futura está garantizada.")
    except Exception as e:
        print(f"❌ Error aplicando fix: {e}")

if __name__ == "__main__":
    apply_fix()
