import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  try {
    const rows = await sql`
      SELECT c.*, s.name as store_name
      FROM coupons c
      JOIN stores s ON s.id = c.store_id
      WHERE c.user_id = ${userId}
      ORDER BY c.expires_at DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
