import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id requerido' }, { status: 400 });
    }

    const items = await sql`
      SELECT ci.id, ci.product_id, ci.quantity, ci.created_at,
             p.name, p.price, p.image_url, p.slug
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.session_id = ${sessionId}
      ORDER BY ci.created_at DESC
    `;

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { session_id, product_id, quantity = 1 } = await request.json();

    if (!session_id || !product_id) {
      return NextResponse.json({ error: 'session_id y product_id requeridos' }, { status: 400 });
    }

    const existing = await sql`
      SELECT id, quantity FROM cart_items
      WHERE session_id = ${session_id} AND product_id = ${product_id}
    `;

    let item;
    if (existing.length > 0) {
      item = await sql`
        UPDATE cart_items
        SET quantity = quantity + ${quantity}
        WHERE session_id = ${session_id} AND product_id = ${product_id}
        RETURNING *
      `;
    } else {
      item = await sql`
        INSERT INTO cart_items (session_id, product_id, quantity)
        VALUES (${session_id}, ${product_id}, ${quantity})
        RETURNING *
      `;
    }

    return NextResponse.json(item[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { session_id, product_id, quantity } = await request.json();

    if (!session_id || !product_id || quantity === undefined) {
      return NextResponse.json({ error: 'session_id, product_id y quantity requeridos' }, { status: 400 });
    }

    if (quantity <= 0) {
      await sql`
        DELETE FROM cart_items
        WHERE session_id = ${session_id} AND product_id = ${product_id}
      `;
      return NextResponse.json({ deleted: true });
    }

    const item = await sql`
      UPDATE cart_items
      SET quantity = ${quantity}
      WHERE session_id = ${session_id} AND product_id = ${product_id}
      RETURNING *
    `;

    return NextResponse.json(item[0] || null);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId  = searchParams.get('session_id');
    const productId  = searchParams.get('product_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id requerido' }, { status: 400 });
    }

    if (productId) {
      await sql`
        DELETE FROM cart_items
        WHERE session_id = ${sessionId} AND product_id = ${productId}
      `;
    } else {
      await sql`DELETE FROM cart_items WHERE session_id = ${sessionId}`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
