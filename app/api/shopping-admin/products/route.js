import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';
import sql from '@/lib/db';

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

async function checkShoppingAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'shopping_admin' && session.user.role !== 'superadmin')) return null;
  return session;
}

export async function GET(request) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');

    const [shopping] = await sql`SELECT id FROM shoppings WHERE owner_id = ${session.user.id} LIMIT 1`;
    if (!shopping) return NextResponse.json([]);

    let products;
    if (storeId) {
      // Validar pertenencia de la tienda
      const [store] = await sql`SELECT id FROM stores WHERE id = ${storeId} AND shopping_id = ${shopping.id}`;
      if (!store) return NextResponse.json({ error: 'Tienda no autorizada o no encontrada' }, { status: 403 });

      products = await sql`
        SELECT p.*, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.store_id = ${storeId}
        ORDER BY p.created_at DESC
      `;
    } else {
      // Traer todos los productos del shopping
      products = await sql`
        SELECT p.*, c.name AS category_name, s.name AS store_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        JOIN stores s ON p.store_id = s.id
        WHERE s.shopping_id = ${shopping.id}
        ORDER BY p.created_at DESC
      `;
    }

    return NextResponse.json(products);
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

    const formData    = await request.formData();
    const storeId     = formData.get('store_id');
    const name        = formData.get('name');
    const categoryId  = formData.get('category_id') || null;
    const description = formData.get('description') || null;
    const price       = formData.get('price');
    const stock       = parseInt(formData.get('stock') || '0');
    const colors      = formData.get('colors') || null;

    if (!storeId || !name || !price) {
      return NextResponse.json({ error: 'store_id, name y price son requeridos' }, { status: 400 });
    }

    // Validar pertenencia de la tienda
    const [store] = await sql`SELECT id FROM stores WHERE id = ${storeId} AND shopping_id = ${shopping.id}`;
    if (!store) return NextResponse.json({ error: 'Tienda no autorizada' }, { status: 403 });

    const imageUrls = [];
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

    const primaryImageUrl = imageUrls[0] || null;
    const slug = slugify(name) + '-' + Date.now();
    const finalCategoryId = categoryId === '' ? null : categoryId;

    const product = await sql`
      INSERT INTO products (name, slug, category_id, description, price, stock, image_url, image_urls, active, store_id, colors)
      VALUES (
        ${name},
        ${slug},
        ${finalCategoryId},
        ${description},
        ${parseFloat(price)},
        ${stock},
        ${primaryImageUrl},
        ${JSON.stringify(imageUrls)},
        true,
        ${storeId},
        ${colors}
      )
      RETURNING *
    `;

    return NextResponse.json(product[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
