import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { PLANS } from '@/lib/fitting-plans';

export const dynamic = 'force-dynamic';

const PLAN_PRICES = {
  free: PLANS.free.price_usd,
  starter: PLANS.starter.price_usd,
  growth: PLANS.growth.price_usd,
  pro: PLANS.pro.price_usd,
  scale: PLANS.scale.price_usd,
};

const COST_PER_USE = 0.039;

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function GET() {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  try {
    const rows = await sql`
      SELECT
        s.id, s.name, s.fitting_plan,
        s.fitting_monthly_limit, s.fitting_used_this_month,
        s.fitting_month_reset_at, s.plan_status, s.billing_email,
        u.email as admin_email, u.id as admin_id
      FROM stores s
      LEFT JOIN users u ON u.store_id = s.id AND u.role = 'admin'
      ORDER BY s.fitting_used_this_month DESC
    `;

    let total_used = 0;
    let total_ingresos_usd = 0;
    let tiendas_free = 0;
    let oportunidades_upgrade = 0;

    const tiendas = rows.map(row => {
      const porcentaje = Number((row.fitting_used_this_month / Math.max(row.fitting_monthly_limit, 1) * 100).toFixed(1));
      const costo_usd = Number((row.fitting_used_this_month * COST_PER_USE).toFixed(2));
      const precio_plan_usd = PLAN_PRICES[row.fitting_plan] ?? 0;
      const margen_usd = Number((precio_plan_usd - costo_usd).toFixed(2));
      const is_upgrade_opportunity = row.fitting_plan === 'free' && row.fitting_used_this_month >= 20;

      total_used += row.fitting_used_this_month;
      total_ingresos_usd += precio_plan_usd;
      if (row.fitting_plan === 'free') tiendas_free++;
      if (is_upgrade_opportunity) oportunidades_upgrade++;

      return {
        ...row,
        porcentaje,
        costo_usd,
        precio_plan_usd,
        margen_usd,
        is_upgrade_opportunity,
      };
    });

    const total_costo_usd = Number((total_used * COST_PER_USE).toFixed(2));
    const total_margen_usd = Number((total_ingresos_usd - total_costo_usd).toFixed(2));

    return NextResponse.json({
      tiendas,
      totales: {
        total_used,
        total_costo_usd,
        total_ingresos_usd,
        total_margen_usd,
        tiendas_free,
        oportunidades_upgrade,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
