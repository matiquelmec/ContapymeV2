---
name: ui-ux-pro-max
description: Protocolo de refinamiento visual de élite para Contapymepuq (OKLCH, Base 8, micro-interacciones, touch targets ergonómicos y comprobación sensorial móvil en 390px).
---

# UI/UX Pro Max — Protocolo de Artesanía Visual Austral 2026

Este skill define las reglas obligatorias de excelencia visual y ergonomía para todas las interfaces de **Contapymepuq**.

---

## 🎨 1. Sistema de Color Perceptual (OKLCH)
- **Primary (Azul Institucional Austral):** `oklch(0.30 0.10 245)` / En modo oscuro: `oklch(0.65 0.15 250)`.
- **Emerald Accent (Conversiones y WhatsApp Oficial):** `oklch(0.60 0.18 150)` / Hover: `oklch(0.65 0.20 150)`.
- **Rose Accent (Alertas y badges urgentes):** `oklch(0.55 0.22 25)`.
- **Backgrounds:** Neutro austral claro `oklch(0.99 0.005 245)` / Dark executive `oklch(0.145 0 0)`.
- **Contraste Mínimo WCAG 2.2 AA:** Todo texto legible debe mantener un ratio $\ge 4.5:1$ respecto a su fondo.

---

## 📐 2. Retícula Base 8 y Ergonomía Táctil
- **Incrementos de Espaciado:** 8px, 16px, 24px, 32px, 48px, 64px.
- **Touch Targets Móviles:** Mínimo **48px x 48px** en pantallas táctiles (`h-12 w-12` o paddings adecuados).
- **Touch Targets Desktop:** Mínimo **44px x 44px**.
- **Mobile-First Thumb-Zone:** Controles críticos de navegación y conversión accesibles en el tercio inferior de la pantalla sin requerir estiramiento de la mano.

---

## ✨ 3. Micro-interacciones y Estados Visuales
- **Aceleración GPU:** Animar únicamente `transform` (scale, translate3d) y `opacity`. Prohibido animar `top`, `left`, `width` o `height`.
- **Accesibilidad:** Respetar de forma estricta `prefers-reduced-motion`.
- **Shimmer Skeletons:** Todo estado de carga asíncrono debe renderizar un esqueleto visual representativo para evitar Layout Shifts (CLS = 0).
- **Principio Cero Ficción:** Todo botón visible debe tener una acción real o abrir un flujo operativo concreto.

---

## 📱 4. Protocolo de Comprobación Sensorial en Navegador
Antes de considerar aprobada cualquier UI:
1. Inspeccionar en Viewport Móvil: **390px x 844px** (ancho estándar de smartphones modernos).
2. Certificar que `document.documentElement.scrollWidth === window.innerWidth` (Cero overflow horizontal).
3. Inspeccionar en Viewport Desktop: **1440px / 2560px** verificando jerarquía y nitidez tipográfica.
