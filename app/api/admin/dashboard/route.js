import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const [
      [usersTotal],
      [usersNewWeek],
      [ordersTotal],
      ordersByStatus,
      ordersByDay,
      [productsActive],
      [productsNoStock],
      topProducts,
      recentOrders,
    ] = await Promise.all([
      sql`SELECT COUNT(*)::int AS total FROM users`,
      sql`SELECT COUNT(*)::int AS total FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`,
      sql`SELECT COUNT(*)::int AS total, COALESCE(SUM(total), 0)::numeric AS revenue FROM orders WHERE status = 'confirmed'`,
      sql`SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status`,
      sql`
        SELECT DATE(created_at) AS day,
          COUNT(*)::int AS orders,
          COALESCE(SUM(total), 0)::numeric AS revenue
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `,
      sql`SELECT COUNT(*)::int AS total FROM products WHERE active = true`,
      sql`SELECT COUNT(*)::int AS total FROM products WHERE stock = 0`,
      sql`
        SELECT p.name, COALESCE(SUM(oi.quantity), 0)::int AS total_sold
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        GROUP BY p.id, p.name
        ORDER BY total_sold DESC
        LIMIT 5
      `,
      sql`
        SELECT o.id, o.status, o.total, o.created_at,
          u.username, u.email
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC
        LIMIT 10
      `,
    ]);

    // Fill missing days in the last 30 days
    const dayMap = {};
    for (const row of ordersByDay) {
      dayMap[row.day.toISOString().slice(0, 10)] = row;
    }
    const filledDays = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      filledDays.push(dayMap[key] || { day: key, orders: 0, revenue: 0 });
    }

    return NextResponse.json({
      users: {
        total: usersTotal.total,
        new_this_week: usersNewWeek.total,
      },
      orders: {
        total: ordersTotal.total,
        by_status: ordersByStatus,
        by_day: filledDays,
        recent: recentOrders,
      },
      products: {
        active: productsActive.total,
        out_of_stock: productsNoStock.total,
      },
      revenue: {
        total: parseFloat(ordersTotal.revenue),
      },
      top_products: topProducts,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
