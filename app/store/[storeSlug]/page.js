import sql from '@/lib/db';
import { notFound } from 'next/navigation';
import StoreClient from './StoreClient';

export const dynamic = 'force-dynamic';

async function getStoreData(slug) {
  const stores = await sql`SELECT * FROM stores WHERE slug = ${slug} AND active = true`;
  if (!stores.length) return null;
  const store = stores[0];

  const [images, categories, products] = await Promise.all([
    sql`SELECT * FROM store_images WHERE store_id = ${store.id} ORDER BY sort_order, id`,
    sql`SELECT * FROM categories WHERE store_id = ${store.id} ORDER BY name`,
    sql`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.store_id = ${store.id} AND p.active = true
      ORDER BY p.created_at DESC
      LIMIT 8
    `,
  ]);

  return { store, images, categories, products };
}

export default async function StorePage({ params }) {
  const { storeSlug } = params;
  const data = await getStoreData(storeSlug);
  if (!data) notFound();

  return (
    <StoreClient
      store={data.store}
      images={data.images}
      categories={data.categories}
      products={data.products}
      storeSlug={storeSlug}
    />
  );
}
