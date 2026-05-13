import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';
import sql from '@/lib/db';

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function POST(request, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const formData = await request.formData();
    const file     = formData.get('image');
    const caption  = formData.get('caption') || null;
    const sortOrder = parseInt(formData.get('sort_order') || '0');

    if (!file || file.size === 0) return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 });

    const blob = await put(`stores/${id}/${Date.now()}-${file.name}`, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const image = await sql`
      INSERT INTO store_images (store_id, image_url, caption, sort_order)
      VALUES (${id}, ${blob.url}, ${caption}, ${sortOrder})
      RETURNING *
    `;
    return NextResponse.json(image[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
