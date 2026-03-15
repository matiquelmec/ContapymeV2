---
name: relational-db-architecture-expert
description: Expert-level patterns for designing scalable, multi-tenant relational databases with a focus on financial, accounting (IFRS), and payroll systems. Use this skill when modeling complex business logic, ensuring referential integrity, and implementing bulletproof multi-tenancy.
license: MIT
metadata:
  version: "1.0.0"
  category: Database Design
  specialization: Financial Systems / SaaS Architecture
---

# Relational Database Architecture Expert

This skill provides advanced architectural patterns for SQL databases, specifically tailored for the Chilean accounting and legal context (Contapyme V2). It focuses on structural integrity, scalability, and strict multi-tenant isolation.

## Core Principles

1.  **Strict Multi-Tenancy (B2B):** Every transaction MUST be anchored to an `organization_id`. Use Row Level Security (RLS) as the primary defense.
2.  **Referential Integrity:** Enforce foreign keys strictly. No orphaned records in financial history.
3.  **Auditability:** Every record of state change (salary changes, tax modifications) must be immutable or historical (temporal data).
4.  **IFRS Compliance:** Models must support deep hierarchical plans of accounts and double-entry bookkeeping (debit/credit balance).

## When to Apply

- **New Module Discovery:** When a new section of the Blueprint (e.g., Phase 7: Advance Intelligence) requires a database schema.
- **Refactoring:** When a V1 table structure (Monolith) needs to be split into efficient relational components for V2.
- **Complex Relation Modeling:** Designing many-to-many relationships with metadata (e.g., Employees <-> Organizations avec roles).

## Documented Patterns

1.  **[Multi-Tenant Isolation](references/multi-tenant-patterns.md):** Architectural strategies for B2B SaaS.
2.  **[Accounting Ledger (Double-Entry)](references/accounting-ledger-modeling.md):** Modeling Libro Diario and Libro Mayor.
3.  **[Temporal & Historical Data](references/temporal-data-history.md):** Managing data over time (Payroll cycles, Asset depreciation).

## Relationships with Other Skills

- **Complementary:** Use `supabase-postgres-best-practices` for *how* to index and secure the tables designed here.
- **Foundational:** Provides the schemas that `python-fastapi-architecture` and `nextjs-app-router-server-actions` will ingest.
