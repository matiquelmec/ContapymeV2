-- Migration: harden SII raw response persistence for production.
-- This is intentionally idempotent because production may already have some
-- of these columns/tables from earlier DTE hardening work.

BEGIN;

CREATE TABLE IF NOT EXISTS public.dte_sii_raw_archive (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    dte_id uuid,
    organization_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    original_length integer,
    head text,
    tail text,
    storage_path text,
    CONSTRAINT dte_sii_raw_archive_pkey PRIMARY KEY (id)
);

ALTER TABLE public.dte_issued
  ADD COLUMN IF NOT EXISTS sii_raw_response text,
  ADD COLUMN IF NOT EXISTS sii_raw_response_path text;

ALTER TABLE public.dte_sii_raw_archive
  ADD COLUMN IF NOT EXISTS dte_id uuid,
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS original_length integer,
  ADD COLUMN IF NOT EXISTS head text,
  ADD COLUMN IF NOT EXISTS tail text,
  ADD COLUMN IF NOT EXISTS storage_path text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'dte_sii_raw_archive_dte_id_fkey'
      AND conrelid = 'public.dte_sii_raw_archive'::regclass
  ) THEN
    ALTER TABLE public.dte_sii_raw_archive
      ADD CONSTRAINT dte_sii_raw_archive_dte_id_fkey
      FOREIGN KEY (dte_id) REFERENCES public.dte_issued(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'dte_sii_raw_archive_organization_id_fkey'
      AND conrelid = 'public.dte_sii_raw_archive'::regclass
  ) THEN
    ALTER TABLE public.dte_sii_raw_archive
      ADD CONSTRAINT dte_sii_raw_archive_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;

-- Process existing large rows in batches before validating the 64 KB guardrail.
DO $$
DECLARE
  batch_size INT := 500;
  threshold INT := 65536;
  rows_moved INT := 0;
BEGIN
  LOOP
    WITH to_move AS (
      SELECT id, organization_id, sii_raw_response
      FROM public.dte_issued
      WHERE coalesce(char_length(sii_raw_response), 0) > threshold
      ORDER BY id
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    ), inserted AS (
      INSERT INTO public.dte_sii_raw_archive (id, dte_id, organization_id, original_length, head, tail, storage_path)
      SELECT gen_random_uuid(), id, organization_id, char_length(sii_raw_response),
             left(sii_raw_response, 8192), right(sii_raw_response, 8192), NULL
      FROM to_move
      RETURNING dte_id
    ), updated AS (
      UPDATE public.dte_issued d
      SET sii_raw_response = (to_jsonb(json_build_object(
            'truncated', true,
            'original_length', char_length(d.sii_raw_response),
            'head', left(d.sii_raw_response, 8192),
            'tail', right(d.sii_raw_response, 8192)
          ))::text),
          sii_raw_response_path = NULL,
          updated_at = now()
      FROM to_move tm
      WHERE d.id = tm.id
      RETURNING d.id
    )
    SELECT count(*) INTO rows_moved FROM updated;

    IF rows_moved = 0 THEN
      EXIT;
    END IF;

    RAISE NOTICE 'Archived % rows in this batch', rows_moved;
  END LOOP;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.contype = 'c'
      AND n.nspname = 'public'
      AND t.relname = 'dte_issued'
      AND c.conname = 'chk_sii_raw_len'
  ) THEN
    ALTER TABLE public.dte_issued
      ADD CONSTRAINT chk_sii_raw_len
      CHECK (coalesce(char_length(sii_raw_response), 0) <= 65536)
      NOT VALID;
  END IF;
END $$;

ALTER TABLE public.dte_issued VALIDATE CONSTRAINT chk_sii_raw_len;

CREATE INDEX IF NOT EXISTS dte_issued_org_company_tipo_folio_env_idx
  ON public.dte_issued (organization_id, company_id, tipo_dte, folio, sii_environment);

CREATE INDEX IF NOT EXISTS dte_issued_org_status_track_idx
  ON public.dte_issued (organization_id, status, track_id);

CREATE INDEX IF NOT EXISTS dte_issued_org_submission_checked_idx
  ON public.dte_issued (organization_id, sii_submission_status, sii_checked_at);

CREATE INDEX IF NOT EXISTS dte_caf_folios_active_lookup_idx
  ON public.dte_caf_folios (organization_id, company_id, tipo_dte, environment, is_active);

CREATE INDEX IF NOT EXISTS dte_sii_raw_archive_dte_id_idx
  ON public.dte_sii_raw_archive (dte_id);

CREATE INDEX IF NOT EXISTS dte_sii_raw_archive_org_created_idx
  ON public.dte_sii_raw_archive (organization_id, created_at);

CREATE INDEX IF NOT EXISTS dte_items_dte_line_idx
  ON public.dte_items (dte_id, line_number);
