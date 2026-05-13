import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';
import sql from '@/lib/db';

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    let products;
    if (session.user.role === 'superadmin') {
      products = await sql`
        SELECT p.*, c.name AS category_name, s.name AS store_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN stores s ON p.store_id = s.id
        ORDER BY p.created_at DESC
      `;
    } else {
      products = await sql`
        SELECT p.*, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.store_id = ${session.user.store_id}
        ORDER BY p.created_at DESC
      `;
    }
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

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
    const storeId = session.user.role === 'admin' ? session.user.store_id : (formData.get('store_id') || null);

    const product = await sql`
      INSERT INTO products (name, slug, category_id, description, price, stock, image_url, active, store_id)
      VALUES (
        ${name},
        ${slug},
        ${finalCategoryId},
        ${description},
        ${parseFloat(price)},
        ${stock},
        ${imageUrl},
        true,
        ${storeId}
      )
      RETURNING *
    `;

    return NextResponse.json(product[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
