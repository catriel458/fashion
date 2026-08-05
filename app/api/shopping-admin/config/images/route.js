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

export async function GET() {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const [shopping] = await sql`SELECT id FROM shoppings WHERE owner_id = ${session.user.id} LIMIT 1`;
    if (!shopping) return NextResponse.json([]);

    const images = await sql`
      SELECT * FROM shopping_images 
      WHERE shopping_id = ${shopping.id} 
      ORDER BY sort_order ASC, id ASC
    `;
    return NextResponse.json(images);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const [shopping] = await sql`SELECT id FROM shoppings WHERE owner_id = ${session.user.id} LIMIT 1`;
    if (!shopping) return NextResponse.json({ error: 'Shopping no encontrado' }, { status: 400 });

    const formData = await request.formData();
    const file = formData.get('file');
    const caption = formData.get('caption') || '';
    if (!file || file.size === 0) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });

    const blob = await put(`shoppings/images/${shopping.id}-${Date.now()}-${file.name}`, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const [maxOrder] = await sql`SELECT MAX(sort_order) AS m FROM shopping_images WHERE shopping_id = ${shopping.id}`;
    const nextOrder = (maxOrder?.m || 0) + 1;

    const img = await sql`
      INSERT INTO shopping_images (shopping_id, image_url, caption, sort_order)
      VALUES (${shopping.id}, ${blob.url}, ${caption}, ${nextOrder})
      RETURNING *
    `;

    return NextResponse.json(img[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
