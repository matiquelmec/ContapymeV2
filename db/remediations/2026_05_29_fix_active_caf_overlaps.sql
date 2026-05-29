-- Production data remediation for active overlapping CAF ranges detected on 2026-05-29.
-- Context:
-- - No dte_issued rows currently exist for company b924fd19-39f6-4f1c-93de-fe7f01f26bae
--   and tipo_dte 33/39, so these changes avoid future duplicate folio issuance.
-- - DTE 33 keeps the chained small CAFs active but advances overlapping last_used_folio
--   so the existing range_start ordering emits 44,45,46,47,48,49,50,51,52 only once.
-- - DTE 39 keeps the broad 1-1000 CAF active and disables narrower overlapping CAFs.

BEGIN;

-- DTE 33 production: preserve coverage while preventing duplicates.
UPDATE public.dte_caf_folios
SET last_used_folio = 48,
    updated_at = now()
WHERE id = 'ec82aaca-3999-4f45-ab15-04a1e3f77f94'
  AND company_id = 'b924fd19-39f6-4f1c-93de-fe7f01f26bae'
  AND tipo_dte = 33
  AND environment = 'production'
  AND range_start = 45
  AND range_end = 49
  AND last_used_folio < 48;

UPDATE public.dte_caf_folios
SET last_used_folio = 49,
    updated_at = now()
WHERE id = 'dbdd2076-0e65-47c5-b508-1f52630b8b14'
  AND company_id = 'b924fd19-39f6-4f1c-93de-fe7f01f26bae'
  AND tipo_dte = 33
  AND environment = 'production'
  AND range_start = 49
  AND range_end = 52
  AND last_used_folio < 49;

UPDATE public.dte_caf_folios
SET last_used_folio = 52,
    is_active = false,
    updated_at = now()
WHERE id = '98faee7f-0737-4020-8960-a6af3d8ff801'
  AND company_id = 'b924fd19-39f6-4f1c-93de-fe7f01f26bae'
  AND tipo_dte = 33
  AND environment = 'production'
  AND range_start = 52
  AND range_end = 52;

-- DTE 39 production: broad CAF 1-1000 supersedes narrower overlapping CAFs.
UPDATE public.dte_caf_folios
SET is_active = false,
    last_used_folio = GREATEST(last_used_folio, range_end),
    updated_at = now()
WHERE id IN (
    'b5f304dd-daf3-47c3-aab3-0f6e2166f90c',
    '5b9cce63-7e6a-4421-a668-26aef061f2fd'
)
  AND company_id = 'b924fd19-39f6-4f1c-93de-fe7f01f26bae'
  AND tipo_dte = 39
  AND environment = 'production';

COMMIT;
