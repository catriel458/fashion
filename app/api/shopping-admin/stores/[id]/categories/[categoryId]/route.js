import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put, del } from '@vercel/blob';
import sql from '@/lib/db';

async function checkShoppingAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'shopping_admin' && session.user.role !== 'superadmin')) return null;
  return session;
}

export async function PUT(req, { params }) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  const contentType = req.headers.get('content-type') || '';
  const storeId = parseInt(params.id);
  const catId = parseInt(params.categoryId);

  try {
    // Validar pertenencia del store
    const [store] = await sql`
      SELECT s.id, s.slug FROM stores s 
      JOIN shoppings sh ON sh.id = s.shopping_id 
      WHERE s.id = ${storeId} AND sh.owner_id = ${session.user.id}
    `;
    if (!store) return NextResponse.json({ error: 'Tienda no autorizada' }, { status: 403 });

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image');
      if (!file || file.size === 0) return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 });

      const [cat] = await sql`SELECT image_url FROM categories WHERE id = ${catId} AND store_id = ${storeId}`;
      if (!cat) return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });

      const ext = file.name.split('.').pop() || 'jpg';
      const blob = await put(
        `category-images/${store.slug}/${catId}-${Date.now()}.${ext}`,
        file,
        { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN, allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] }
      );

      const [updated] = await sql`
        UPDATE categories SET image_url = ${blob.url} WHERE id = ${catId} AND store_id = ${storeId} RETURNING *
      `;

      if (cat.image_url && cat.image_url !== blob.url) {
        try { await del(cat.image_url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
      }

      return NextResponse.json(updated);
    } else {
      const { name } = await req.json();
      if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
      const [updated] = await sql`
        UPDATE categories SET name = ${name.trim()} WHERE id = ${catId} AND store_id = ${storeId} RETURNING *
      `;
      return NextResponse.json(updated);
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  const storeId = parseInt(params.id);
  const catId = parseInt(params.categoryId);

  try {
    // Validar pertenencia del store
    const [store] = await sql`
      SELECT s.id FROM stores s 
      JOIN shoppings sh ON sh.id = s.shopping_id 
      WHERE s.id = ${storeId} AND sh.owner_id = ${session.user.id}
    `;
    if (!store) return NextResponse.json({ error: 'Tienda no autorizada' }, { status: 403 });

    const [cat] = await sql`SELECT image_url FROM categories WHERE id = ${catId} AND store_id = ${storeId}`;
    if (!cat) return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });

    if (cat.image_url) {
      try { await del(cat.image_url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
    }

    await sql`DELETE FROM categories WHERE id = ${catId} AND store_id = ${storeId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
