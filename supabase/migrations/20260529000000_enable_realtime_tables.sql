-- Enable Supabase Realtime for key transactional tables
-- This ensures that client-side subscriptions to postgres_changes work correctly.

-- First, ensure the publication exists (it should on Supabase-hosted projects)
-- Then add the tables needed for real-time synchronization across modules.

-- Drop and re-add to handle idempotency
BEGIN;

-- Add tables to the supabase_realtime publication
-- treasury_payments: for real-time treasury dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.treasury_payments;

-- sales_records: for cross-module sync (billing -> treasury, billing -> RCV)
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_records;

-- purchase_records: for cross-module sync (RCV -> treasury)
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_records;

-- payment_methods: for treasury config changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_methods;

-- dte_issued: for billing real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.dte_issued;

-- journal_entries: for accounting real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;

COMMIT;
