# Temporal & Historical Data Management

In payroll and tax systems, historical accuracy is non-negotiable.

## 1. The Effective Date Pattern
For values that change over time (Minimum Salary, Tax Percentages, Employee Base Pay), use a Start/End date pattern.

```sql
CREATE TABLE employee_salaries (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  base_salary NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means currently active
  CHECK (end_date IS NULL OR end_date >= start_date)
);
```

## 2. Preventing Overlaps
Use EXCLUSION constraints in Postgres to ensure an employee doesn't have two base salaries active for the same date range.

## 3. Snapshotting for Audits
When generating a Pay Slip (Liquidación de Sueldo), **COPY** the values used for calculation (AFP %, Tax Brackets) into the payment record. DO NOT rely on relations to current settings, as those settings might be updated in the future, breaking historical pay slip accuracy.

## 4. Logical Deletion (Soft Delete)
For critical components like Organizations or Employees, use a `deleted_at` timestamp instead of a hard `DELETE` to maintain referential integrity in old reports.
