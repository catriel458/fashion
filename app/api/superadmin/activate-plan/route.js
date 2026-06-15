import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { PLANS } from '@/lib/fitting-plans';
import { createNotification } from '@/lib/notify';

export const dynamic = 'force-dynamic';

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function POST(req) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  try {
    const { payment_id } = await req.json();

    const [payment] = await sql`SELECT * FROM plan_payments WHERE id = ${payment_id}`;
    if (!payment) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });

    const plan = PLANS[payment.plan];
    if (!plan) return NextResponse.json({ error: 'Plan invalido' }, { status: 400 });

    await sql`
      UPDATE plan_payments SET payment_status = 'paid', paid_at = NOW()
      WHERE id = ${payment_id}
    `;

    await sql`
      UPDATE stores SET
        fitting_plan = ${payment.plan},
        fitting_monthly_limit = ${plan.monthly_limit},
        fitting_daily_limit_per_user = ${plan.daily_limit},
        plan_status = 'active'
      WHERE id = ${payment.store_id}
    `;

    const [store] = await sql`SELECT name FROM stores WHERE id = ${payment.store_id}`;
    const [admin] = await sql`SELECT id, email FROM users WHERE store_id = ${payment.store_id} AND role = 'admin' LIMIT 1`;
    const [superadmin] = await sql`SELECT id FROM users WHERE role = 'superadmin' LIMIT 1`;

    if (admin) {
      await createNotification({
        userId: admin.id,
        storeId: payment.store_id,
        type: 'plan_activated',
        title: 'Plan activado',
        message: `Tu plan ${payment.plan.toUpperCase()} fue activado. Ya podes usar el probador virtual.`,
        link: '/admin/fitting-plans',
      });
    }

    if (superadmin) {
      await createNotification({
        userId: superadmin.id,
        type: 'plan_activated',
        title: 'Plan activado',
        message: `Plan ${payment.plan} activado manualmente para ${store?.name || 'tienda'}.`,
        link: '/superadmin/fitting-monitor',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
