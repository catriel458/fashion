import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { randomUUID } from 'crypto';
import { sendMail } from '@/lib/mailer';
import { emailVerification } from '@/lib/email-templates';
import { createNotification } from '@/lib/notify';

export async function POST(req) {
  try {
    const { username, email, password } = await req.json();
    if (!username?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await sql`
      INSERT INTO users (username, email, password_hash, role, email_verified)
      VALUES (${username.trim()}, ${email.toLowerCase()}, ${passwordHash}, 'visitor', false)
      RETURNING id, username, email, role
    `;

    // Enviar verificación de email (no bloquea el registro si falla)
    try {
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await sql`
        INSERT INTO email_verification_tokens (user_id, token, expires_at)
        VALUES (${user.id}, ${token}, ${expiresAt})
      `;
      const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;
      const { subject, html } = emailVerification({ username: user.username, verificationUrl, storeName: null });
      await sendMail({ to: user.email, subject, html });
    } catch {
      // El registro continúa aunque falle el mail
    }

    // Notificación al admin de la tienda si el usuario tiene store_id
    try {
      if (user.store_id) {
        const [admin] = await sql`SELECT id FROM users WHERE store_id = ${user.store_id} AND role = 'admin' LIMIT 1`;
        if (admin) {
          await createNotification({
            userId:  admin.id,
            storeId: user.store_id,
            type:    'new_user',
            title:   'Nuevo usuario registrado',
            message: `${user.username} se registró en tu tienda`,
            link:    '/admin/users',
          });
        }
      }
    } catch {}

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
