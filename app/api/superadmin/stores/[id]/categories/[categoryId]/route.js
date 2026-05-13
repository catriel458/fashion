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

// PUT: subir imagen (multipart) o actualizar datos (json)
export async function PUT(req, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  const contentType = req.headers.get('content-type') || '';

  try {
    if (contentType.includes('multipart/form-data')) {
      // Upload de imagen via Vercel Blob
      const formData = await req.formData();
      const file = formData.get('image');
      if (!file || file.size === 0) return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 });

      const [store] = await sql`SELECT slug FROM stores WHERE id = ${params.id}`;
      const [cat]   = await sql`SELECT slug FROM categories WHERE id = ${params.categoryId} AND store_id = ${params.id}`;
      if (!store || !cat) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

      const ext = file.name.split('.').pop() || 'jpg';
      const blob = await put(
        `category-images/${store.slug}/${cat.slug}.${ext}`,
        file,
        { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN, allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] }
      );

      const [updated] = await sql`
        UPDATE categories SET image_url = ${blob.url} WHERE id = ${params.categoryId} AND store_id = ${params.id} RETURNING *
      `;
      return NextResponse.json(updated);
    } else {
      // Actualizar nombre
      const { name } = await req.json();
      if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
      const [updated] = await sql`
        UPDATE categories SET name = ${name.trim()} WHERE id = ${params.categoryId} AND store_id = ${params.id} RETURNING *
      `;
      return NextResponse.json(updated);
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    await sql`DELETE FROM categories WHERE id = ${params.categoryId} AND store_id = ${params.id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
