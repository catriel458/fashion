import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { slug } = params;

    const stores = await sql`
      SELECT * FROM stores WHERE slug = ${slug} AND active = true
    `;
    if (stores.length === 0) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    }

    const store = stores[0];
    const images = await sql`
      SELECT * FROM store_images WHERE store_id = ${store.id} ORDER BY sort_order, id
    `;

    return NextResponse.json({ ...store, images });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
