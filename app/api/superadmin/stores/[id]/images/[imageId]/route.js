import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { del } from '@vercel/blob';
import sql from '@/lib/db';

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function PUT(request, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { imageId } = params;
    const { sort_order, caption } = await request.json();
    const img = await sql`
      UPDATE store_images SET sort_order = ${sort_order}, caption = ${caption ?? null}
      WHERE id = ${imageId} RETURNING *
    `;
    return NextResponse.json(img[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id, imageId } = params;
    const [img] = await sql`
      SELECT image_url FROM store_images WHERE id = ${imageId} AND store_id = ${id}
    `;
    if (!img) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    await sql`DELETE FROM store_images WHERE id = ${imageId} AND store_id = ${id}`;
    if (img.image_url) {
      try { await del(img.image_url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
