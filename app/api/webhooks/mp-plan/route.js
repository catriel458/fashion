import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { PLANS } from '@/lib/fitting-plans';
import { getSuperadminMpCredentials } from '@/lib/superadmin-mp-credentials';
import { createNotification } from '@/lib/notify';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { type, data } = body;

    if (type !== 'payment' || !data?.id) return NextResponse.json({ ok: true });

    const { accessToken } = await getSuperadminMpCredentials().catch(() => ({ accessToken: null }));
    if (!accessToken) return NextResponse.json({ ok: true });

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!mpRes.ok) return NextResponse.json({ ok: true });

    const payment = await mpRes.json();

    if (payment.status === 'approved') {
      let planPayment = null;

      if (payment.preference_id) {
        const [found] = await sql`
          SELECT * FROM plan_payments WHERE mp_preference_id = ${payment.preference_id} LIMIT 1
        `.catch(() => []);
        planPayment = found;
      }

      if (!planPayment && payment.external_reference?.startsWith('plan-')) {
        const [found] = await sql`
          SELECT * FROM plan_payments WHERE mp_preference_id IS NOT NULL
          AND store_id = ${parseInt(payment.external_reference.split('-')[1])}
          AND plan = ${payment.external_reference.split('-')[2]}
          AND payment_status = 'pending'
          ORDER BY created_at DESC LIMIT 1
        `.catch(() => []);
        planPayment = found;
      }

      if (planPayment) {
        await sql`
          UPDATE plan_payments SET
            payment_status = 'paid',
            paid_at = NOW(),
            mp_payment_id = ${String(payment.id)}
          WHERE id = ${planPayment.id}
        `;

        const plan = PLANS[planPayment.plan];
        if (plan) {
          await sql`
            UPDATE stores SET
              fitting_plan = ${planPayment.plan},
              fitting_monthly_limit = ${plan.monthly_limit},
              fitting_daily_limit_per_user = ${plan.daily_limit},
              plan_status = 'active'
            WHERE id = ${planPayment.store_id}
          `;
        }

        const [store] = await sql`SELECT name FROM stores WHERE id = ${planPayment.store_id}`;
        const [admin] = await sql`SELECT id FROM users WHERE store_id = ${planPayment.store_id} AND role = 'admin' LIMIT 1`;
        const [superadmin] = await sql`SELECT id FROM users WHERE role = 'superadmin' LIMIT 1`;

        if (admin) {
          await createNotification({
            userId: admin.id,
            storeId: planPayment.store_id,
            type: 'plan_activated',
            title: 'Pago recibido',
            message: `Pago recibido. Tu plan ${planPayment.plan.toUpperCase()} fue activado automaticamente.`,
            link: '/admin/fitting-plans',
          });
        }

        if (superadmin) {
          await createNotification({
            userId: superadmin.id,
            type: 'plan_payment',
            title: 'Pago MP recibido',
            message: `Pago MP recibido: ${store?.name || 'tienda'} - Plan ${planPayment.plan} - USD ${planPayment.amount_usd}`,
            link: '/superadmin/fitting-monitor',
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
