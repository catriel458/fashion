import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  try {
    const { result_image_url, store_id, garment_names } = await request.json();

    if (!result_image_url || typeof result_image_url !== 'string') {
      return NextResponse.json({ error: 'URL de imagen requerida' }, { status: 400 });
    }

    try {
      new URL(result_image_url);
    } catch {
      return NextResponse.json({ error: 'URL de imagen inválida' }, { status: 400 });
    }

    const rawStoreId = Number(store_id);
    if (!rawStoreId) {
      return NextResponse.json({ error: 'Tienda requerida' }, { status: 400 });
    }

    const [inserted] = await sql`
      INSERT INTO saved_tryons (user_id, store_id, result_image_url, garment_names)
      VALUES (${userId}, ${rawStoreId}, ${result_image_url}, ${garment_names || null})
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: inserted.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
