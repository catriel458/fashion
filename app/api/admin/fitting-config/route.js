import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminStoreId } from '@/lib/admin-store';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) return null;
  return session;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const storeId = await getAdminStoreId(session);
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  const [store] = await sql`
    SELECT fitting_plan, fitting_monthly_limit, fitting_used_this_month, fitting_daily_limit_per_user, fitting_month_reset_at
    FROM stores WHERE id = ${storeId}
  `;
  if (!store) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

  return NextResponse.json({
    store_id: storeId,
    plan: store.fitting_plan,
    monthly_limit: store.fitting_monthly_limit,
    used_this_month: store.fitting_used_this_month,
    daily_limit_per_user: store.fitting_daily_limit_per_user,
    reset_at: store.fitting_month_reset_at,
  });
}

export async function PATCH(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const storeId = await getAdminStoreId(session);
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  const body = await request.json();
  const dailyLimit = Number(body.daily_limit_per_user);

  if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 50) {
    return NextResponse.json({ error: 'daily_limit_per_user debe ser un entero entre 1 y 50' }, { status: 400 });
  }

  await sql`UPDATE stores SET fitting_daily_limit_per_user = ${dailyLimit} WHERE id = ${storeId}`;

  return NextResponse.json({ success: true, daily_limit_per_user: dailyLimit });
}
