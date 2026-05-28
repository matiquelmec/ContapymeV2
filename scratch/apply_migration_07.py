import psycopg2
import sys

DB_URL = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

STEPS = [
    # Paso 1: Sincronizar históricos de account_id
    """
    UPDATE public.journal_entry_lines jel
    SET account_id = coa.id
    FROM public.journal_entries je, public.chart_of_accounts coa
    WHERE je.id = jel.entry_id
      AND coa.codigo = jel.cuenta_codigo
      AND coa.organization_id = je.organization_id
      AND jel.account_id IS NULL;
    """,
    # Paso 2: Eliminar trigger obsoleto
    """
    DROP TRIGGER IF EXISTS trg_verify_journal_line_accounts ON public.journal_entry_lines;
    """,
    """
    DROP FUNCTION IF EXISTS verify_journal_line_accounts();
    """,
    # Paso 3: Limpiar nulos remanentes si existieran
    """
    DELETE FROM public.journal_entry_lines WHERE account_id IS NULL;
    """,
    # Paso 4: Cambiar a NOT NULL y dropear columnas
    """
    ALTER TABLE public.journal_entry_lines ALTER COLUMN account_id SET NOT NULL;
    """,
    """
    ALTER TABLE public.journal_entry_lines DROP COLUMN IF EXISTS cuenta_codigo;
    """,
    """
    ALTER TABLE public.journal_entry_lines DROP COLUMN IF EXISTS cuenta_nombre;
    """,
    # Paso 5: Redefinir RPC create_journal_entry_with_lines
    """
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

        -- Insertar las líneas resolviendo el ID de cuenta automáticamente
        FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
        LOOP
            -- Buscar el ID de la cuenta basado en el código y organización
            SELECT id INTO v_account_id 
            FROM public.chart_of_accounts 
            WHERE codigo = (v_line->>'cuenta_codigo') 
              AND organization_id = p_organization_id
            LIMIT 1;

            IF v_account_id IS NULL THEN
                RAISE EXCEPTION 'Cuenta contable con código % no encontrada para esta organización.', (v_line->>'cuenta_codigo');
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
    """,
    # Paso 6: Redefinir RPC batch_create_journal_entries
    """
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

            -- Insertar las líneas con resolución de ID
            FOR v_line IN SELECT * FROM jsonb_array_elements(v_entry->'lines')
            LOOP
                SELECT id INTO v_account_id 
                FROM public.chart_of_accounts 
                WHERE codigo = (v_line->>'cuenta_codigo') 
                  AND organization_id = p_organization_id
                LIMIT 1;

                IF v_account_id IS NULL THEN
                    RAISE EXCEPTION 'Cuenta contable con código % no encontrada para esta organización.', (v_line->>'cuenta_codigo');
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
    """
]

def apply_migration():
    try:
        print("Connecting to database via Pooler...")
        conn = psycopg2.connect(DB_URL)
        for i, step in enumerate(STEPS, 1):
            print(f"Applying step {i}/{len(STEPS)}...")
            cur = conn.cursor()
            cur.execute(step)
            conn.commit()
            cur.close()
        conn.close()
        print("✅ Migración 07 aplicada exitosamente en transacciones independientes!")
    except Exception as e:
        print(f"❌ Error aplicando migración en el paso {i}: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    apply_migration()
