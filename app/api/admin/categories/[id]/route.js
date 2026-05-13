import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put, del } from '@vercel/blob';
import sql from '@/lib/db';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') return null;
  return session;
}

export async function PUT(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const contentType = req.headers.get('content-type') || '';
  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image');
      if (!file || file.size === 0) return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 });

      const [store] = await sql`SELECT slug FROM stores WHERE id = ${session.user.store_id}`;
      const [cat]   = await sql`SELECT slug, image_url FROM categories WHERE id = ${params.id} AND store_id = ${session.user.store_id}`;
      if (!store || !cat) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

      const ext = file.name.split('.').pop() || 'jpg';
      const blob = await put(
        `category-images/${store.slug}/${cat.slug}-${Date.now()}.${ext}`,
        file,
        {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        }
      );

      const [updated] = await sql`
        UPDATE categories SET image_url = ${blob.url}
        WHERE id = ${params.id} AND store_id = ${session.user.store_id}
        RETURNING *
      `;

      if (cat.image_url && cat.image_url !== blob.url) {
        try { await del(cat.image_url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
      }

      return NextResponse.json(updated);
    } else {
      const { name } = await req.json();
      if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
      const [updated] = await sql`
        UPDATE categories SET name = ${name.trim()}
        WHERE id = ${params.id} AND store_id = ${session.user.store_id}
        RETURNING *
      `;
      return NextResponse.json(updated);
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const [cat] = await sql`
      SELECT image_url FROM categories WHERE id = ${params.id} AND store_id = ${session.user.store_id}
    `;
    if (!cat) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    await sql`DELETE FROM categories WHERE id = ${params.id} AND store_id = ${session.user.store_id}`;
    if (cat.image_url) {
      try { await del(cat.image_url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
