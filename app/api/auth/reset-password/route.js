import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';

export async function POST(req) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token y contraseña son requeridos' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const tokens = await sql`
      SELECT * FROM password_reset_tokens
      WHERE token = ${token} AND used = false AND expires_at > NOW()
    `;

    if (tokens.length === 0) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 });
    }

    const t = tokens[0];
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${t.user_id}`;
    await sql`UPDATE password_reset_tokens SET used = true WHERE id = ${t.id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
