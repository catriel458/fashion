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
    const { imageId } = params;
    const [shopping] = await sql`SELECT id FROM shoppings WHERE owner_id = ${session.user.id} LIMIT 1`;
    if (!shopping) return NextResponse.json({ error: 'Shopping no encontrado' }, { status: 404 });

    const [img] = await sql`
      SELECT image_url FROM shopping_images 
      WHERE id = ${imageId} AND shopping_id = ${shopping.id}
    `;
    if (!img) return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });

    try {
      await del(img.image_url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch {}

    await sql`DELETE FROM shopping_images WHERE id = ${imageId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
