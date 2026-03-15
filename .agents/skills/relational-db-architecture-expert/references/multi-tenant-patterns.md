# Multi-Tenant Isolation Patterns (Chilean B2B)

In Contapyme V2, we manage multiple organizations (Accounting firms and their clients).

## The "Organization Anchor" Pattern

All data tables must include an `organization_id` to ensure absolute isolation via RLS.

### 1. Centralized IDs
Every table related to a specific client (Employees, F29, Journal Entries) must reference `organizations(id)`.

```sql
ALTER TABLE employees ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
```

### 2. Cascading Deletion
Use `ON DELETE CASCADE` carefully but consistently for child entities to prevent data rot.

### 3. Cross-Tenant Prevention
Ensure that even if a developer forgets a `WHERE` clause in the API, the database (Supabase RLS) will automatically filter by the user's current session role and organization membership.

## Context Switching
The schema must support a "Shared Member" role (Consultants/Auditors) who can access multiple organizations, requiring a join table:

```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  role ENUM('owner', 'accountant', 'viewer'),
  UNIQUE(organization_id, user_id)
);
```
