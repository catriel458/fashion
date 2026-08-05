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

export async function POST(request) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const [shopping] = await sql`SELECT id, logo_url FROM shoppings WHERE owner_id = ${session.user.id} LIMIT 1`;
    if (!shopping) return NextResponse.json({ error: 'Shopping no encontrado' }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get('logo');
    if (!file || file.size === 0) return NextResponse.json({ error: 'Logo requerido' }, { status: 400 });

    const blob = await put(`shoppings/logos/${shopping.id}-${Date.now()}-${file.name}`, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const updated = await sql`
      UPDATE shoppings SET logo_url = ${blob.url}, updated_at = NOW()
      WHERE id = ${shopping.id}
      RETURNING id, name, slug, logo_url
    `;

    if (shopping.logo_url) {
      try { await del(shopping.logo_url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const [shopping] = await sql`SELECT id, logo_url FROM shoppings WHERE owner_id = ${session.user.id} LIMIT 1`;
    if (!shopping) return NextResponse.json({ error: 'Shopping no encontrado' }, { status: 404 });

    if (shopping.logo_url) {
      try { await del(shopping.logo_url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
    }

    const updated = await sql`
      UPDATE shoppings SET logo_url = NULL, updated_at = NOW()
      WHERE id = ${shopping.id}
      RETURNING id, name, slug, logo_url
    `;
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
