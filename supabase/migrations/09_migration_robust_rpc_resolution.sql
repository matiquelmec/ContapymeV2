-- Migración 09: Resolución robusta de cuentas en RPCs contables
-- Permite que create_journal_entry_with_lines y batch_create_journal_entries
-- resuelvan la cuenta usando 'account_id' directamente si se provee en el JSONB, con fallback a 'cuenta_codigo'.

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
    -- Insertar el encabezado
    INSERT INTO public.journal_entries (
        organization_id,
        fecha,
        glosa
    ) VALUES (
        p_organization_id,
        p_fecha,
        p_glosa
    ) RETURNING id INTO v_journal_id;

    -- Insertar las líneas
    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        v_account_id := NULL;
        
        -- 1. Intentar resolver por account_id si se pasa directamente
        IF v_line->>'account_id' IS NOT NULL THEN
            SELECT id INTO v_account_id
            FROM public.chart_of_accounts
            WHERE id = (v_line->>'account_id')::uuid
              AND organization_id = p_organization_id;
        END IF;

        -- 2. Fallback a cuenta_codigo si no se pudo resolver por id
        IF v_account_id IS NULL AND v_line->>'cuenta_codigo' IS NOT NULL THEN
            SELECT id INTO v_account_id 
            FROM public.chart_of_accounts 
            WHERE codigo = (v_line->>'cuenta_codigo') 
              AND organization_id = p_organization_id
            LIMIT 1;
        END IF;

        IF v_account_id IS NULL THEN
            RAISE EXCEPTION 'Cuenta contable con código % o id % no encontrada para esta organización.', (v_line->>'cuenta_codigo'), (v_line->>'account_id');
        END IF;

        INSERT INTO public.journal_entry_lines (
            organization_id,
            entry_id,
            account_id,
            tipo,
            monto
        ) VALUES (
            p_organization_id,
            v_journal_id,
            v_account_id,
            (v_line->>'tipo')::text,
            (v_line->>'monto')::numeric
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
        -- Crear el encabezado
        INSERT INTO public.journal_entries (
            organization_id,
            fecha,
            glosa
        ) VALUES (
            p_organization_id,
            (v_entry->>'fecha')::date,
            (v_entry->>'glosa')::text
        ) RETURNING id INTO v_journal_id;

        -- Insertar las líneas
        FOR v_line IN SELECT * FROM jsonb_array_elements(v_entry->'lines')
        LOOP
            v_account_id := NULL;
            
            -- 1. Intentar resolver por account_id si se pasa directamente
            IF v_line->>'account_id' IS NOT NULL THEN
                SELECT id INTO v_account_id
                FROM public.chart_of_accounts
                WHERE id = (v_line->>'account_id')::uuid
                  AND organization_id = p_organization_id;
            END IF;

            -- 2. Fallback a cuenta_codigo si no se pudo resolver por id
            IF v_account_id IS NULL AND v_line->>'cuenta_codigo' IS NOT NULL THEN
                SELECT id INTO v_account_id 
                FROM public.chart_of_accounts 
                WHERE codigo = (v_line->>'cuenta_codigo') 
                  AND organization_id = p_organization_id
                LIMIT 1;
            END IF;

            IF v_account_id IS NULL THEN
                RAISE EXCEPTION 'Cuenta contable con código % o id % no encontrada para esta organización.', (v_line->>'cuenta_codigo'), (v_line->>'account_id');
            END IF;

            INSERT INTO public.journal_entry_lines (
                organization_id,
                entry_id,
                account_id,
                tipo,
                monto
            ) VALUES (
                p_organization_id,
                v_journal_id,
                v_account_id,
                (v_line->>'tipo')::text,
                (v_line->>'monto')::numeric
            );
        END LOOP;

        -- Vínculo original
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
