import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) return null;
  return session;
}

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const storeId = session.user.store_id;
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    const formData = await request.formData();
    const file = formData.get('logo');
    if (!file || file.size === 0) return NextResponse.json({ error: 'Logo requerido' }, { status: 400 });

    const blob = await put(`stores/logos/${storeId}-${Date.now()}-${file.name}`, file, {
      access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const store = await sql`
      UPDATE stores SET logo_url = ${blob.url}, updated_at = NOW()
      WHERE id = ${storeId}
      RETURNING id, name, logo_url
    `;
    return NextResponse.json(store[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const storeId = session.user.store_id;
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    await sql`UPDATE stores SET logo_url = NULL, updated_at = NOW() WHERE id = ${storeId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
