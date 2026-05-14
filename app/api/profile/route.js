import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { username, email, first_name, last_name, birth_date } = await req.json();
    if (!username?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Username y email son requeridos' }, { status: 400 });
    }

    const conflict = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()} AND id != ${session.user.id}
    `;
    if (conflict.length > 0) {
      return NextResponse.json({ error: 'El email ya está en uso' }, { status: 409 });
    }

    const [user] = await sql`
      UPDATE users
      SET
        username   = ${username.trim()},
        email      = ${email.toLowerCase()},
        first_name = ${first_name?.trim() || null},
        last_name  = ${last_name?.trim() || null},
        birth_date = ${birth_date || null},
        updated_at = NOW()
      WHERE id = ${session.user.id}
      RETURNING id, username, email, role, avatar_url, first_name, last_name, birth_date
    `;
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    await sql`DELETE FROM users WHERE id = ${session.user.id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
