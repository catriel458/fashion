---
name: project-ecommerce
description: Estado del proyecto ecommerce multi-tienda FashionMall — arquitectura, DB, rutas y roles
metadata:
  type: project
---

Proyecto Next.js 14 App Router, Neon PostgreSQL, NextAuth (JWT), Vercel Blob.

**Migración multi-tenant aplicada** (via `/api/seed/migrate`):
- Tabla `stores` con colores, fuentes, hero, about, logo
- Tabla `store_images` para carruseles
- Columnas `store_id` en products, categories, orders, users
- Columnas `height`, `weight` en users
- Tienda Zara seed insertada
- Superadmin seed: super@admin.com / superadmin123

**Roles**: superadmin, admin, visitor

**Rutas dinámicas tiendas**: `app/store/[storeSlug]/` (layout server async, valida tienda en DB)
- `page.js` — hero + carousel + about + productos + categorías
- `category/[slug]/page.js`
- `product/[slug]/page.js`

**Panel superadmin**: `/superadmin/` (solo role=superadmin)
- `stores/` — CRUD tiendas, toggle activo
- `stores/new/` — crear tienda con preview visual
- `stores/[id]/edit/` — editar + carrusel + crear admin
- `users/` — todos los usuarios, filtros rol/tienda

**Panel admin**: `/admin/` (admin y superadmin)
- Products API filtra por store_id si role=admin
- Categories POST asigna store_id automáticamente del session

**APIs clave**:
- `GET /api/stores` — tiendas activas (public)
- `GET /api/stores/[slug]` — store + images (public)
- `/api/superadmin/stores/*` — CRUD completo (superadmin only)
- `/api/superadmin/users/*` — CRUD completo (superadmin only)
- `/api/products?storeSlug=` — filtra por tienda
- `/api/categories?storeSlug=` — filtra por tienda
- `/api/seed/migrate` — corre migración + hashea password superadmin

**Auth JWT**: incluye store_id y store_slug en el token/session

**Why:** Migración de tienda estática Zara → sistema multi-tenant dinámico
**How to apply:** Cualquier nueva funcionalidad debe respetar el filtro por store_id según el role del usuario
