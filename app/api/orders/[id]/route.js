import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { id } = params;
    const [order] = await sql`
      SELECT * FROM orders WHERE id = ${id} AND user_id = ${session.user.id}
    `;
    if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });

    const items = await sql`
      SELECT oi.quantity, oi.price_at_purchase,
        p.name, p.image_url, p.slug
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ${id}
    `;

    return NextResponse.json({ ...order, items });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
