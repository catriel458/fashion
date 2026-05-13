import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get('storeSlug');

    let categories;
    if (storeSlug) {
      categories = await sql`
        SELECT c.* FROM categories c
        JOIN stores s ON c.store_id = s.id
        WHERE s.slug = ${storeSlug}
        ORDER BY c.name
      `;
    } else {
      categories = await sql`SELECT * FROM categories ORDER BY name`;
    }
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { name, store_id: bodyStoreId } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const slug = name.trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

    let storeId = bodyStoreId || null;
    if (!storeId && session.user.store_id) {
      storeId = session.user.store_id;
    }

    const result = await sql`
      INSERT INTO categories (name, slug, store_id) VALUES (${name.trim()}, ${slug}, ${storeId})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
