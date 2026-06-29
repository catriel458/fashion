import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { referralWelcomeCoupon } from '@/lib/email-templates';

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

    try {
      // Buscar si el usuario tiene referral_store_id y obtener sus datos
      const [user] = await sql`
        SELECT id, username, email, referral_store_id FROM users WHERE id = ${t.user_id}
      `;

      if (user && user.referral_store_id) {
        const [store] = await sql`
          SELECT id, name, slug, welcome_popup_enabled, welcome_popup_discount
          FROM stores WHERE id = ${user.referral_store_id}
        `;

        if (store && store.welcome_popup_enabled) {
          // Generar código de cupón único
          const codigo = 'BIENVENIDO-' + Math.random().toString(36).substring(2, 8).toUpperCase();

          const vencimiento = new Date();
          vencimiento.setDate(vencimiento.getDate() + 30);

          // Insertar en la tabla coupons
          await sql`
            INSERT INTO coupons (code, user_id, store_id, type, discount_percentage, expires_at)
            VALUES (${codigo}, ${user.id}, ${store.id}, 'welcome', ${store.welcome_popup_discount}, ${vencimiento})
          `;

          // Generar y enviar email con el cupón
          const { subject, html } = referralWelcomeCoupon({
            username: user.username,
            couponCode: codigo,
            discountPercentage: store.welcome_popup_discount,
            storeName: store.name,
            storeSlug: store.slug,
            expiresAt: vencimiento,
          });

          await sendMail({ to: user.email, subject, html });
        }
      }
    } catch (e) {
      // No bloquear la redirección principal si falla el envío de mail o la creación de cupones
      console.error('Error al generar cupón o enviar mail de bienvenida:', e);
    }

    return NextResponse.redirect(new URL('/auth/refresh?verified=true', req.url));
  } catch (error) {
    return NextResponse.redirect(new URL('/?error=invalid-token', req.url));
  }
}
