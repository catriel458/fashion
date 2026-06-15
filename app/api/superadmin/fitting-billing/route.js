import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { PLANS } from '@/lib/fitting-plans';
import { sendMail } from '@/lib/mailer';
import { getSuperadminMpCredentials } from '@/lib/superadmin-mp-credentials';

export const dynamic = 'force-dynamic';

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function POST(req) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  try {
    const { store_id, plan, amount_usd, payment_method, notes } = await req.json();

    if (!PLANS[plan]) return NextResponse.json({ error: 'Plan invalido' }, { status: 400 });
    if (!(Number(amount_usd) > 0)) return NextResponse.json({ error: 'Monto invalido' }, { status: 400 });

    const [store] = await sql`
      SELECT s.name, s.billing_email, u.email as admin_email
      FROM stores s
      LEFT JOIN users u ON u.store_id = s.id AND u.role = 'admin'
      WHERE s.id = ${store_id}
      LIMIT 1
    `;
    if (!store) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

    if (payment_method === 'transferencia') {
      const [config] = await sql`SELECT * FROM superadmin_config WHERE id = 1`;
      if (!config?.transfer_enabled) {
        return NextResponse.json({ error: 'TRANSFER_NOT_CONFIGURED', message: 'Configura los datos de transferencia en Configuracion' }, { status: 400 });
      }

      const [payment] = await sql`
        INSERT INTO plan_payments (store_id, plan, amount_usd, payment_method, payment_status, notes)
        VALUES (${store_id}, ${plan}, ${amount_usd}, 'transferencia', 'pending', ${notes || null})
        RETURNING id
      `;

      const to = store.billing_email || store.admin_email;
      if (to) {
        const lines = [
          `Hola! Te enviamos los datos para el pago de tu plan ${plan.toUpperCase()}.`,
          '',
          `Monto: USD ${amount_usd}`,
          `CBU: ${config.transfer_cbu || ''}`,
          `Alias: ${config.transfer_alias || ''}`,
          `Banco: ${config.transfer_bank || ''}`,
          `Titular: ${config.transfer_holder || ''}`,
        ];
        if (notes) lines.push('', notes);
        lines.push('', 'Una vez realizada la transferencia, subí el comprobante desde tu panel en /admin/fitting-plans');

        await sendMail({
          to,
          subject: `Factura plan ${plan.toUpperCase()} - CnB`,
          html: `<pre style="font-family:inherit;white-space:pre-wrap">${lines.join('\n')}</pre>`,
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, payment_id: payment.id });
    }

    if (payment_method === 'mercadopago') {
      let accessToken;
      try {
        ({ accessToken } = await getSuperadminMpCredentials());
      } catch (error) {
        return NextResponse.json({ error: 'MP_NOT_CONFIGURED', message: error.message }, { status: 400 });
      }

      const externalReference = `plan-${store_id}-${plan}-${Date.now()}`;

      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          items: [{
            title: `Plan ${plan} - CnB - ${store.name}`,
            quantity: 1,
            unit_price: Number(amount_usd),
            currency_id: 'USD',
          }],
          external_reference: externalReference,
          notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/mp-plan`,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Error MP: ${response.status}`);
      }

      const preference = await response.json();

      const [payment] = await sql`
        INSERT INTO plan_payments (store_id, plan, amount_usd, payment_method, payment_status, mp_preference_id, notes)
        VALUES (${store_id}, ${plan}, ${amount_usd}, 'mercadopago', 'pending', ${preference.id}, ${notes || null})
        RETURNING id
      `;

      return NextResponse.json({ success: true, payment_url: preference.init_point, payment_id: payment.id });
    }

    return NextResponse.json({ error: 'payment_method invalido' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('store_id');

    const payments = await sql`
      SELECT pp.*, s.name as store_name
      FROM plan_payments pp
      JOIN stores s ON s.id = pp.store_id
      WHERE (${storeId}::int IS NULL OR pp.store_id = ${storeId}::int)
      ORDER BY pp.created_at DESC
    `;

    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
