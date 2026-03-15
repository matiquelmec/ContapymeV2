---
name: python-fastapi-architecture
description: Professional architectural guidelines for building robust asychronous APIs with FastAPI, Pydantic, and SQLAlchemy/Supabase. Use this skill when structuring the Python backend (Engine), setting up routers, defining Pydantic schemas, or handling Dependency Injection.
license: MIT
metadata:
  version: "1.0.0"
---

# Python FastAPI Architecture Guidelines

This skill defines the technical standards for writing the Python Engine in the Contapyme V2 project using FastAPI.

## Core Rules

### 1. Project Structure
Always organize FastAPI applications by domain (Feature-based structure):
```text
engine/
├── api/
│   ├── dependencies.py    # DI for Supabase clients, Auth
│   ├── routers/
│   │   ├── f29.py
│   │   └── payroll.py
├── core/
│   ├── config.py          # Pydantic BaseSettings
│   └── exceptions.py      # Custom global exception handlers
├── schemas/               # Pydantic V2 models for Request/Response
├── services/              # Business logic (where math happens)
└── main.py                # App factory and router inclusion
```

### 2. Pydantic V2 Data Validation
- Always use **Pydantic V2**.
- Never trust raw data. Create explicit `BaseModel` schemas for Every Request and Response.
- Use `Field` for explicit constraints (e.g., `Field(..., gt=0)`, strict string lengths).

### 3. Dependency Injection (DI)
- Never instantiate database clients directly inside route handlers.
- Use `Depends()` to inject the Supabase client or authentication context.
- Keep route handlers extremely thin. They should ONLY receive the request, pass it to a `Service`, and return the response.

### 4. Asynchronous and Blocking Operations
- FastAPI requires `def` vs `async def` awareness.
- If an operation performs heavy CPU bound tasks (like math for liquidaciones or parsing PDFs), it MUST NOT use `async def` (which blocks the event loop) unless run inside a `ThreadPoolExecutor` or `run_in_threadpool`.
- If an operation calls an external HTTP API (Supabase REST), use `async def`.

### 5. Exception Handling
- Do not let 500 errors leak stack traces to the Next.js frontend.
- Build clean custom `HTTPException` raises inside services.
- Log failures using the standard `logging` or `loguru` modules, including the `org_id`.
