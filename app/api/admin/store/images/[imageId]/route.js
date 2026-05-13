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

// Verifica que la imagen pertenece a la tienda del admin
async function checkOwnership(session, imageId) {
  const img = await sql`SELECT si.*, s.id as sid FROM store_images si JOIN stores s ON si.store_id = s.id WHERE si.id = ${imageId}`;
  if (img.length === 0) return null;
  if (session.user.role === 'admin' && img[0].store_id !== session.user.store_id) return null;
  return img[0];
}

export async function PUT(request, { params }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const img = await checkOwnership(session, params.imageId);
  if (!img) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  try {
    const { sort_order, caption } = await request.json();
    const updated = await sql`
      UPDATE store_images SET sort_order = ${sort_order}, caption = ${caption ?? null}
      WHERE id = ${params.imageId} RETURNING *
    `;
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const img = await checkOwnership(session, params.imageId);
  if (!img) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  try {
    await sql`DELETE FROM store_images WHERE id = ${params.imageId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
