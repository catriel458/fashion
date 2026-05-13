import sql from '@/lib/db';
import { notFound } from 'next/navigation';
import CategoryClient from './CategoryClient';

export default async function CategoryPage({ params }) {
  const { storeSlug, slug } = params;

  const stores = await sql`SELECT * FROM stores WHERE slug = ${storeSlug} AND active = true`;
  if (!stores.length) notFound();
  const store = stores[0];

  const cats = await sql`SELECT * FROM categories WHERE store_id = ${store.id} ORDER BY name`;
  const category = cats.find(c => c.slug === slug) || null;

  const products = category
    ? await sql`
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.category_id = ${category.id} AND p.store_id = ${store.id} AND p.active = true
        ORDER BY p.created_at DESC
      `
    : [];

  return (
    <CategoryClient
      storeSlug={storeSlug}
      category={category}
      slug={slug}
      products={products}
      categories={cats}
      primaryColor={store.primary_color || '#009aae'}
      accentColor={store.accent_color || store.primary_color || '#0f0f0f'}
      buttonStyle={store.button_style || 'rounded'}
    />
  );
}
