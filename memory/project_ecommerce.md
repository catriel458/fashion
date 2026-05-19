---
name: project-cnb-ecommerce
description: CnB Choose and Buy — ecommerce multi-tienda Next.js 14 con WhatsApp checkout, panel admin, panel superadmin
metadata:
  type: project
---

Proyecto CnB (Choose and Buy) - ecommerce multi-tienda en Next.js 14.

**Stack:** Next.js 14 App Router, NeonDB (Postgres serverless), @vercel/blob, NextAuth JWT, nodemailer Gmail

**Roles**: superadmin, admin, user

**Bug crítico resuelto (2026-05-19):**
- Admin "sin tienda asignada": JWT token puede estar stale. Fix: `lib/admin-store.js` → `getAdminStoreId()` lee de DB si session.user.store_id es null
- Notificaciones apuntaban a `/profile/orders/${id}` (ruta inexistente → 404). Corregido a `/profile/orders`
- Status inicial de orders era 'confirmed', ahora es 'pending'
- Nuevos estados: pending, confirmed, ready, delivered, cancelled

**Migración a correr:** GET /api/seed/orders-whatsapp
- Agrega a stores: whatsapp_number, whatsapp_message_template, address, pickup_info
- Agrega a orders: status_updated_at, admin_notes, pickup_date
- Crea tabla store_hours (store_id, day_of_week 0-6, is_open, open_time, close_time)

**Features implementadas (2026-05-19):**
- Checkout WhatsApp: POST /api/orders retorna store{whatsapp_number, template, address, pickup_info, items}; CartSidebar abre wa.me con mensaje templated
- StoreStatusBadge en hero de tienda: muestra abierto/cerrado según store_hours (UTC-3 Argentina)
- Panel admin/orders: tabla filtrable, detalle expandible, cambio de estado, notas admin
- admin/settings: WhatsApp number, template con preview, dirección, horarios por día
- orderStatusUpdate() en lib/email-templates.js
- Dashboard: métricas pedidos hoy, pendientes, listos, ingresos del mes

**APIs nuevas:**
- GET/PUT /api/admin/settings — config WhatsApp+horarios de la tienda del admin
- GET /api/admin/orders — lista pedidos con filtros ?status=&search=
- GET/PUT /api/admin/orders/[id] — detalle y cambio de estado + notif + mail
- GET /api/stores/[slug]/status — {is_open, closes_at, opens_next_day, opens_next_time}

**Auth JWT**: incluye store_id y store_slug en el token/session. store_id puede quedar stale → usar getAdminStoreId()

**How to apply:** Siempre correr GET /api/seed/orders-whatsapp antes de usar features de WhatsApp/horarios.
