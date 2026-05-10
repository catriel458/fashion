import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sql from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const formData = await request.formData();

    const existing = await sql`SELECT * FROM products WHERE id = ${id}`;
    if (!existing.length) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    const prev = existing[0];

    const name        = formData.get('name')        ?? prev.name;
    const description = formData.get('description') ?? prev.description;
    const price       = formData.get('price')       != null ? parseFloat(formData.get('price'))  : prev.price;
    const stock       = formData.get('stock')       != null ? parseInt(formData.get('stock'))    : prev.stock;
    const activeRaw   = formData.get('active');
    const active      = activeRaw != null ? activeRaw === 'true' : prev.active;
    const imageFile   = formData.get('image');

    const rawCatId     = formData.get('category_id');
    const categoryId   = rawCatId != null
      ? (rawCatId === '' ? null : parseInt(rawCatId))
      : prev.category_id;

    let imageUrl = prev.image_url;
    if (imageFile && imageFile.size > 0) {
      const blob = await put(`products/${Date.now()}-${imageFile.name}`, imageFile, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      imageUrl = blob.url;
    }

    const product = await sql`
      UPDATE products
      SET
        name        = ${name},
        category_id = ${categoryId},
        description = ${description},
        price       = ${price},
        stock       = ${stock},
        active      = ${active},
        image_url   = ${imageUrl},
        updated_at  = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(product[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await sql`DELETE FROM products WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
