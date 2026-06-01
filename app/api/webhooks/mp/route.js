import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { orderConfirmedBuyer, orderNotificationStore } from '@/lib/email-templates';

function formatOrderNumber(id, createdAt) {
  const year = new Date(createdAt).getFullYear();
  return `ORD-${year}-${String(id).padStart(5, '0')}`;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { type, data } = body;

    if (type !== 'payment' || !data?.id) return NextResponse.json({ ok: true });

    const paymentId = data.id;
    const accessToken = process.env.MP_TEST_MODE === 'true'
      ? process.env.MP_ACCESS_TOKEN_TEST
      : null;

    if (!accessToken) return NextResponse.json({ ok: true });

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!mpRes.ok) return NextResponse.json({ ok: true });

    const payment = await mpRes.json();

    if (payment.status === 'approved' && payment.external_reference) {
      const parts = payment.external_reference.split('-');
      const orderId = parseInt(parts[1]);

      if (orderId && !isNaN(orderId)) {
        await sql`
          UPDATE orders SET status = 'confirmed', status_updated_at = NOW()
          WHERE id = ${orderId} AND status = 'pending'
        `.catch(() => {});

        // Email de confirmación (soft-fail)
        try {
          const [order] = await sql`
            SELECT o.*, s.name as store_name, s.whatsapp_number, s.address as store_address,
                   s.contact_email, u.email as buyer_email, u.username, u.first_name, u.last_name
            FROM orders o
            JOIN stores s ON o.store_id = s.id
            JOIN users u ON o.user_id = u.id
            WHERE o.id = ${orderId}
          `.catch(() => []);

          const items = await sql`
            SELECT oi.quantity, oi.price_at_purchase, p.name
            FROM order_items oi JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ${orderId}
          `.catch(() => []);

          if (order) {
            const orderNumber = formatOrderNumber(order.id, order.created_at);
            const buyerName = order.first_name
              ? `${order.first_name} ${order.last_name || ''}`.trim()
              : order.username;
            const subtotal = parseFloat(order.total) - parseFloat(order.delivery_cost || 0);

            const buyerTpl = orderConfirmedBuyer({
              username: buyerName,
              orderId: order.id,
              orderNumber,
              storeName: order.store_name,
              storePhone: order.whatsapp_number,
              storeAddress: order.store_address,
              items,
              subtotal,
              deliveryCost: parseFloat(order.delivery_cost || 0),
              total: parseFloat(order.total),
              deliveryMethod: order.delivery_method || 'pickup',
              pickupPointName: order.pickup_point_name,
              deliveryAddress: order.delivery_address,
              paymentMethod: 'mp',
            });

            const promises = [sendMail({ to: order.buyer_email, subject: buyerTpl.subject, html: buyerTpl.html })];

            if (order.contact_email) {
              const storeTpl = orderNotificationStore({
                orderId: order.id,
                orderNumber,
                storeName: order.store_name,
                buyerName,
                buyerEmail: order.buyer_email,
                items,
                subtotal,
                deliveryCost: parseFloat(order.delivery_cost || 0),
                total: parseFloat(order.total),
                deliveryMethod: order.delivery_method || 'pickup',
                pickupPointName: order.pickup_point_name,
                deliveryAddress: order.delivery_address,
                paymentMethod: 'mp',
              });
              promises.push(sendMail({ to: order.contact_email, subject: storeTpl.subject, html: storeTpl.html }));
            }

            await Promise.all(promises);
          }
        } catch { /* no bloquear */ }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
