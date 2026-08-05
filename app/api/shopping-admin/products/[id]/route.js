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

export async function PUT(request, { params }) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const [existing] = await sql`
      SELECT p.* FROM products p
      JOIN stores s ON s.id = p.store_id
      JOIN shoppings sh ON sh.id = s.shopping_id
      WHERE p.id = ${id} AND sh.owner_id = ${session.user.id}
    `;
    if (!existing) return NextResponse.json({ error: 'Producto no encontrado o no pertenece a tu shopping' }, { status: 404 });

    const formData    = await request.formData();
    const name        = formData.get('name');
    const categoryId  = formData.get('category_id') || null;
    const description = formData.get('description') || null;
    const price       = formData.get('price');
    const stock       = parseInt(formData.get('stock') || '0');
    const active      = formData.get('active') === 'true';
    const colors      = formData.get('colors') || null;

    const retainedImages = JSON.parse(formData.get('retained_images') || '[]');
    const imageUrls = [...retainedImages];

    const imageFiles = formData.getAll('images');
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const blob = await put(`products/${Date.now()}-${file.name}`, file, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        imageUrls.push(blob.url);
      }
    }

    // Delete unused images from blob
    const oldUrls = existing.image_urls || (existing.image_url ? [existing.image_url] : []);
    for (const url of oldUrls) {
      if (!imageUrls.includes(url)) {
        try { await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
      }
    }

    const primaryImageUrl = imageUrls[0] || null;
    const finalCategoryId = categoryId === '' ? null : categoryId;

    const updated = await sql`
      UPDATE products SET
        name = ${name ?? existing.name},
        category_id = ${finalCategoryId},
        description = ${description},
        price = ${price ? parseFloat(price) : existing.price},
        stock = ${stock},
        image_url = ${primaryImageUrl},
        image_urls = ${JSON.stringify(imageUrls)},
        active = ${active},
        colors = ${colors},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const [existing] = await sql`
      SELECT p.* FROM products p
      JOIN stores s ON s.id = p.store_id
      JOIN shoppings sh ON sh.id = s.shopping_id
      WHERE p.id = ${id} AND sh.owner_id = ${session.user.id}
    `;
    if (!existing) return NextResponse.json({ error: 'Producto no encontrado o no pertenece a tu shopping' }, { status: 404 });

    const oldUrls = existing.image_urls || (existing.image_url ? [existing.image_url] : []);
    for (const url of oldUrls) {
      try { await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
    }

    await sql`DELETE FROM products WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
