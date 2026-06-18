import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminStoreId } from '@/lib/admin-store';
import sql from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const storeId = session.user.role === 'superadmin' ? null : await getAdminStoreId(session);

  try {
    // Asegurar la existencia de las tablas para evitar errores de relación inexistente
    await sql`
      CREATE TABLE IF NOT EXISTS fitting_room_usage (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        used_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS fitting_room_item_logs (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    let queries;

    if (session.user.role === 'superadmin') {
      queries = await Promise.all([
        sql`SELECT COUNT(*)::int AS total FROM users`,
        sql`SELECT COUNT(*)::int AS total FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`,
        sql`SELECT COUNT(*)::int AS total, COALESCE(SUM(total), 0)::numeric AS revenue FROM orders WHERE status = 'delivered'`,
        sql`SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status`,
        sql`
          SELECT DATE(created_at) AS day,
            COUNT(*)::int AS orders,
            COALESCE(SUM(total), 0)::numeric AS revenue
          FROM orders
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at) ORDER BY day ASC
        `,
        sql`SELECT COUNT(*)::int AS total FROM products WHERE active = true`,
        sql`SELECT COUNT(*)::int AS total FROM products WHERE stock = 0`,
        sql`
          SELECT p.name, COALESCE(SUM(oi.quantity), 0)::int AS total_sold
          FROM products p LEFT JOIN order_items oi ON oi.product_id = p.id
          GROUP BY p.id, p.name ORDER BY total_sold DESC LIMIT 5
        `,
        sql`
          SELECT o.id, o.status, o.total, o.created_at, u.username, u.email
          FROM orders o LEFT JOIN users u ON u.id = o.user_id
          ORDER BY o.created_at DESC LIMIT 10
        `,
        sql`SELECT COUNT(*)::int AS total FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status != 'cancelled'`,
        sql`SELECT COUNT(*)::int AS total FROM orders WHERE status = 'pending'`,
        sql`SELECT COUNT(*)::int AS total FROM orders WHERE status = 'ready'`,
        sql`SELECT COALESCE(SUM(total), 0)::numeric AS total FROM orders WHERE status = 'delivered' AND created_at >= DATE_TRUNC('month', NOW())`,
        sql`
          SELECT c.name AS category_name,
            p.name AS product_name,
            COALESCE(SUM(oi.quantity), 0)::int AS units_sold,
            COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0)::numeric AS revenue
          FROM categories c
          INNER JOIN products p ON p.category_id = c.id
          LEFT JOIN order_items oi ON oi.product_id = p.id
          LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
          GROUP BY c.id, c.name, p.id, p.name
          ORDER BY units_sold DESC
        `,
        sql`SELECT COUNT(*)::int AS total FROM fitting_room_usage`,
        sql`
          SELECT p.name, COUNT(w.id)::int AS count
          FROM wishlist w
          JOIN products p ON w.product_id = p.id
          GROUP BY p.id, p.name
          ORDER BY count DESC
          LIMIT 5
        `,
        sql`
          SELECT p.name, COUNT(f.id)::int AS count
          FROM fitting_room_item_logs f
          JOIN products p ON f.product_id = p.id
          GROUP BY p.id, p.name
          ORDER BY count DESC
          LIMIT 5
        `
      ]);
    } else {
      queries = await Promise.all([
        sql`SELECT COUNT(*)::int AS total FROM users WHERE store_id = ${storeId} OR store_id IS NULL`,
        sql`SELECT COUNT(*)::int AS total FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`,
        sql`SELECT COUNT(*)::int AS total, COALESCE(SUM(total), 0)::numeric AS revenue FROM orders WHERE store_id = ${storeId} AND status = 'delivered'`,
        sql`SELECT status, COUNT(*)::int AS count FROM orders WHERE store_id = ${storeId} GROUP BY status`,
        sql`
          SELECT DATE(created_at) AS day,
            COUNT(*)::int AS orders,
            COALESCE(SUM(total), 0)::numeric AS revenue
          FROM orders
          WHERE store_id = ${storeId} AND created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at) ORDER BY day ASC
        `,
        sql`SELECT COUNT(*)::int AS total FROM products WHERE active = true AND store_id = ${storeId}`,
        sql`SELECT COUNT(*)::int AS total FROM products WHERE stock = 0 AND store_id = ${storeId}`,
        sql`
          SELECT p.name, COALESCE(SUM(oi.quantity), 0)::int AS total_sold
          FROM products p LEFT JOIN order_items oi ON oi.product_id = p.id
          WHERE p.store_id = ${storeId}
          GROUP BY p.id, p.name ORDER BY total_sold DESC LIMIT 5
        `,
        sql`
          SELECT o.id, o.status, o.total, o.created_at, u.username, u.email
          FROM orders o LEFT JOIN users u ON u.id = o.user_id
          WHERE o.store_id = ${storeId}
          ORDER BY o.created_at DESC LIMIT 10
        `,
        sql`SELECT COUNT(*)::int AS total FROM orders WHERE store_id = ${storeId} AND DATE(created_at) = CURRENT_DATE AND status != 'cancelled'`,
        sql`SELECT COUNT(*)::int AS total FROM orders WHERE store_id = ${storeId} AND status = 'pending'`,
        sql`SELECT COUNT(*)::int AS total FROM orders WHERE store_id = ${storeId} AND status = 'ready'`,
        sql`SELECT COALESCE(SUM(total), 0)::numeric AS total FROM orders WHERE store_id = ${storeId} AND status = 'delivered' AND created_at >= DATE_TRUNC('month', NOW())`,
        sql`
          SELECT c.name AS category_name,
            p.name AS product_name,
            COALESCE(SUM(oi.quantity), 0)::int AS units_sold,
            COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0)::numeric AS revenue
          FROM categories c
          INNER JOIN products p ON p.category_id = c.id
          LEFT JOIN order_items oi ON oi.product_id = p.id
          LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
          WHERE c.store_id = ${storeId}
          GROUP BY c.id, c.name, p.id, p.name
          ORDER BY units_sold DESC
        `,
        sql`SELECT COUNT(*)::int AS total FROM fitting_room_usage WHERE store_id = ${storeId}`,
        sql`
          SELECT p.name, COUNT(w.id)::int AS count
          FROM wishlist w
          JOIN products p ON w.product_id = p.id
          WHERE w.store_id = ${storeId}
          GROUP BY p.id, p.name
          ORDER BY count DESC
          LIMIT 5
        `,
        sql`
          SELECT p.name, COUNT(f.id)::int AS count
          FROM fitting_room_item_logs f
          JOIN products p ON f.product_id = p.id
          WHERE f.store_id = ${storeId}
          GROUP BY p.id, p.name
          ORDER BY count DESC
          LIMIT 5
        `
      ]);
    }

    const [
      [usersTotal], [usersNewWeek], [ordersRevenue],
      ordersByStatus, ordersByDay,
      [productsActive], [productsNoStock],
      topProducts, recentOrders,
      [ordersToday], [ordersPending], [ordersReady], [revenueMonth],
      categorySales,
      [fittingUsageTotal], topWishlisted, topTried,
    ] = queries;

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
      users: { total: usersTotal.total, new_this_week: usersNewWeek.total },
      orders: {
        total:    ordersByStatus.reduce((s, r) => s + r.count, 0),
        today:    ordersToday.total,
        pending:  ordersPending.total,
        ready:    ordersReady.total,
        by_status: ordersByStatus,
        by_day:   filledDays,
        recent:   recentOrders,
      },
      products: { active: productsActive.total, out_of_stock: productsNoStock.total },
      revenue: {
        total:       parseFloat(ordersRevenue.revenue),
        delivered_count: ordersRevenue.total,
        this_month:  parseFloat(revenueMonth.total),
      },
      top_products: topProducts,
      category_sales: categorySales,
      fitting_usage_total: fittingUsageTotal.total,
      top_wishlisted: topWishlisted,
      top_tried: topTried,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
