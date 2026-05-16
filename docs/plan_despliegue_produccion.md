# 🚀 Plan de Despliegue a Producción — Contapymepuq

> **Versión:** 1.0 | **Fecha:** 2026-05-16 | **Estado:** PENDIENTE
> **Presupuesto Objetivo:** $7 — $20 USD/mes

---

## 1. RESUMEN EJECUTIVO

Este documento define la estrategia de despliegue profesional para Contapymepuq,
optimizada para un presupuesto mensual de entre **$7 y $20 USD**, sin sacrificar
rendimiento, seguridad ni escalabilidad futura.

### Principios de Diseño
- **Costo Mínimo, Impacto Máximo**: Aprovechar planes gratuitos donde sea posible.
- **Zero Cold Starts**: El Engine contable NUNCA debe dormirse.
- **Seguridad desde Día 1**: Variables de entorno aisladas, RLS activo, HTTPS forzado.
- **Escalabilidad Progresiva**: Poder subir de tier sin reescribir código.

---

## 2. ARQUITECTURA DE PRODUCCIÓN

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    INTERNET (Usuario Final)                         │
│                         contapymepuq.cl                             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
┌──────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│  VERCEL (Free)   │ │ RENDER ($7/mes) │ │ SUPABASE (Free)  │
│  ──────────────  │ │ ─────────────── │ │ ──────────────── │
│  Next.js 16      │ │ Python Engine   │ │ PostgreSQL 15    │
│  Frontend SSR    │ │ FastAPI + DTE   │ │ Auth + RLS       │
│  Edge Network    │ │ Always On       │ │ Storage          │
│  CDN Global      │ │ Docker          │ │ Realtime         │
└──────────────────┘ └─────────────────┘ └──────────────────┘
                               │
                               ▼
                     ┌──────────────────┐
                     │ UPSTASH (Free)   │
                     │ ──────────────── │
                     │ Redis Serverless │
                     │ Caché + Colas    │
                     └──────────────────┘
