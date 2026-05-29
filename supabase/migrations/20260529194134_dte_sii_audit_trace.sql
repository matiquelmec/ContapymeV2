-- Trazabilidad profesional para envios DTE/SII.
-- Un DTE solo puede considerarse "sent" si existe Track ID persistido.

ALTER TABLE public.dte_issued
  ADD COLUMN IF NOT EXISTS sii_environment text
    CHECK (sii_environment IS NULL OR sii_environment IN ('certification', 'production')),
  ADD COLUMN IF NOT EXISTS sii_submission_status text DEFAULT 'not_sent'
    CHECK (sii_submission_status IN ('not_sent', 'signed_local', 'submitted', 'received', 'accepted', 'rejected', 'error')),
  ADD COLUMN IF NOT EXISTS sii_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS sii_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS sii_response_payload jsonb,
  ADD COLUMN IF NOT EXISTS sii_raw_response text,
  ADD COLUMN IF NOT EXISTS envio_xml_content text,
  ADD COLUMN IF NOT EXISTS error_log text;

UPDATE public.dte_issued
SET sii_submission_status = CASE
  WHEN status = 'accepted' THEN 'accepted'
  WHEN status = 'rejected' THEN 'rejected'
  WHEN track_id IS NOT NULL THEN 'submitted'
  WHEN status = 'signed' THEN 'signed_local'
  ELSE 'not_sent'
END
WHERE sii_submission_status IS NULL
   OR sii_submission_status = 'not_sent';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'dte_sent_requires_track_id'
      AND conrelid = 'public.dte_issued'::regclass
  ) THEN
    ALTER TABLE public.dte_issued
      ADD CONSTRAINT dte_sent_requires_track_id
      CHECK (status <> 'sent' OR track_id IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dte_issued_sii_audit
  ON public.dte_issued(organization_id, status, sii_submission_status, track_id);

CREATE INDEX IF NOT EXISTS idx_dte_issued_sii_sent_at
  ON public.dte_issued(organization_id, sii_sent_at DESC)
  WHERE track_id IS NOT NULL;
