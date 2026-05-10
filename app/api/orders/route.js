import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const orders = await sql`
      SELECT o.id, o.status, o.total, o.created_at,
        COUNT(oi.id)::int AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ${session.user.id}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { session_id } = await req.json();
    if (!session_id) return NextResponse.json({ error: 'session_id requerido' }, { status: 400 });

    const cartItems = await sql`
      SELECT ci.product_id, ci.quantity, p.name, p.price, p.image_url
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.session_id = ${session_id}
    `;
    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    const total = cartItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);

    const [order] = await sql`
      INSERT INTO orders (user_id, session_id, status, total)
      VALUES (${session.user.id}, ${session_id}, 'confirmed', ${total})
      RETURNING *
    `;

    for (const item of cartItems) {
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (${order.id}, ${item.product_id}, ${item.quantity}, ${item.price})
      `;
    }

    await sql`DELETE FROM cart_items WHERE session_id = ${session_id}`;

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
