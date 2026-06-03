import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { put } from '@vercel/blob';
import { sendMail } from '@/lib/mailer';
import { orderConfirmedBuyer, orderNotificationStore } from '@/lib/email-templates';

function formatOrderNumber(id, createdAt) {
  const year = new Date(createdAt).getFullYear();
  return `ORD-${year}-${String(id).padStart(5, '0')}`;
}

function generateInvoiceHtml({ order, items, orderNumber, storeName }) {
  const date = new Date(order.created_at).toLocaleDateString('es-AR');
  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee">${i.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right">$${parseFloat(i.price_at_purchase).toFixed(2)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600">$${(parseFloat(i.price_at_purchase) * i.quantity).toFixed(2)}</td>
    </tr>`).join('');

  const deliveryCost = parseFloat(order.delivery_cost || 0);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Comprobante ${orderNumber}</title>
  <style>
    body{font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:28px;color:#1a1a1a;background:#fff}
    .header{border-bottom:2px solid #0f0f0f;padding-bottom:16px;margin-bottom:20px}
    .store-name{font-size:1.4rem;font-weight:700;letter-spacing:.04em}
    .subtitle{color:#6b6560;font-size:.8rem;margin-top:4px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;background:#f5f3f0;border-radius:6px;padding:16px}
    .info-block .label{font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;color:#6b6560;margin-bottom:3px}
    .info-block .value{font-size:.875rem;font-weight:500}
    table{width:100%;border-collapse:collapse;font-size:.875rem}
    thead tr{background:#f5f3f0}
    th{padding:8px 12px;text-align:left;font-size:.6rem;text-transform:uppercase;letter-spacing:.08em;color:#6b6560;font-weight:400}
    .total-row td{padding:12px;font-weight:700;border-top:2px solid #0f0f0f;font-size:.95rem}
    .badge{display:inline-block;background:#e8f5e9;color:#2e7d32;padding:3px 10px;border-radius:20px;font-size:.7rem;font-weight:600}
  </style>
</head>
<body>
  <div class="header">
    <div class="store-name">${storeName}</div>
    <div class="subtitle">Comprobante de compra · Pago con Mercado Pago</div>
  </div>

  <div class="info-grid">
    <div class="info-block"><div class="label">N° de orden</div><div class="value">${orderNumber}</div></div>
    <div class="info-block"><div class="label">Fecha</div><div class="value">${date}</div></div>
    <div class="info-block"><div class="label">Método de pago</div><div class="value">Mercado Pago</div></div>
    <div class="info-block"><div class="label">Estado</div><div class="value"><span class="badge">Pagado ✓</span></div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th style="text-align:center">Cant.</th>
        <th style="text-align:right">Precio unit.</th>
        <th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      ${deliveryCost > 0 ? `
      <tr>
        <td colspan="3" style="padding:10px 12px;color:#6b6560">Costo de envío</td>
        <td style="padding:10px 12px;text-align:right">$${deliveryCost.toFixed(2)}</td>
      </tr>` : ''}
      <tr class="total-row">
        <td colspan="3">TOTAL</td>
        <td style="text-align:right">$${parseFloat(order.total).toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
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
          UPDATE orders SET status = 'pago_recibido', status_updated_at = NOW()
          WHERE id = ${orderId} AND status IN ('pendiente_pago', 'pending')
        `.catch(() => {});

        // Generate and save factura
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
            const storeName   = order.store_name || 'CnB';

            // Generate invoice HTML and upload to Vercel Blob
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS factura_url TEXT`.catch(() => {});
            const invoiceHtml = generateInvoiceHtml({ order, items, orderNumber, storeName });
            const blobResult  = await put(
              `facturas/order_${orderId}_${Date.now()}.html`,
              invoiceHtml,
              { access: 'public', contentType: 'text/html; charset=utf-8' },
            ).catch(() => null);

            if (blobResult?.url) {
              await sql`
                UPDATE orders SET factura_url = ${blobResult.url} WHERE id = ${orderId}
              `.catch(() => {});
            }

            // Confirmation emails
            const buyerName  = order.first_name
              ? `${order.first_name} ${order.last_name || ''}`.trim()
              : order.username;
            const subtotal   = parseFloat(order.total) - parseFloat(order.delivery_cost || 0);

            const buyerTpl = orderConfirmedBuyer({
              username:        buyerName,
              orderId:         order.id,
              orderNumber,
              storeName,
              storePhone:      order.whatsapp_number,
              storeAddress:    order.store_address,
              items,
              subtotal,
              deliveryCost:    parseFloat(order.delivery_cost || 0),
              total:           parseFloat(order.total),
              deliveryMethod:  order.delivery_method || 'pickup',
              pickupPointName: order.pickup_point_name,
              deliveryAddress: order.delivery_address,
              paymentMethod:   'mp',
            });

            const promises = [sendMail({ to: order.buyer_email, subject: buyerTpl.subject, html: buyerTpl.html })];

            if (order.contact_email) {
              const storeTpl = orderNotificationStore({
                orderId:         order.id,
                orderNumber,
                storeName,
                buyerName,
                buyerEmail:      order.buyer_email,
                items,
                subtotal,
                deliveryCost:    parseFloat(order.delivery_cost || 0),
                total:           parseFloat(order.total),
                deliveryMethod:  order.delivery_method || 'pickup',
                pickupPointName: order.pickup_point_name,
                deliveryAddress: order.delivery_address,
                paymentMethod:   'mp',
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
