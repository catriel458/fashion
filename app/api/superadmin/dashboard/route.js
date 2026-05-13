import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function GET() {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  try {
    const [
      perStore,
      recentOrders,
      ordersByDay,
      [globalUsers],
    ] = await Promise.all([
      sql`
        SELECT
          s.id, s.name, s.slug, s.primary_color, s.active,
          COUNT(DISTINCT p.id) FILTER (WHERE p.active = true)::int   AS active_products,
          COUNT(DISTINCT o.id)::int                                    AS total_orders,
          COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'confirmed')::int AS confirmed_orders,
          COALESCE(SUM(o.total) FILTER (WHERE o.status = 'confirmed'), 0)::numeric AS revenue
        FROM stores s
        LEFT JOIN products p ON p.store_id = s.id
        LEFT JOIN orders   o ON o.store_id = s.id
        GROUP BY s.id
        ORDER BY revenue DESC
      `,
      sql`
        SELECT o.id, o.status, o.total, o.created_at,
          s.name AS store_name, s.primary_color AS store_color,
          u.username, u.email
        FROM orders o
        LEFT JOIN stores s ON s.id = o.store_id
        LEFT JOIN users  u ON u.id = o.user_id
        ORDER BY o.created_at DESC
        LIMIT 15
      `,
      sql`
        SELECT DATE(o.created_at) AS day,
          s.id AS store_id, s.name AS store_name, s.primary_color AS store_color,
          COUNT(*)::int AS orders,
          COALESCE(SUM(o.total), 0)::numeric AS revenue
        FROM orders o
        JOIN stores s ON s.id = o.store_id
        WHERE o.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(o.created_at), s.id
        ORDER BY day ASC
      `,
      sql`SELECT COUNT(*)::int AS total FROM users WHERE role = 'visitor'`,
    ]);

    // Build 30-day chart aggregated by day (all stores combined)
    const dayMap = {};
    for (const row of ordersByDay) {
      const key = row.day.toISOString().slice(0, 10);
      if (!dayMap[key]) dayMap[key] = { day: key, orders: 0, revenue: 0 };
      dayMap[key].orders  += row.orders;
      dayMap[key].revenue += parseFloat(row.revenue);
    }
    const chartDays = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      chartDays.push(dayMap[key] || { day: key, orders: 0, revenue: 0 });
    }

    const summary = perStore.reduce((acc, s) => ({
      stores:   acc.stores + 1,
      revenue:  acc.revenue  + parseFloat(s.revenue),
      orders:   acc.orders   + s.confirmed_orders,
      products: acc.products + s.active_products,
    }), { stores: 0, revenue: 0, orders: 0, products: 0 });

    return NextResponse.json({
      summary: { ...summary, users: globalUsers.total },
      stores: perStore.map(s => ({ ...s, revenue: parseFloat(s.revenue) })),
      recent_orders: recentOrders,
      chart_days: chartDays,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
