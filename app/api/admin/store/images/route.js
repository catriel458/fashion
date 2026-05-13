import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) return null;
  return session;
}

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const storeId = session.user.store_id;
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    const formData = await request.formData();
    const file     = formData.get('image');
    const caption  = formData.get('caption') || null;
    const sortOrder = parseInt(formData.get('sort_order') || '0');

    if (!file || file.size === 0) return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 });

    const blob = await put(`stores/${storeId}/${Date.now()}-${file.name}`, file, {
      access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const image = await sql`
      INSERT INTO store_images (store_id, image_url, caption, sort_order)
      VALUES (${storeId}, ${blob.url}, ${caption}, ${sortOrder})
      RETURNING *
    `;
    return NextResponse.json(image[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
