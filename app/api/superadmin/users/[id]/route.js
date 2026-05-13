import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function PUT(request, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const body = await request.json();
    const { username, email, password, role, store_id, active } = body;

    const existing = await sql`SELECT * FROM users WHERE id = ${id}`;
    if (existing.length === 0) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    const prev = existing[0];

    let hash = prev.password_hash;
    if (password) hash = await bcrypt.hash(password, 10);

    const user = await sql`
      UPDATE users SET
        username      = ${username  ?? prev.username},
        email         = ${email     ?? prev.email},
        password_hash = ${hash},
        role          = ${role      ?? prev.role},
        store_id      = ${store_id  !== undefined ? (store_id || null) : prev.store_id},
        active        = ${active    ?? prev.active}
      WHERE id = ${id}
      RETURNING id, username, email, role, store_id, active, created_at
    `;
    return NextResponse.json(user[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    if (String(session.user.id) === String(id)) return NextResponse.json({ error: 'No podés eliminarte a vos mismo' }, { status: 400 });
    await sql`DELETE FROM users WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
