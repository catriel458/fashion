import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

async function checkShoppingAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'shopping_admin' && session.user.role !== 'superadmin')) return null;
  return session;
}

export async function GET() {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const [shopping] = await sql`SELECT id FROM shoppings WHERE owner_id = ${session.user.id} LIMIT 1`;
    if (!shopping) return NextResponse.json([]);

    const stores = await sql`
      SELECT * FROM stores 
      WHERE shopping_id = ${shopping.id} 
      ORDER BY created_at DESC
    `;
    return NextResponse.json(stores);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const [user] = await sql`SELECT max_stores FROM users WHERE id = ${session.user.id}`;
    const [shopping] = await sql`SELECT id FROM shoppings WHERE owner_id = ${session.user.id} LIMIT 1`;
    if (!shopping) return NextResponse.json({ error: 'Debés inicializar tu shopping primero.' }, { status: 400 });

    const currentCountRes = await sql`SELECT COUNT(*)::int FROM stores WHERE shopping_id = ${shopping.id}`;
    const currentCount = currentCountRes[0].count;
    const limit = user?.max_stores !== null ? user.max_stores : 5;

    if (currentCount >= limit) {
      return NextResponse.json({ error: `Has alcanzado el límite máximo de tiendas permitidas (${limit}).` }, { status: 400 });
    }

    const body = await req.json();
    const { name, slug, tagline, primary_color, secondary_color, font_family, hero_title, hero_subtitle, about_text, active, is_independent } = body;
    if (!name || !slug) return NextResponse.json({ error: 'Nombre y Slug son requeridos' }, { status: 400 });

    const existing = await sql`SELECT id FROM stores WHERE slug = ${slug}`;
    if (existing.length > 0) return NextResponse.json({ error: 'El slug ya está en uso' }, { status: 409 });

    const store = await sql`
      INSERT INTO stores (name, slug, tagline, primary_color, secondary_color, font_family, hero_title, hero_subtitle, about_text, active, is_independent, shopping_id)
      VALUES (${name}, ${slug}, ${tagline ?? null}, ${primary_color ?? '#009aae'}, ${secondary_color ?? '#ffffff'}, ${font_family ?? 'Inter'}, ${hero_title ?? null}, ${hero_subtitle ?? null}, ${about_text ?? null}, ${active !== undefined ? active : true}, ${is_independent || false}, ${shopping.id})
      RETURNING *
    `;
    return NextResponse.json(store[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
