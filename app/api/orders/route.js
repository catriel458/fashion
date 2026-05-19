import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { createNotification } from '@/lib/notify';
import { sendMail } from '@/lib/mailer';
import { orderConfirmed } from '@/lib/email-templates';

// Auto-migración de columnas de pickup si no existen
async function ensurePickupColumns() {
  await Promise.all([
    sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_point_id INTEGER`.catch(() => {}),
    sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_point_name VARCHAR(200)`.catch(() => {}),
    sql`
      CREATE TABLE IF NOT EXISTS pickup_points (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        address TEXT,
        description TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `.catch(() => {}),
  ]);
}

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
    await ensurePickupColumns();

    const { session_id, coupon_id, pickup_point_id } = await req.json();
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

    // Validar y guardar punto de retiro
    let pickupPointId = null;
    let pickupPointName = null;
    if (pickup_point_id && storeId) {
      const [pp] = await sql`SELECT id, name FROM pickup_points WHERE id = ${pickup_point_id} AND store_id = ${storeId} AND active = true`.catch(() => []);
      if (pp) { pickupPointId = pp.id; pickupPointName = pp.name; }
    }

    const [order] = await sql`
      INSERT INTO orders (user_id, session_id, status, total, store_id, pickup_point_id, pickup_point_name)
      VALUES (${session.user.id}, ${session_id}, 'pending', ${total}, ${storeId}, ${pickupPointId}, ${pickupPointName})
      RETURNING *
    `.catch(() => sql`
      INSERT INTO orders (user_id, session_id, status, total, store_id)
      VALUES (${session.user.id}, ${session_id}, 'pending', ${total}, ${storeId})
      RETURNING *
    `);

    for (const item of cartItems) {
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (${order.id}, ${item.product_id}, ${item.quantity}, ${item.price})
      `;
    }

    await sql`DELETE FROM cart_items WHERE session_id = ${session_id}`;

    if (appliedCoupon) {
      await sql`UPDATE coupons SET used = true WHERE id = ${appliedCoupon.id}`;
    }

    const [user] = await sql`SELECT email, username, first_name, last_name FROM users WHERE id = ${session.user.id}`;
    const [store] = storeId
      ? await sql`SELECT id, name, whatsapp_number, whatsapp_message_template, address, pickup_info FROM stores WHERE id = ${storeId}`
      : [null];
    const storeName = store?.name || 'CnB';

    await createNotification({
      userId:  session.user.id,
      storeId: storeId,
      type:    'order_pending',
      title:   `Tu pedido #${order.id} fue recibido`,
      message: `${cartItems.length} producto(s) · Total $${parseFloat(total).toFixed(2)} en ${storeName}`,
      link:    '/profile/orders',
    });

    if (storeId) {
      const [admin] = await sql`SELECT id FROM users WHERE store_id = ${storeId} AND role = 'admin' LIMIT 1`;
      if (admin) {
        await createNotification({
          userId:  admin.id,
          storeId: storeId,
          type:    'new_order',
          title:   `Nuevo pedido #${order.id}`,
          message: `${user.username} · ${cartItems.length} producto(s) · $${parseFloat(total).toFixed(2)}`,
          link:    '/admin/orders',
        });
      }
    }

    try {
      const { subject, html } = orderConfirmed({
        username:       user.username,
        orderId:        order.id,
        storeName,
        items:          cartItems,
        total,
        pickupPointName: pickupPointName || null,
      });
      await sendMail({ to: user.email, subject, html });
    } catch {
      // No bloquear si falla el mail
    }

    return NextResponse.json({
      ...order,
      pickup_point_name: pickupPointName,
      items: cartItems,
      store: store ? {
        name:                       store.name,
        whatsapp_number:            store.whatsapp_number || null,
        whatsapp_message_template:  store.whatsapp_message_template || null,
        address:                    store.address || null,
        pickup_info:                store.pickup_info || null,
      } : null,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
