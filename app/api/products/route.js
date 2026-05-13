import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const search     = searchParams.get('search');
    const slug       = searchParams.get('slug');
    const storeSlug  = searchParams.get('storeSlug');
    const limit      = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : null;

    let products;

    if (slug && storeSlug) {
      products = await sql`
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        JOIN stores s ON p.store_id = s.id
        WHERE p.slug = ${slug} AND s.slug = ${storeSlug} AND p.active = true
        LIMIT 1
      `;
    } else if (slug) {
      products = await sql`
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.slug = ${slug} AND p.active = true
        LIMIT 1
      `;
    } else if (storeSlug && categoryId) {
      products = await sql`
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        JOIN stores s ON p.store_id = s.id
        WHERE s.slug = ${storeSlug} AND p.category_id = ${categoryId} AND p.active = true
        ORDER BY p.created_at DESC
      `;
    } else if (storeSlug && limit) {
      products = await sql`
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        JOIN stores s ON p.store_id = s.id
        WHERE s.slug = ${storeSlug} AND p.active = true
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `;
    } else if (storeSlug) {
      products = await sql`
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        JOIN stores s ON p.store_id = s.id
        WHERE s.slug = ${storeSlug} AND p.active = true
        ORDER BY p.created_at DESC
      `;
    } else if (categoryId && search) {
      products = await sql`
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.category_id = ${categoryId}
          AND p.active = true
          AND p.name ILIKE ${'%' + search + '%'}
        ORDER BY p.created_at DESC
      `;
    } else if (categoryId) {
      products = await sql`
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.category_id = ${categoryId} AND p.active = true
        ORDER BY p.created_at DESC
      `;
    } else if (search) {
      products = await sql`
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.active = true
          AND p.name ILIKE ${'%' + search + '%'}
        ORDER BY p.created_at DESC
      `;
    } else {
      products = await sql`
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.active = true
        ORDER BY p.created_at DESC
      `;
    }

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
