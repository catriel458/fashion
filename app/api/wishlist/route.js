import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  try {
    const { searchParams } = new URL(request.url);
    const storeIdStr = searchParams.get('store_id');
    const storeId = storeIdStr ? Number(storeIdStr) : null;

    const rows = await sql`
      SELECT w.id, w.product_id, w.created_at,
        p.name, p.price, p.image_url, p.slug, p.stock,
        s.name as store_name, s.slug as store_slug
      FROM wishlist w
      JOIN products p ON p.id = w.product_id
      JOIN stores s ON s.id = w.store_id
      WHERE w.user_id = ${userId}
        AND (${storeId}::int IS NULL OR w.store_id = ${storeId}::int)
      ORDER BY w.created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  try {
    const { product_id, store_id } = await request.json();
    if (!product_id || !store_id) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    await sql`
      INSERT INTO wishlist (user_id, product_id, store_id)
      VALUES (${userId}, ${product_id}, ${store_id})
      ON CONFLICT (user_id, product_id) DO NOTHING
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  try {
    const { searchParams } = new URL(request.url);
    const productIdStr = searchParams.get('product_id');
    if (!productIdStr) {
      return NextResponse.json({ error: 'product_id requerido' }, { status: 400 });
    }
    const productId = Number(productIdStr);

    await sql`
      DELETE FROM wishlist WHERE user_id = ${userId} AND product_id = ${productId}
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
