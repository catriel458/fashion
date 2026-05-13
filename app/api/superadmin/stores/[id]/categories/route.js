import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

export async function GET(req, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const categories = await sql`
      SELECT * FROM categories WHERE store_id = ${params.id} ORDER BY name
    `;
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });

    const slug = slugify(name);
    const existing = await sql`SELECT id FROM categories WHERE store_id = ${params.id} AND slug = ${slug}`;
    if (existing.length > 0) return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 409 });

    const [cat] = await sql`
      INSERT INTO categories (name, slug, store_id)
      VALUES (${name.trim()}, ${slug}, ${params.id})
      RETURNING *
    `;
    return NextResponse.json(cat, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
