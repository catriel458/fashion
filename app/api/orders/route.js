import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { createNotification } from '@/lib/notify';
import { sendMail } from '@/lib/mailer';
import { orderConfirmedBuyer, orderNotificationStore } from '@/lib/email-templates';

async function ensureColumns() {
  await Promise.all([
    sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_point_id INTEGER`.catch(() => {}),
    sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_point_name VARCHAR(200)`.catch(() => {}),
    sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT`.catch(() => {}),
    sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'pickup'`.catch(() => {}),
    sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT`.catch(() => {}),
    sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,7)`.catch(() => {}),
    sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(10,7)`.catch(() => {}),
    sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(10,2) DEFAULT 0`.catch(() => {}),
    sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS comprobante_url TEXT`.catch(() => {}),
    sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS factura_url TEXT`.catch(() => {}),
    sql`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check`.catch(() => {}),
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

function formatOrderNumber(id, createdAt) {
  const year = new Date(createdAt).getFullYear();
  return `ORD-${year}-${String(id).padStart(5, '0')}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const orders = await sql`
      SELECT o.id, o.status, o.total, o.created_at, o.payment_method, o.delivery_method,
             s.name AS store_name, COUNT(oi.id)::int AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.user_id = ${parseInt(session.user.id, 10)}
      GROUP BY o.id, s.name
      ORDER BY o.created_at DESC
    `;
    return NextResponse.json(orders.map(o => ({
      ...o,
      order_number: formatOrderNumber(o.id, o.created_at),
    })));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const userId = parseInt(session.user.id, 10);
  if (!userId || isNaN(userId)) {
    return NextResponse.json({ error: 'Sesión inválida. Por favor cerrá sesión y volvé a entrar.' }, { status: 401 });
  }

  try {
    await ensureColumns();

    // Verificar que el usuario existe en la DB (sesiones viejas pueden tener IDs que ya no existen)
    const [dbUser] = await sql`SELECT id FROM users WHERE id = ${userId}`;
    if (!dbUser) {
      return NextResponse.json({ error: 'Tu sesión expiró. Por favor cerrá sesión y volvé a entrar.' }, { status: 401 });
    }

    const {
      session_id, coupon_id, pickup_point_id,
      payment_method, delivery_method,
      delivery_address, delivery_lat, delivery_lng, delivery_cost,
      save_address, comprobante_url,
    } = await req.json();

    if (!session_id) return NextResponse.json({ error: 'session_id requerido' }, { status: 400 });

    const cartItems = await sql`
      SELECT ci.product_id, ci.quantity, p.name, p.price, p.image_url, p.store_id
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.session_id = ${session_id}
    `;
    if (cartItems.length === 0) return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });

    let subtotal = cartItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
    const storeId = cartItems[0].store_id || null;
    const extraDeliveryCost = parseFloat(delivery_cost) || 0;

    let appliedCoupon = null;
    if (coupon_id) {
      const coupons = await sql`
        SELECT * FROM coupons WHERE id = ${coupon_id} AND user_id = ${userId} AND used = false AND expires_at > NOW()
      `;
      if (coupons.length > 0) {
        appliedCoupon = coupons[0];
        subtotal = subtotal * (1 - appliedCoupon.discount_percentage / 100);
      }
    }

    const total = subtotal + extraDeliveryCost;

    let pickupPointId = null;
    let pickupPointName = null;
    if (pickup_point_id && storeId) {
      const [pp] = await sql`SELECT id, name FROM pickup_points WHERE id = ${pickup_point_id} AND store_id = ${storeId} AND active = true`.catch(() => []);
      if (pp) { pickupPointId = pp.id; pickupPointName = pp.name; }
    }

    const effectiveDeliveryMethod = delivery_method || 'pickup';
    const initialStatus = payment_method === 'transfer' ? 'comprobante_pendiente' : 'pendiente_pago';

    const [order] = await sql`
      INSERT INTO orders (
        user_id, session_id, status, total, store_id,
        pickup_point_id, pickup_point_name,
        payment_method, delivery_method, delivery_address,
        delivery_lat, delivery_lng, delivery_cost
      )
      VALUES (
        ${userId}, ${session_id}, ${initialStatus}, ${total}, ${storeId},
        ${pickupPointId}, ${pickupPointName},
        ${payment_method || null}, ${effectiveDeliveryMethod}, ${delivery_address || null},
        ${delivery_lat || null}, ${delivery_lng || null}, ${extraDeliveryCost}
      )
      RETURNING *
    `.catch(() => sql`
      INSERT INTO orders (user_id, session_id, status, total, store_id, pickup_point_id, pickup_point_name)
      VALUES (${userId}, ${session_id}, ${initialStatus}, ${total}, ${storeId}, ${pickupPointId}, ${pickupPointName})
      RETURNING *
    `);

    const orderNumber = formatOrderNumber(order.id, order.created_at);

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

    if (save_address && effectiveDeliveryMethod === 'delivery' && delivery_address) {
      await sql`DELETE FROM user_addresses WHERE user_id = ${userId}`.catch(() => {});
      await sql`
        INSERT INTO user_addresses (user_id, full_address, lat, lng, is_default)
        VALUES (${userId}, ${delivery_address}, ${delivery_lat || null}, ${delivery_lng || null}, true)
      `.catch(() => {});
    }

    const [user] = await sql`SELECT email, username, first_name, last_name FROM users WHERE id = ${userId}`;
    const [store] = storeId
      ? await sql`SELECT id, name, whatsapp_number, whatsapp_message_template, address, pickup_info, contact_email FROM stores WHERE id = ${storeId}`
      : [null];
    const storeName = store?.name || 'CnB';
    const buyerName = user.first_name
      ? `${user.first_name} ${user.last_name || ''}`.trim()
      : user.username;

    await createNotification({
      userId:  userId,
      storeId: storeId,
      type:    'order_pending',
      title:   `Tu pedido ${orderNumber} fue recibido`,
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
          title:   `Nuevo pedido ${orderNumber}`,
          message: `${buyerName} · ${cartItems.length} producto(s) · $${parseFloat(total).toFixed(2)}`,
          link:    '/admin/orders',
        });
      }
    }

    // Emails de confirmación (soft-fail)
    try {
      const attachments = comprobante_url ? [{ filename: 'comprobante.pdf', path: comprobante_url }] : [];

      const buyerEmail = orderConfirmedBuyer({
        username: buyerName,
        orderId: order.id,
        orderNumber,
        storeName,
        storePhone: store?.whatsapp_number || null,
        storeAddress: store?.address || null,
        items: cartItems,
        subtotal,
        deliveryCost: extraDeliveryCost,
        total,
        deliveryMethod: effectiveDeliveryMethod,
        pickupPointName,
        deliveryAddress: delivery_address || null,
        paymentMethod: payment_method || 'transfer',
      });

      const promises = [sendMail({ to: user.email, subject: buyerEmail.subject, html: buyerEmail.html, attachments })];

      if (store?.contact_email) {
        const storeEmail = orderNotificationStore({
          orderId: order.id,
          orderNumber,
          storeName,
          buyerName,
          buyerEmail: user.email,
          items: cartItems,
          subtotal,
          deliveryCost: extraDeliveryCost,
          total,
          deliveryMethod: effectiveDeliveryMethod,
          pickupPointName,
          deliveryAddress: delivery_address || null,
          paymentMethod: payment_method || 'transfer',
        });
        promises.push(sendMail({ to: store.contact_email, subject: storeEmail.subject, html: storeEmail.html, attachments }));
      }

      await Promise.all(promises);
    } catch { /* no bloquear si falla el mail */ }

    return NextResponse.json({
      ...order,
      order_number:       orderNumber,
      pickup_point_name:  pickupPointName,
      items:              cartItems,
      store: store ? {
        name:                      store.name,
        whatsapp_number:           store.whatsapp_number           || null,
        whatsapp_message_template: store.whatsapp_message_template || null,
        address:                   store.address                   || null,
        pickup_info:               store.pickup_info               || null,
      } : null,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
