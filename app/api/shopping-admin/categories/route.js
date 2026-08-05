import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

async function checkShoppingAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'shopping_admin' && session.user.role !== 'superadmin')) return null;
  return session;
}

export async function GET(request) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');
    if (!storeId) return NextResponse.json([]);

    const [shopping] = await sql`SELECT id FROM shoppings WHERE owner_id = ${session.user.id} LIMIT 1`;
    if (!shopping) return NextResponse.json([]);

    const [store] = await sql`SELECT id FROM stores WHERE id = ${storeId} AND shopping_id = ${shopping.id}`;
    if (!store) return NextResponse.json({ error: 'Tienda no autorizada o no encontrada' }, { status: 403 });

    const categories = await sql`
      SELECT * FROM categories 
      WHERE store_id = ${storeId} 
      ORDER BY name ASC
    `;
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const [shopping] = await sql`SELECT id FROM shoppings WHERE owner_id = ${session.user.id} LIMIT 1`;
    if (!shopping) return NextResponse.json({ error: 'Shopping no encontrado' }, { status: 400 });

    const { name, store_id } = await req.json();
    if (!name || !store_id) return NextResponse.json({ error: 'Nombre y store_id son requeridos' }, { status: 400 });

    const [store] = await sql`SELECT id FROM stores WHERE id = ${store_id} AND shopping_id = ${shopping.id}`;
    if (!store) return NextResponse.json({ error: 'Tienda no autorizada o no encontrada' }, { status: 403 });

    const cat = await sql`
      INSERT INTO categories (name, store_id)
      VALUES (${name}, ${store_id})
      RETURNING *
    `;
    return NextResponse.json(cat[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
