import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sql from '@/lib/db';

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function GET() {
  try {
    const products = await sql`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `;
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const formData    = await request.formData();
    const name        = formData.get('name');
    const categoryId  = formData.get('category_id') || null;
    const description = formData.get('description') || null;
    const price       = formData.get('price');
    const stock       = parseInt(formData.get('stock') || '0');
    const imageFile   = formData.get('image');

    if (!name || !price) {
      return NextResponse.json({ error: 'name y price son requeridos' }, { status: 400 });
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      const blob = await put(`products/${Date.now()}-${imageFile.name}`, imageFile, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      imageUrl = blob.url;
    }

    const slug = slugify(name) + '-' + Date.now();
    const finalCategoryId = categoryId === '' ? null : categoryId;

    const product = await sql`
      INSERT INTO products (name, slug, category_id, description, price, stock, image_url, active)
      VALUES (
        ${name},
        ${slug},
        ${finalCategoryId},
        ${description},
        ${parseFloat(price)},
        ${stock},
        ${imageUrl},
        true
      )
      RETURNING *
    `;

    return NextResponse.json(product[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
