import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminStoreId } from '@/lib/admin-store';
import { createNotification } from '@/lib/notify';
import { sendMail } from '@/lib/mailer';
import { orderStatusUpdate } from '@/lib/email-templates';
import sql from '@/lib/db';
import { addPoints } from '@/lib/points';

export const dynamic = 'force-dynamic';

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) return null;
  return session;
}

export async function GET(req, { params }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const storeId = await getAdminStoreId(session);
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    const { id } = params;
    const [order] = await sql`
      SELECT o.*, u.username, u.email, u.first_name, u.last_name,
             u.whatsapp_number AS buyer_whatsapp
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE o.id = ${id} AND o.store_id = ${storeId}
    `;
    if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });

    const items = await sql`
      SELECT oi.quantity, oi.price_at_purchase, oi.size, oi.color,
        p.name, p.image_url, p.slug
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ${id}
    `;

    return NextResponse.json({ ...order, items });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const storeId = await getAdminStoreId(session);
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    const { id } = params;
    const body = await req.json();
    const { status, admin_notes, send_email } = body;

    const [existing] = await sql`SELECT * FROM orders WHERE id = ${id} AND store_id = ${storeId}`;
    if (!existing) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });

    const statusChanged = status && status !== existing.status;
    const newStatus = status ?? existing.status;
    const newNotes  = admin_notes !== undefined ? admin_notes : existing.admin_notes;

    const [updated] = statusChanged
      ? await sql`
          UPDATE orders
          SET status = ${newStatus}, admin_notes = ${newNotes}, status_updated_at = NOW()
          WHERE id = ${id} AND store_id = ${storeId}
          RETURNING *
        `
      : await sql`
          UPDATE orders
          SET status = ${newStatus}, admin_notes = ${newNotes}
          WHERE id = ${id} AND store_id = ${storeId}
          RETURNING *
        `;

    if (statusChanged && newStatus === 'confirmed') {
      await addPoints(existing.user_id, storeId, 'purchase').catch(() => {});
    }

    // Notificaciones y email cuando cambia el estado O se pide explícitamente
    if (statusChanged || send_email) {
      const [store] = await sql`SELECT name FROM stores WHERE id = ${storeId}`;
      const storeName = store?.name || 'La tienda';

      const statusMessages = {
        pago_recibido:         `¡Pago confirmado! Tu pedido #${id} está siendo procesado en ${storeName} 🎉`,
        preparando_pedido:     `Tu pedido #${id} está siendo preparado en ${storeName} 📦`,
        en_camino:             `Tu pedido #${id} está en camino hacia tu domicilio 🚚`,
        listo_para_retirar:    `Tu pedido #${id} está listo para retirar en ${storeName} 🛍️`,
        entregado:             `Tu pedido #${id} fue entregado. ¡Gracias por tu compra! ✅`,
        cancelado:             `Tu pedido #${id} fue cancelado por ${storeName}`,
        // Legacy fallbacks
        confirmed: `Tu pedido #${id} fue confirmado por ${storeName} 🎉`,
        ready:     `Tu pedido #${id} está listo para retirar en ${storeName} 📦`,
        delivered: `Tu pedido #${id} fue entregado. ¡Gracias por tu compra! ✅`,
      };

      const currentStatus = newStatus;
      if (statusMessages[currentStatus]) {
        if (statusChanged) {
          await createNotification({
            userId:  existing.user_id,
            storeId: storeId,
            type:    `order_${currentStatus}`,
            title:   statusMessages[currentStatus],
            message: `Pedido #${id}`,
            link:    '/profile/orders',
          });
        }

        const [user] = await sql`SELECT email, username FROM users WHERE id = ${existing.user_id}`;
        if (user) {
          try {
            const { subject, html } = orderStatusUpdate({
              username:  user.username,
              orderId:   id,
              status:    currentStatus,
              storeName,
            });
            await sendMail({ to: user.email, subject, html });
          } catch {
            // No bloquear si falla el mail
          }
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
