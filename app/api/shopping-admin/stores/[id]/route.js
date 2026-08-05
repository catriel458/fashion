import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

async function checkShoppingAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'shopping_admin' && session.user.role !== 'superadmin')) return null;
  return session;
}

export async function GET(req, { params }) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const store = await sql`
      SELECT s.* FROM stores s 
      JOIN shoppings sh ON sh.id = s.shopping_id 
      WHERE s.id = ${id} AND sh.owner_id = ${session.user.id}
    `;
    if (store.length === 0) return NextResponse.json({ error: 'Tienda no encontrada o no pertenece a tu shopping' }, { status: 404 });
    return NextResponse.json(store[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const [existing] = await sql`
      SELECT s.* FROM stores s 
      JOIN shoppings sh ON sh.id = s.shopping_id 
      WHERE s.id = ${id} AND sh.owner_id = ${session.user.id}
    `;
    if (!existing) return NextResponse.json({ error: 'Tienda no encontrada o no pertenece a tu shopping' }, { status: 404 });

    const body = await req.json();
    const { name, slug, tagline, primary_color, secondary_color, font_family, hero_title, hero_subtitle, about_text, active, is_independent } = body;

    const updated = await sql`
      UPDATE stores SET
        name = ${name ?? existing.name},
        slug = ${slug ?? existing.slug},
        tagline = ${tagline !== undefined ? tagline : existing.tagline},
        primary_color = ${primary_color ?? existing.primary_color},
        secondary_color = ${secondary_color ?? existing.secondary_color},
        font_family = ${font_family ?? existing.font_family},
        hero_title = ${hero_title !== undefined ? hero_title : existing.hero_title},
        hero_subtitle = ${hero_subtitle !== undefined ? hero_subtitle : existing.hero_subtitle},
        about_text = ${about_text !== undefined ? about_text : existing.about_text},
        active = ${active !== undefined ? active : existing.active},
        is_independent = ${is_independent !== undefined ? is_independent : existing.is_independent},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const [existing] = await sql`
      SELECT s.* FROM stores s 
      JOIN shoppings sh ON sh.id = s.shopping_id 
      WHERE s.id = ${id} AND sh.owner_id = ${session.user.id}
    `;
    if (!existing) return NextResponse.json({ error: 'Tienda no encontrada o no pertenece a tu shopping' }, { status: 404 });

    await sql`DELETE FROM stores WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
