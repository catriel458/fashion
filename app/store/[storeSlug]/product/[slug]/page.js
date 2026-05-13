import sql from '@/lib/db';
import { notFound } from 'next/navigation';
import ProductClient from './ProductClient';

export default async function ProductPage({ params }) {
  const { storeSlug, slug } = params;

  const stores = await sql`SELECT id FROM stores WHERE slug = ${storeSlug} AND active = true`;
  if (!stores.length) notFound();
  const storeId = stores[0].id;

  const rows = await sql`
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ${slug} AND p.store_id = ${storeId} AND p.active = true
    LIMIT 1
  `;
  if (!rows.length) notFound();

  return <ProductClient product={rows[0]} storeSlug={storeSlug} />;
}
