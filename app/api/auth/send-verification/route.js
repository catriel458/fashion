import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import sql from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { emailVerification } from '@/lib/email-templates';

export async function POST(req) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 });

    const users = await sql`SELECT id, email, username FROM users WHERE id = ${userId}`;
    if (users.length === 0) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    const user = users[0];

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO email_verification_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
      ON CONFLICT (token) DO NOTHING
    `;

    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;

    const { subject, html } = emailVerification({
      username: user.username,
      verificationUrl,
      storeName: null,
    });
    await sendMail({ to: user.email, subject, html });

    const devUrl = process.env.NODE_ENV !== 'production' ? verificationUrl : null;
    return NextResponse.json({ success: true, ...(devUrl && { devVerificationUrl: devUrl }) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
