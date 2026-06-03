import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { put } from '@vercel/blob';
import { sendMail } from '@/lib/mailer';

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { id } = params;

    const [order] = await sql`
      SELECT * FROM orders WHERE id = ${id} AND user_id = ${session.user.id}
    `;
    if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

    const ext = file.name.split('.').pop();
    const filename = `comprobantes/order_${id}_${Date.now()}.${ext}`;
    const blob = await put(filename, file, { access: 'public' });

    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS comprobante_url TEXT`.catch(() => {});

    const [updated] = await sql`
      UPDATE orders
      SET comprobante_url   = ${blob.url},
          status            = 'comprobante_enviado',
          status_updated_at = NOW()
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING *
    `;

    // Notify store admin by email — soft-fail
    try {
      const [store] = await sql`
        SELECT s.contact_email, s.name AS store_name
        FROM stores s
        WHERE s.id = ${order.store_id}
      `.catch(() => []);

      if (store?.contact_email) {
        const [user] = await sql`
          SELECT first_name, last_name, username, email
          FROM users WHERE id = ${session.user.id}
        `.catch(() => []);

        const buyerName = user?.first_name
          ? `${user.first_name} ${user.last_name || ''}`.trim()
          : user?.username || user?.email || 'Comprador';

        const year        = new Date(order.created_at).getFullYear();
        const orderNumber = `ORD-${year}-${String(order.id).padStart(5, '0')}`;

        await sendMail({
          to:      store.contact_email,
          subject: `Nuevo comprobante de pago — Orden #${order.id}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
              <h2 style="font-size:1.2rem;margin:0 0 16px">Nuevo comprobante de pago</h2>
              <p style="margin:0 0 12px;font-size:.9rem">
                El comprador subió el comprobante de transferencia para la siguiente orden:
              </p>
              <table style="width:100%;border-collapse:collapse;font-size:.875rem;margin-bottom:16px">
                <tr>
                  <td style="padding:8px 0;color:#6b6560;width:140px">N° de orden</td>
                  <td style="padding:8px 0;font-weight:600">${orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#6b6560">Comprador</td>
                  <td style="padding:8px 0">${buyerName}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#6b6560">Total</td>
                  <td style="padding:8px 0;font-weight:600">$${parseFloat(order.total).toFixed(2)}</td>
                </tr>
              </table>
              <a
                href="${blob.url}"
                target="_blank"
                style="display:inline-block;padding:10px 20px;background:#0f0f0f;color:#fff;text-decoration:none;border-radius:3px;font-size:.8rem;letter-spacing:.06em"
              >
                Ver comprobante
              </a>
              <p style="margin:16px 0 0;font-size:.75rem;color:#6b6560">
                Podés confirmar el pago desde el panel de administración.
              </p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error('[comprobante] Error sending notification email:', emailErr);
    }

    return NextResponse.json({ url: blob.url, order: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
