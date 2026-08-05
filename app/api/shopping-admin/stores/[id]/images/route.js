import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';
import sql from '@/lib/db';

async function checkShoppingAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'shopping_admin' && session.user.role !== 'superadmin')) return null;
  return session;
}

export async function GET(request, { params }) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const [existing] = await sql`
      SELECT s.id FROM stores s 
      JOIN shoppings sh ON sh.id = s.shopping_id 
      WHERE s.id = ${id} AND sh.owner_id = ${session.user.id}
    `;
    if (!existing) return NextResponse.json({ error: 'Tienda no encontrada o no pertenece a tu shopping' }, { status: 404 });

    const images = await sql`SELECT * FROM store_images WHERE store_id = ${id} ORDER BY sort_order ASC, id ASC`;
    return NextResponse.json(images);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const [existing] = await sql`
      SELECT s.id FROM stores s 
      JOIN shoppings sh ON sh.id = s.shopping_id 
      WHERE s.id = ${id} AND sh.owner_id = ${session.user.id}
    `;
    if (!existing) return NextResponse.json({ error: 'Tienda no encontrada o no pertenece a tu shopping' }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get('file');
    const caption = formData.get('caption') || '';
    if (!file || file.size === 0) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });

    const blob = await put(`stores/images/${id}-${Date.now()}-${file.name}`, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const [maxOrder] = await sql`SELECT MAX(sort_order) AS m FROM store_images WHERE store_id = ${id}`;
    const nextOrder = (maxOrder?.m || 0) + 1;

    const img = await sql`
      INSERT INTO store_images (store_id, image_url, caption, sort_order)
      VALUES (${id}, ${blob.url}, ${caption}, ${nextOrder})
      RETURNING *
    `;

    return NextResponse.json(img[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
