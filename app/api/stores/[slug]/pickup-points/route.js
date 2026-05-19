import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { slug } = params;
    const [store] = await sql`SELECT id FROM stores WHERE slug = ${slug} AND active = true`;
    if (!store) return NextResponse.json([], { status: 200 });

    const points = await sql`
      SELECT id, name, address, description
      FROM pickup_points
      WHERE store_id = ${store.id} AND active = true
      ORDER BY name
    `.catch(() => []);  // Si la tabla no existe aún, devuelve vacío

    return NextResponse.json(points);
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}
