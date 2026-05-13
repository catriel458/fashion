import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stores = await sql`
      SELECT id, name, slug, tagline, logo_url, primary_color, secondary_color, font_family, active
      FROM stores
      WHERE active = true
      ORDER BY name
    `;
    return NextResponse.json(stores);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
