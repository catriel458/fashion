import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { PLANS } from '@/lib/fitting-plans';

export const dynamic = 'force-dynamic';

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function PATCH(req, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  try {
    const { plan_status, fitting_plan } = await req.json();
    const storeId = params.id;

    if (fitting_plan) {
      const plan = PLANS[fitting_plan];
      if (!plan) return NextResponse.json({ error: 'Plan invalido' }, { status: 400 });

      await sql`
        UPDATE stores SET
          fitting_plan = ${fitting_plan},
          fitting_monthly_limit = ${plan.monthly_limit},
          fitting_daily_limit_per_user = ${plan.daily_limit}
        WHERE id = ${storeId}
      `;
    }

    if (plan_status) {
      await sql`UPDATE stores SET plan_status = ${plan_status} WHERE id = ${storeId}`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
