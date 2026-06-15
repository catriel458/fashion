import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const storeId = Number(searchParams.get('store_id'));
  if (!storeId) return NextResponse.json({ error: 'STORE_NOT_FOUND' }, { status: 404 });

  const stores = await sql`
    SELECT fitting_daily_limit_per_user, fitting_monthly_limit, fitting_used_this_month
    FROM stores WHERE id = ${storeId}
  `;
  if (!stores.length) return NextResponse.json({ error: 'STORE_NOT_FOUND' }, { status: 404 });
  const store = stores[0];

  const userId = Number(session.user.id);
  const [{ count }] = await sql`
    SELECT COUNT(*) as count FROM fitting_room_usage
    WHERE user_id = ${userId} AND store_id = ${storeId} AND used_at > NOW() - INTERVAL '1 day'
  `;

  return NextResponse.json({
    daily_used: Number(count),
    daily_limit: store.fitting_daily_limit_per_user,
    monthly_remaining: store.fitting_monthly_limit - store.fitting_used_this_month,
  });
}
