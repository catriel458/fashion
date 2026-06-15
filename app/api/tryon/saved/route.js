import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  try {
    const { searchParams } = new URL(request.url);
    const storeIdStr = searchParams.get('store_id');
    const storeId = storeIdStr ? Number(storeIdStr) : null;

    const rows = await sql`
      SELECT st.*, s.name as store_name
      FROM saved_tryons st
      JOIN stores s ON s.id = st.store_id
      WHERE st.user_id = ${userId}
        AND (${storeId}::int IS NULL OR st.store_id = ${storeId}::int)
      ORDER BY st.created_at DESC
      LIMIT 20
    `;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  try {
    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get('id');
    if (!idStr) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    const id = Number(idStr);

    await sql`
      DELETE FROM saved_tryons WHERE id = ${id} AND user_id = ${userId}
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
