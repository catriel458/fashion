import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/?error=invalid-token', req.url));
  }

  try {
    const tokens = await sql`
      SELECT * FROM email_verification_tokens
      WHERE token = ${token} AND used = false AND expires_at > NOW()
    `;

    if (tokens.length === 0) {
      return NextResponse.redirect(new URL('/?error=invalid-token', req.url));
    }

    const t = tokens[0];
    await sql`UPDATE users SET email_verified = true WHERE id = ${t.user_id}`;
    await sql`UPDATE email_verification_tokens SET used = true WHERE id = ${t.id}`;

    return NextResponse.redirect(new URL('/?verified=true', req.url));
  } catch {
    return NextResponse.redirect(new URL('/?error=invalid-token', req.url));
  }
}
