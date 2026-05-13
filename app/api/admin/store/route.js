import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) return null;
  return session;
}

// GET — datos de la tienda del admin actual
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const storeId = session.user.role === 'superadmin'
      ? null  // superadmin no tiene tienda propia
      : session.user.store_id;

    if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

    const stores = await sql`SELECT * FROM stores WHERE id = ${storeId}`;
    if (stores.length === 0) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

    const images = await sql`SELECT * FROM store_images WHERE store_id = ${storeId} ORDER BY sort_order, id`;
    return NextResponse.json({ ...stores[0], images });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT — actualizar datos de la tienda del admin
export async function PUT(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const storeId = session.user.store_id;
    if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

    const body = await request.json();
    const { name, tagline, primary_color, secondary_color, font_family, hero_title, hero_subtitle, about_text } = body;

    const existing = await sql`SELECT * FROM stores WHERE id = ${storeId}`;
    if (existing.length === 0) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
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
        updated_at      = NOW()
      WHERE id = ${storeId}
      RETURNING *
    `;
    return NextResponse.json(store[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
