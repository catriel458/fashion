import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function GET() {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const stores = await sql`
      SELECT s.*,
        COUNT(DISTINCT p.id)::int AS product_count,
        (SELECT u.username FROM users u WHERE u.store_id = s.id AND u.role = 'admin' LIMIT 1) AS admin_name
      FROM stores s
      LEFT JOIN products p ON p.store_id = s.id
      GROUP BY s.id
      ORDER BY s.name
    `;
    return NextResponse.json(stores);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const body = await req.json();
    const { name, tagline, primary_color, secondary_color, font_family, hero_title, hero_subtitle, about_text } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });

    const slug = slugify(name);

    const store = await sql`
      INSERT INTO stores (name, slug, tagline, primary_color, secondary_color, font_family, hero_title, hero_subtitle, about_text)
      VALUES (
        ${name.trim()},
        ${slug},
        ${tagline || null},
        ${primary_color || '#009aae'},
        ${secondary_color || '#ffffff'},
        ${font_family || 'Inter'},
        ${hero_title || null},
        ${hero_subtitle || null},
        ${about_text || null}
      )
      RETURNING *
    `;
    return NextResponse.json(store[0], { status: 201 });
  } catch (error) {
    if (error.message.includes('unique')) return NextResponse.json({ error: 'Ya existe una tienda con ese nombre/slug' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
