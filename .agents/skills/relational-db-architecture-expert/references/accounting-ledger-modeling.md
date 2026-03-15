# Accounting Ledger Modeling (IFRS Compliance)

To support the transition from V1 to V2, we need a robust Double-Entry (Partida Doble) model.

## 1. Plan of Accounts (Chart of Accounts)
Must be hierarchical and organization-specific.

```sql
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  code TEXT NOT NULL, -- e.g. "1101", "1101.01"
  name TEXT NOT NULL,
  type ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
  parent_id UUID REFERENCES chart_of_accounts(id),
  is_leaf BOOLEAN DEFAULT true, -- Only leaf nodes can have journal entries
  UNIQUE(organization_id, code)
);
```

## 2. Journal Entries (Libro Diario)
A transaction consists of a header and at least two lines (Debits and Credits) that must sum to zero.

### Header: `journal_entries`
- `id`, `organization_id`, `date`, `description`, `reference_number`, `type` (Sales, Purchases, Honorarios).

### Lines: `journal_entry_lines`
- `id`, `entry_id` (FK to header), `account_id` (FK to Chart of Accounts), `debit` (Numeric), `credit` (Numeric).

## Integrity Constraints
- **Constraint Core:** Sum(Debit) - Sum(Credit) = 0 for every `entry_id`.
- Use Postgres triggers to validate the balance before allowing an `INSERT` or `UPDATE`.

## Performance Optimization (Libro Mayor)
Instead of calculating the Ledger (Libro Mayor) dynamically every time, consider a materialized view or a summary table updated once a day for reports like the Balance de Comprobación.
