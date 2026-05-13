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

export async function PUT(req, { params }) {
  const adminSession = await requireAdmin();
  if (!adminSession) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const storeId = adminSession.user.store_id;
  try {
    const { id } = params;
    const body = await req.json();
    const { username, email, role, active, password } = body;

    const [existing] = await sql`SELECT * FROM users WHERE id = ${id} AND store_id = ${storeId}`;
    if (!existing) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const updates = {
      username: username ?? existing.username,
      email: email ?? existing.email,
      role: role ?? existing.role,
      active: active !== undefined ? active : existing.active,
      updated_at: new Date(),
    };

    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10);
      const [user] = await sql`
        UPDATE users SET username = ${updates.username}, email = ${updates.email},
          role = ${updates.role}, active = ${updates.active},
          password_hash = ${updates.password_hash}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, username, email, role, avatar_url, active, created_at
      `;
      return NextResponse.json(user);
    }

    const [user] = await sql`
      UPDATE users SET username = ${updates.username}, email = ${updates.email},
        role = ${updates.role}, active = ${updates.active}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, username, email, role, avatar_url, active, created_at
    `;
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const adminSession = await requireAdmin();
  if (!adminSession) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const storeId = adminSession.user.store_id;
  try {
    const { id } = params;
    if (String(id) === String(adminSession.user.id)) {
      return NextResponse.json({ error: 'No podés eliminar tu propia cuenta' }, { status: 400 });
    }
    await sql`DELETE FROM users WHERE id = ${id} AND store_id = ${storeId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
