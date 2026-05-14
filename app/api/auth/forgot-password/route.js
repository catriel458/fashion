import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import sql from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { passwordReset } from '@/lib/email-templates';

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const users = await sql`SELECT id, email, username FROM users WHERE email = ${email.toLowerCase()}`;

    let devResetUrl = null;

    if (users.length > 0) {
      const user = users[0];
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await sql`
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (${user.id}, ${token}, ${expiresAt})
      `;

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
      devResetUrl = process.env.NODE_ENV !== 'production' ? resetUrl : null;

      try {
        const { subject, html } = passwordReset({ username: user.username, resetUrl });
        await sendMail({ to: user.email, subject, html });
      } catch {
        // El token se guardó — el mail falló (ej: proxy corporativo bloquea SMTP)
        // En dev, devResetUrl permite probar el flujo igualmente
      }
    }

    return NextResponse.json({ success: true, ...(devResetUrl && { devResetUrl }) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
