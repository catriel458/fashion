import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') return null;
  return session;
}

export async function GET(req) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role   = searchParams.get('role');
  const search = searchParams.get('search');

  try {
    let users;
    if (role && search) {
      users = await sql`
        SELECT id, username, email, role, avatar_url, active, created_at
        FROM users
        WHERE role = ${role}
          AND (username ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'})
        ORDER BY created_at DESC
      `;
    } else if (role) {
      users = await sql`
        SELECT id, username, email, role, avatar_url, active, created_at
        FROM users WHERE role = ${role} ORDER BY created_at DESC
      `;
    } else if (search) {
      users = await sql`
        SELECT id, username, email, role, avatar_url, active, created_at
        FROM users
        WHERE username ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'}
        ORDER BY created_at DESC
      `;
    } else {
      users = await sql`
        SELECT id, username, email, role, avatar_url, active, created_at
        FROM users ORDER BY created_at DESC
      `;
    }
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { username, email, password, role } = await req.json();
    if (!username?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await sql`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (${username.trim()}, ${email.toLowerCase()}, ${passwordHash}, ${role || 'visitor'})
      RETURNING id, username, email, role, active, created_at
    `;
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
