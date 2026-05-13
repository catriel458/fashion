import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function GET(req) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('store_id');
  const search  = searchParams.get('search');

  try {
    let products;
    if (storeId && search) {
      products = await sql`
        SELECT p.*, s.name AS store_name, s.slug AS store_slug, c.name AS category_name
        FROM products p
        LEFT JOIN stores s ON s.id = p.store_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.store_id = ${storeId}
          AND (p.name ILIKE ${'%' + search + '%'})
        ORDER BY s.name, p.name
      `;
    } else if (storeId) {
      products = await sql`
        SELECT p.*, s.name AS store_name, s.slug AS store_slug, c.name AS category_name
        FROM products p
        LEFT JOIN stores s ON s.id = p.store_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.store_id = ${storeId}
        ORDER BY p.name
      `;
    } else if (search) {
      products = await sql`
        SELECT p.*, s.name AS store_name, s.slug AS store_slug, c.name AS category_name
        FROM products p
        LEFT JOIN stores s ON s.id = p.store_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.name ILIKE ${'%' + search + '%'}
        ORDER BY s.name, p.name
      `;
    } else {
      products = await sql`
        SELECT p.*, s.name AS store_name, s.slug AS store_slug, c.name AS category_name
        FROM products p
        LEFT JOIN stores s ON s.id = p.store_id
        LEFT JOIN categories c ON c.id = p.category_id
        ORDER BY s.name, p.name
      `;
    }
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
