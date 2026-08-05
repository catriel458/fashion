import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put, del } from '@vercel/blob';
import sql from '@/lib/db';

async function checkShoppingAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'shopping_admin' && session.user.role !== 'superadmin')) return null;
  return session;
}

export async function POST(request, { params }) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const [existing] = await sql`
      SELECT s.id, s.logo_url FROM stores s 
      JOIN shoppings sh ON sh.id = s.shopping_id 
      WHERE s.id = ${id} AND sh.owner_id = ${session.user.id}
    `;
    if (!existing) return NextResponse.json({ error: 'Tienda no encontrada o no pertenece a tu shopping' }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get('logo');
    if (!file || file.size === 0) return NextResponse.json({ error: 'Logo requerido' }, { status: 400 });

    const blob = await put(`stores/logos/${id}-${Date.now()}-${file.name}`, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const store = await sql`
      UPDATE stores SET logo_url = ${blob.url}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, slug, logo_url
    `;

    if (existing.logo_url && existing.logo_url !== blob.url) {
      try { await del(existing.logo_url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
    }

    return NextResponse.json(store[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const [existing] = await sql`
      SELECT s.id, s.logo_url FROM stores s 
      JOIN shoppings sh ON sh.id = s.shopping_id 
      WHERE s.id = ${id} AND sh.owner_id = ${session.user.id}
    `;
    if (!existing) return NextResponse.json({ error: 'Tienda no encontrada o no pertenece a tu shopping' }, { status: 404 });

    if (existing.logo_url) {
      try { await del(existing.logo_url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
    }

    const store = await sql`
      UPDATE stores SET logo_url = NULL, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, slug, logo_url
    `;
    return NextResponse.json(store[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
