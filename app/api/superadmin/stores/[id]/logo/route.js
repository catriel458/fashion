import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put, del } from '@vercel/blob';
import sql from '@/lib/db';

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function POST(request, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const formData = await request.formData();
    const file = formData.get('logo');

    if (!file || file.size === 0) return NextResponse.json({ error: 'Logo requerido' }, { status: 400 });

    const [prev] = await sql`SELECT logo_url FROM stores WHERE id = ${id}`;

    const blob = await put(`stores/logos/${id}-${Date.now()}-${file.name}`, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const store = await sql`
      UPDATE stores SET logo_url = ${blob.url}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, slug, logo_url
    `;

    if (prev?.logo_url && prev.logo_url !== blob.url) {
      try { await del(prev.logo_url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
    }

    return NextResponse.json(store[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const [prev] = await sql`SELECT logo_url FROM stores WHERE id = ${id}`;
    const store = await sql`
      UPDATE stores SET logo_url = NULL, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, slug
    `;
    if (prev?.logo_url) {
      try { await del(prev.logo_url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
    }
    return NextResponse.json(store[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
