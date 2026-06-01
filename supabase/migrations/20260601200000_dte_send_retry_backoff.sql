-- =============================================================================
-- DTE: Backoff y tope de reintentos de envío al SII
-- Fecha: 2026-06-01
--
-- CAUSA: el worker (track_id_worker) reenviaba CADA 60s todos los DTE en estado
-- 'signed' sin track_id, sin backoff ni tope -> martilleo del getToken del SII
-- -> throttling por abuso (estado 10 persistente).
--
-- Estas columnas permiten al worker reintentar con backoff exponencial y dejar
-- de reintentar tras N intentos (sin introducir un nuevo valor de status, para
-- no depender de si 'status' es enum o text).
-- =============================================================================

SET search_path = public;

ALTER TABLE public.dte_issued
  ADD COLUMN IF NOT EXISTS send_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_send_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_send_error text;

-- Índice para que el worker filtre eficientemente los pendientes de reenvío.
CREATE INDEX IF NOT EXISTS idx_dte_issued_pending_resend
  ON public.dte_issued (status, send_attempts, next_send_retry_at)
  WHERE track_id IS NULL;

NOTIFY pgrst, 'reload schema';
