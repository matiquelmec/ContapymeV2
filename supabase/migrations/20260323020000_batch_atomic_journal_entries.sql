-- ============================================================
-- CONTAPYME V2 — MIGRACIÓN: ATOMICIDAD BATCH DE ASIENTOS CONTABLES
-- Fecha: 2026-03-23
-- Descripción: RPC para crear múltiples asientos con sus líneas en una
--              sola transacción atómica. Resuelve DT-15 (Riesgo Integridad).
-- ============================================================

-- 1. RPC: Crear múltiples asientos contables en una sola transacción
-- Input: JSON array de { fecha, glosa, record_id, record_table, lines: [{cuenta_codigo, cuenta_nombre, tipo, monto}] }
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
    v_record_id uuid;
    v_record_table text;
    v_count int := 0;
    v_results jsonb := '[]'::jsonb;
BEGIN
    -- Iterar sobre cada entrada del batch
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
    LOOP
        -- 1. Crear el encabezado del asiento
        INSERT INTO public.journal_entries (
            organization_id,
            fecha,
            glosa
        ) VALUES (
            p_organization_id,
            (v_entry->>'fecha')::date,
            (v_entry->>'glosa')::text
        ) RETURNING id INTO v_journal_id;

        -- 2. Insertar las líneas del detalle
        FOR v_line IN SELECT * FROM jsonb_array_elements(v_entry->'lines')
        LOOP
            INSERT INTO public.journal_entry_lines (
                entry_id,
                cuenta_codigo,
                cuenta_nombre,
                tipo,
                monto
            ) VALUES (
                v_journal_id,
                (v_line->>'cuenta_codigo'),
                (v_line->>'cuenta_nombre'),
                (v_line->>'tipo')::text,
                (v_line->>'monto')::numeric
            );
        END LOOP;

        -- 3. Vincular el asiento al registro de origen (purchase_records o sales_records)
        v_record_id := (v_entry->>'record_id')::uuid;
        v_record_table := (v_entry->>'record_table')::text;
        
        IF v_record_table = 'purchase_records' THEN
            UPDATE public.purchase_records 
            SET journal_entry_id = v_journal_id 
            WHERE id = v_record_id;
        ELSIF v_record_table = 'sales_records' THEN
            UPDATE public.sales_records 
            SET journal_entry_id = v_journal_id 
            WHERE id = v_record_id;
        END IF;

        v_count := v_count + 1;
        v_results := v_results || jsonb_build_object(
            'record_id', v_record_id,
            'journal_entry_id', v_journal_id
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'entries_created', v_count,
        'details', v_results
    );

EXCEPTION WHEN OTHERS THEN
    -- Si CUALQUIER cosa falla, toda la transacción se revierte automáticamente
    RAISE EXCEPTION 'Batch atómico falló: % — Se revirtieron todos los cambios.', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.batch_create_journal_entries IS 
'Crea múltiples asientos contables con sus líneas en una sola transacción atómica. 
Si falla cualquier inserción, se revierten TODOS los cambios. Resuelve DT-15.';
