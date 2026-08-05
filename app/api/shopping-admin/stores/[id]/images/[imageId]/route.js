import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { del } from '@vercel/blob';
import sql from '@/lib/db';

async function checkShoppingAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'shopping_admin' && session.user.role !== 'superadmin')) return null;
  return session;
}

export async function DELETE(request, { params }) {
  const session = await checkShoppingAdmin();
  if (!session) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id, imageId } = params;
    const [existing] = await sql`
      SELECT s.id FROM stores s 
      JOIN shoppings sh ON sh.id = s.shopping_id 
      WHERE s.id = ${id} AND sh.owner_id = ${session.user.id}
    `;
    if (!existing) return NextResponse.json({ error: 'Tienda no encontrada o no pertenece a tu shopping' }, { status: 404 });

    const [img] = await sql`SELECT image_url FROM store_images WHERE id = ${imageId} AND store_id = ${id}`;
    if (!img) return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });

    try { await del(img.image_url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}

    await sql`DELETE FROM store_images WHERE id = ${imageId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
