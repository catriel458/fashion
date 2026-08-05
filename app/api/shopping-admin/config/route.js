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
    const shoppings = await sql`
      SELECT * FROM shoppings WHERE owner_id = ${session.user.id} LIMIT 1
    `;
    if (shoppings.length === 0) {
      return NextResponse.json({ onboarding: true });
    }
    return NextResponse.json(shoppings[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { name, slug } = await req.json();
    if (!name || !slug) return NextResponse.json({ error: 'Nombre y Slug son requeridos' }, { status: 400 });

    const existing = await sql`SELECT id FROM shoppings WHERE slug = ${slug}`;
    if (existing.length > 0) return NextResponse.json({ error: 'El slug ya está en uso' }, { status: 409 });

    const shopping = await sql`
      INSERT INTO shoppings (name, slug, owner_id)
      VALUES (${name}, ${slug}, ${session.user.id})
      RETURNING *
    `;
    return NextResponse.json(shopping[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const {
      name, tagline, description, primary_color, secondary_color,
      font_family, hero_title, hero_subtitle, active
    } = await req.json();

    const existing = await sql`SELECT id FROM shoppings WHERE owner_id = ${session.user.id} LIMIT 1`;
    if (existing.length === 0) return NextResponse.json({ error: 'Shopping no encontrado' }, { status: 404 });
    const shoppingId = existing[0].id;

    const updated = await sql`
      UPDATE shoppings SET
        name = ${name ?? null},
        tagline = ${tagline ?? null},
        description = ${description ?? null},
        primary_color = ${primary_color ?? '#009aae'},
        secondary_color = ${secondary_color ?? '#ffffff'},
        font_family = ${font_family ?? 'Inter'},
        hero_title = ${hero_title ?? null},
        hero_subtitle = ${hero_subtitle ?? null},
        active = ${active !== undefined ? active : true},
        updated_at = NOW()
      WHERE id = ${shoppingId}
      RETURNING *
    `;
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