```

---

## 3. DETALLE DE SERVICIOS Y COSTOS

### 3.1 Frontend — Vercel (Plan Hobby)
| Concepto | Detalle |
| :--- | :--- |
| **Servicio** | Hosting + CDN + SSR para Next.js 16 |
| **Plan** | Hobby (Gratuito) |
| **Costo** | **$0 USD/mes** |
| **Límites** | 100GB bandwidth, 1 deploy/commit, dominio personalizado |
| **Ventajas** | Red Edge global, HTTPS automático, Preview Deploys |

**Configuración necesaria:**
- Conectar repositorio GitHub → directorio `app/`
- Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_ENGINE_URL`
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`

### 3.2 Engine — Render (Plan Starter)
| Concepto | Detalle |
| :--- | :--- |
| **Servicio** | Web Service Docker (FastAPI) |
| **Plan** | Starter |
| **Costo** | **$7 USD/mes** |
| **Recursos** | 512 MB RAM, 0.5 vCPU |
| **Uptime** | Always On (sin cold starts) |
| **Ventajas** | Deploy automático, healthcheck, logs en tiempo real |

**Configuración necesaria:**
- Archivo `render.yaml` en la raíz del proyecto (YA CREADO).
- Variables de entorno en Dashboard de Render:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `SUPABASE_ANON_KEY`
- Health Check Path: `/health`

### 3.3 Base de Datos — Supabase (Plan Free)
| Concepto | Detalle |
| :--- | :--- |
| **Servicio** | PostgreSQL 15 + Auth + Storage + Realtime |
| **Plan** | Free |
| **Costo** | **$0 USD/mes** |
| **Límites** | 500 MB DB, 1 GB Storage, 50K MAU, 2 proyectos |
| **Seguridad** | RLS activo en TODAS las tablas |

**Nota:** Cuando superes los 500 MB o necesites backups automáticos,
migrar al Plan Pro ($25/mes). Esto ocurrirá aproximadamente con 200+ organizaciones activas.

### 3.4 Caché — Upstash Redis (Plan Free)
| Concepto | Detalle |
| :--- | :--- |
| **Servicio** | Redis Serverless (HTTP API) |
| **Plan** | Free |
| **Costo** | **$0 USD/mes** |
| **Límites** | 10,000 comandos/día, 256 MB storage |
| **Uso** | Caché de indicadores, sesiones, rate limiting |

---

## 4. RESUMEN DE COSTOS

### Escenario A: Lanzamiento ($7/mes)
| Servicio | Proveedor | Costo |
| :--- | :--- | ---: |
| Frontend | Vercel Hobby | $0 |
| Engine | Render Starter | $7 |
| Base de Datos | Supabase Free | $0 |
| Caché | Upstash Free | $0 |
| **TOTAL** | | **$7 USD/mes** |

### Escenario B: Profesional ($15/mes)
| Servicio | Proveedor | Costo |
| :--- | :--- | ---: |
| Frontend | Vercel Hobby | $0 |
| Engine | Render Starter | $7 |
| Base de Datos | Supabase Free | $0 |
| Caché | Upstash Free | $0 |
| Dominio .cl | NIC Chile | ~$8 (anualizado) |
| **TOTAL** | | **~$15 USD/mes** |

### Escenario C: Crecimiento ($20/mes)
| Servicio | Proveedor | Costo |
| :--- | :--- | ---: |
| Frontend | Vercel Hobby | $0 |
| Engine | Render Starter Plus | $15 |
| Base de Datos | Supabase Free | $0 |
| Caché | Upstash Pay-as-you-go | ~$3 |
| Dominio .cl | NIC Chile | ~$1 |
| **TOTAL** | | **~$19 USD/mes** |

---

## 5. CHECKLIST DE DESPLIEGUE

### Pre-Despliegue
- [ ] Verificar que `engine/Dockerfile` construye correctamente (`docker build -t contapymepuq-engine ./engine`)
- [ ] Confirmar que el endpoint `/health` del Engine responde 200 OK
- [ ] Asegurar que `.env` y `.env.local` están en `.gitignore` (CONFIRMADO ✅)
- [ ] Generar claves de producción en Supabase (si se usa un proyecto nuevo)
- [ ] Validar que RLS está habilitado en TODAS las tablas transaccionales

### Despliegue del Engine (Render)
- [ ] Crear cuenta en [render.com](https://render.com)
- [ ] Conectar repositorio GitHub
- [ ] Render detectará `render.yaml` automáticamente
- [ ] Configurar variables de entorno en el Dashboard de Render
- [ ] Verificar deploy exitoso y healthcheck verde
- [ ] Anotar la URL del Engine (ej: `https://contapymepuq-engine.onrender.com`)

### Despliegue del Frontend (Vercel)
- [ ] Crear cuenta en [vercel.com](https://vercel.com)
- [ ] Importar repositorio GitHub → seleccionar directorio `app/`
- [ ] Configurar variables de entorno:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_ENGINE_URL` → URL de Render
- [ ] Verificar build exitoso
- [ ] Configurar dominio personalizado (contapymepuq.cl)

### Post-Despliegue
- [ ] Test E2E: Login → Dashboard → Crear Factura → Ver Reporte
- [ ] Verificar MarketTicker cargando indicadores en vivo
- [ ] Confirmar que los PDFs se generan correctamente
- [ ] Monitorear logs de Render (primeras 24 horas)
- [ ] Configurar alertas de uptime (UptimeRobot — gratuito)

---

## 6. ESCALAMIENTO FUTURO

| Trigger | Acción | Costo Adicional |
| :--- | :--- | ---: |
| >500 MB en DB | Supabase Pro | +$25/mes |
| >100 req/seg al Engine | Render Standard (1GB RAM) | +$18/mes |
| >10K comandos Redis/día | Upstash Pay-as-you-go | +$3/mes |
| >100GB bandwidth Frontend | Vercel Pro | +$20/mes |
| Necesidad de Workers | Render Background Worker | +$7/mes |

---

> *"La infraestructura más cara es la que no necesitas. La más barata es la que escala contigo."*

---
© 2026 Contapymepuq — Propiedad Intelectual Reservada. Magallanes, Chile.
