import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function GET(request, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const stores = await sql`SELECT * FROM stores WHERE id = ${id}`;
    if (stores.length === 0) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    const images = await sql`SELECT * FROM store_images WHERE store_id = ${id} ORDER BY sort_order, id`;
    const admin  = await sql`SELECT id, username, email FROM users WHERE store_id = ${id} AND role = 'admin' LIMIT 1`;
    return NextResponse.json({ ...stores[0], images, admin: admin[0] || null });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const body = await request.json();
    const { name, tagline, primary_color, secondary_color, font_family, hero_title, hero_subtitle, about_text, active } = body;

    const existing = await sql`SELECT * FROM stores WHERE id = ${id}`;
    if (existing.length === 0) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    const prev = existing[0];

    const store = await sql`
      UPDATE stores SET
        name            = ${name            ?? prev.name},
        tagline         = ${tagline         ?? prev.tagline},
        primary_color   = ${primary_color   ?? prev.primary_color},
        secondary_color = ${secondary_color ?? prev.secondary_color},
        font_family     = ${font_family     ?? prev.font_family},
        hero_title      = ${hero_title      ?? prev.hero_title},
        hero_subtitle   = ${hero_subtitle   ?? prev.hero_subtitle},
        about_text      = ${about_text      ?? prev.about_text},
        active          = ${active          ?? prev.active},
        updated_at      = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return NextResponse.json(store[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    await sql`DELETE FROM stores WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
