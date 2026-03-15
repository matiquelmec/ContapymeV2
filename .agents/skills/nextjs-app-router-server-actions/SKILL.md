---
name: nextjs-app-router-server-actions
description: Next.js 15+ best practices defining the boundary between Server Components, Server Actions, and Client Components when interacting with BaaS (Supabase) and microservices. Trigger when building forms, data tables, or page layouts in the /app directory.
license: MIT
metadata:
  version: "1.0.0"
---

# Next.js App Router & Server Actions Guildelines

This skill defines the technical standards for writing the Next.js Frontend Dashboard in the Contapyme V2 project.

## Core Rules

### 1. Server Components Default
- Every page (`page.tsx`) and layout (`layout.tsx`) MUST be a Server Component (no `"use client"` directive).
- Only add `"use client"` at the leaves of the component tree (e.g., specific interactive buttons, forms, or charts like Recharts).

### 2. Data Fetching via Supabase SSL
- Fetch data directly in Server Components using `@supabase/ssr` `createServerClient`.
- Do not use `fetch()` or `useEffect` + `useState` to load initial dashboard data. 
- Leverage Next.js cache and parallel routes (Suspense boundaries) if querying the Python Engine directly.

### 3. Mutations with Server Actions
- DO NOT create `src/app/api/` route handlers simply to write to a database.
- Use **Server Actions** (`"use server"`) to handle form submissions (e.g., creating a fixed asset, updating employees).
- Server Actions must sit in `src/actions/` or in the same file if concise.
- Inside Server Actions, validate all inputs using **Zod** before executing any request to Supabase or the Python Engine.

### 4. Multi-Tenant Safety (B2B Context)
- Never rely solely on the frontend to pass `organization_id`.
- The Server Action must ALWAYS look up the user's allowed organizations via Supabase Auth (`getUser()`) and implicitly attach the correct `organization_id` to queries to enforce the RLS logic.

### 5. Seamless Component Styling
- Use the `shadcn/ui` component approach.
- Combine `clsx` and `tailwind-merge` (`cn` utility) for conditional dynamic Tailwind classes without specificity clashes.
