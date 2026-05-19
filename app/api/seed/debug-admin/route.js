import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    const admins = await sql`
      SELECT u.id, u.username, u.email, u.role, u.store_id, s.name AS store_name, s.slug AS store_slug
      FROM users u
      LEFT JOIN stores s ON s.id = u.store_id
      WHERE u.role = 'admin'
      ORDER BY u.id
    `;

    const stores = await sql`SELECT id, name, slug, active FROM stores ORDER BY id`;

    return NextResponse.json({
      session_user: session?.user || null,
      admins,
      stores,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
