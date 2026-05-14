import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const storeId = session.user.store_id;
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asociada' }, { status: 400 });

  try {
    const rows = await sql`SELECT * FROM birthday_discount_config WHERE store_id = ${storeId}`;
    if (rows.length === 0) {
      return NextResponse.json({ store_id: storeId, enabled: false, discount_percentage: 10, days_before: 0, days_after: 3 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const storeId = session.user.store_id;
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asociada' }, { status: 400 });

  try {
    const { enabled, discount_percentage, days_before, days_after } = await req.json();

    const [row] = await sql`
      INSERT INTO birthday_discount_config (store_id, enabled, discount_percentage, days_before, days_after)
      VALUES (${storeId}, ${enabled}, ${discount_percentage}, ${days_before}, ${days_after})
      ON CONFLICT (store_id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        discount_percentage = EXCLUDED.discount_percentage,
        days_before = EXCLUDED.days_before,
        days_after = EXCLUDED.days_after,
        updated_at = NOW()
      RETURNING *
    `;
    return NextResponse.json(row);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
