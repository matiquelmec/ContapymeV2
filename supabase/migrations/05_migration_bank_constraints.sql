-- Migration 05: Bank Reconciliations Integrity Constraints

ALTER TABLE public.bank_reconciliations
ADD CONSTRAINT bank_reconciliations_notes_check 
CHECK (bank_line_id IS NOT NULL OR (notes IS NOT NULL AND length(trim(notes)) > 0));
