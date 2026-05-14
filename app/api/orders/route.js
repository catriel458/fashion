import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { createNotification } from '@/lib/notify';
import { sendMail } from '@/lib/mailer';
import { orderConfirmed } from '@/lib/email-templates';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const orders = await sql`
      SELECT o.id, o.status, o.total, o.created_at, s.name AS store_name,
        COUNT(oi.id)::int AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.user_id = ${session.user.id}
      GROUP BY o.id, s.name
      ORDER BY o.created_at DESC
    `;
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { session_id, coupon_id } = await req.json();
    if (!session_id) return NextResponse.json({ error: 'session_id requerido' }, { status: 400 });

    const cartItems = await sql`
      SELECT ci.product_id, ci.quantity, p.name, p.price, p.image_url, p.store_id
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.session_id = ${session_id}
    `;
    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    let total = cartItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
    const storeId = cartItems[0].store_id || null;

    // Aplicar descuento de cupón si se envió
    let appliedCoupon = null;
    if (coupon_id) {
      const coupons = await sql`
        SELECT * FROM coupons
        WHERE id = ${coupon_id} AND user_id = ${session.user.id} AND used = false AND expires_at > NOW()
      `;
      if (coupons.length > 0) {
        appliedCoupon = coupons[0];
        total = total * (1 - appliedCoupon.discount_percentage / 100);
      }
    }

    const [order] = await sql`
      INSERT INTO orders (user_id, session_id, status, total, store_id)
      VALUES (${session.user.id}, ${session_id}, 'confirmed', ${total}, ${storeId})
      RETURNING *
    `;

    for (const item of cartItems) {
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (${order.id}, ${item.product_id}, ${item.quantity}, ${item.price})
      `;
    }

    await sql`DELETE FROM cart_items WHERE session_id = ${session_id}`;

    // Marcar cupón como usado
    if (appliedCoupon) {
      await sql`UPDATE coupons SET used = true WHERE id = ${appliedCoupon.id}`;
    }

    // Obtener datos de tienda y usuario para notificaciones
    const [user]  = await sql`SELECT email, username FROM users WHERE id = ${session.user.id}`;
    const [store] = storeId ? await sql`SELECT name, id FROM stores WHERE id = ${storeId}` : [null];
    const storeName = store?.name || 'CnB';

    // Notificación interna al comprador
    await createNotification({
      userId:  session.user.id,
      storeId: storeId,
      type:    'order_confirmed',
      title:   `Tu pedido #${order.id} fue confirmado`,
      message: `${cartItems.length} producto(s) · Total $${parseFloat(total).toFixed(2)} en ${storeName}`,
      link:    `/profile/orders/${order.id}`,
    });

    // Notificación al admin de la tienda
    if (storeId) {
      const [admin] = await sql`SELECT id FROM users WHERE store_id = ${storeId} AND role = 'admin' LIMIT 1`;
      if (admin) {
        await createNotification({
          userId:  admin.id,
          storeId: storeId,
          type:    'order_confirmed',
          title:   `Nueva venta #${order.id}`,
          message: `${user.username} compró ${cartItems.length} producto(s) · $${parseFloat(total).toFixed(2)}`,
          link:    `/admin/dashboard`,
        });
      }
    }

    // Email de confirmación al comprador
    try {
      const { subject, html } = orderConfirmed({
        username:  user.username,
        orderId:   order.id,
        storeName,
        items:     cartItems,
        total,
      });
      await sendMail({ to: user.email, subject, html });
    } catch {
      // No bloquear si falla el mail
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
