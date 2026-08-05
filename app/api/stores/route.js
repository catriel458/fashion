import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stores = await sql`
      SELECT id, name, slug, tagline, logo_url, primary_color, secondary_color, font_family, active,
             (SELECT image_url FROM store_images WHERE store_id = stores.id ORDER BY sort_order, id LIMIT 1) AS cover_image_url
      FROM stores
      WHERE active = true 
        AND (is_independent = false OR is_independent IS NULL)
        AND shopping_id IS NULL
      ORDER BY name
    `;
    return NextResponse.json(stores);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
