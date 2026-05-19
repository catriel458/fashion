import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminStoreId } from '@/lib/admin-store';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) return null;
  return session;
}

export async function GET(req) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const storeId = await getAdminStoreId(session);
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const from   = searchParams.get('from') || '';
    const to     = searchParams.get('to') || '';

    let orders;
    if (status && search) {
      orders = await sql`
        SELECT o.id, o.status, o.total, o.created_at, o.status_updated_at,
          u.username, u.email, u.first_name, u.last_name,
          COUNT(oi.id)::int AS item_count
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.store_id = ${storeId}
          AND o.status = ${status}
          AND (u.username ILIKE ${'%' + search + '%'} OR u.email ILIKE ${'%' + search + '%'} OR o.id::text = ${search})
        GROUP BY o.id, u.username, u.email, u.first_name, u.last_name
        ORDER BY o.created_at DESC
      `;
    } else if (status) {
      orders = await sql`
        SELECT o.id, o.status, o.total, o.created_at, o.status_updated_at,
          u.username, u.email, u.first_name, u.last_name,
          COUNT(oi.id)::int AS item_count
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.store_id = ${storeId} AND o.status = ${status}
        GROUP BY o.id, u.username, u.email, u.first_name, u.last_name
        ORDER BY o.created_at DESC
      `;
    } else if (search) {
      orders = await sql`
        SELECT o.id, o.status, o.total, o.created_at, o.status_updated_at,
          u.username, u.email, u.first_name, u.last_name,
          COUNT(oi.id)::int AS item_count
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.store_id = ${storeId}
          AND (u.username ILIKE ${'%' + search + '%'} OR u.email ILIKE ${'%' + search + '%'} OR o.id::text = ${search})
        GROUP BY o.id, u.username, u.email, u.first_name, u.last_name
        ORDER BY o.created_at DESC
      `;
    } else {
      orders = await sql`
        SELECT o.id, o.status, o.total, o.created_at, o.status_updated_at,
          u.username, u.email, u.first_name, u.last_name,
          COUNT(oi.id)::int AS item_count
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.store_id = ${storeId}
        GROUP BY o.id, u.username, u.email, u.first_name, u.last_name
        ORDER BY o.created_at DESC
        LIMIT 100
      `;
    }

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
