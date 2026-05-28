-- Migration 06: Journal Entry Lines Account Sincronization Trigger

CREATE OR REPLACE FUNCTION verify_journal_line_accounts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.account_id IS NOT NULL THEN
        SELECT codigo, nombre INTO NEW.cuenta_codigo, NEW.cuenta_nombre
        FROM public.chart_of_accounts
        WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verify_journal_line_accounts ON public.journal_entry_lines;
CREATE TRIGGER trg_verify_journal_line_accounts
BEFORE INSERT OR UPDATE OF account_id ON public.journal_entry_lines
FOR EACH ROW
EXECUTE FUNCTION verify_journal_line_accounts();
