import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const page  = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    const notifications = await sql`
      SELECT * FROM notifications
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [{ count }] = await sql`
      SELECT COUNT(*) FROM notifications WHERE user_id = ${session.user.id}
    `;
    const [{ unread }] = await sql`
      SELECT COUNT(*) as unread FROM notifications WHERE user_id = ${session.user.id} AND read = false
    `;

    return NextResponse.json({ notifications, total: Number(count), unread: Number(unread), page });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    await sql`UPDATE notifications SET read = true WHERE user_id = ${session.user.id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
