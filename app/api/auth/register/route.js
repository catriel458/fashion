import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { randomUUID } from 'crypto';
import { sendMail } from '@/lib/mailer';
import { welcomeVerification, welcomeCoupon } from '@/lib/email-templates';
import { createNotification } from '@/lib/notify';
import { addPoints } from '@/lib/points';

export async function POST(req) {
  try {
    const { username, email, password, referralStoreId } = await req.json();
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

    if (referralStoreId) {
      await sql`
        UPDATE users SET referral_store_id = ${referralStoreId}
        WHERE id = ${user.id}
      `;
    }

    // Enviar verificación de email (no bloquea el registro si falla)
    try {
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await sql`
        INSERT INTO email_verification_tokens (user_id, token, expires_at)
        VALUES (${user.id}, ${token}, ${expiresAt})
      `;
      const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;
      const { subject, html } = welcomeVerification({ username: user.username, verificationUrl });
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

    // Generar cupones de bienvenida para tiendas activas
    try {
      const activeStores = await sql`SELECT id, name FROM stores WHERE plan_status = 'active'`;
      if (activeStores.length > 0) {
        for (const store of activeStores) {
          const couponCode = `BIENVENIDA-${user.id}-${store.id}`;
          await sql`
            INSERT INTO coupons (code, user_id, store_id, type, discount_percentage, expires_at)
            VALUES (${couponCode}, ${user.id}, ${store.id}, 'welcome', 10, NOW() + INTERVAL '30 days')
            ON CONFLICT DO NOTHING
          `;
        }

        const primaryStore = activeStores[0];
        const primaryCouponCode = `BIENVENIDA-${user.id}-${primaryStore.id}`;

        // Crear notificación para el usuario
        await createNotification({
          userId: user.id,
          storeId: primaryStore.id,
          type: 'welcome_coupon',
          title: 'Tenes un cupon de bienvenida!',
          message: `Usa el codigo ${primaryCouponCode} para obtener 10% de descuento en tu primera compra. Valido por 30 dias.`,
          link: '/profile/benefits',
        });

        // Agregar puntos de bienvenida (5 pts)
        await addPoints(user.id, primaryStore.id, 'welcome');

        // Enviar email de bienvenida con cupón
        const emailTpl = welcomeCoupon({
          username: user.username,
          couponCode: primaryCouponCode,
          storeName: primaryStore.name,
        });
        await sendMail({
          to: user.email,
          subject: emailTpl.subject,
          html: emailTpl.html,
        });
      }
    } catch (err) {
      // No bloquear el registro si falla el flujo de cupones de bienvenida
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

