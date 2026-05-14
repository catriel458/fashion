import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { birthdayCoupon } from '@/lib/email-templates';
import { createNotification } from '@/lib/notify';

function randomCode(len = 4) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function GET(req) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const configs = await sql`SELECT * FROM birthday_discount_config WHERE enabled = true`;
    let processed = 0;

    for (const config of configs) {
      const users = await sql`
        SELECT u.id, u.email, u.username, u.birth_date, u.store_id
        FROM users u
        WHERE u.store_id = ${config.store_id}
          AND u.birth_date IS NOT NULL
          AND EXTRACT(MONTH FROM u.birth_date) = EXTRACT(MONTH FROM NOW() + INTERVAL '1 day' * ${config.days_before})
          AND EXTRACT(DAY   FROM u.birth_date) = EXTRACT(DAY   FROM NOW() + INTERVAL '1 day' * ${config.days_before})
          AND u.id NOT IN (
            SELECT user_id FROM coupons
            WHERE store_id = ${config.store_id}
              AND type = 'birthday'
              AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
          )
      `;

      const store = await sql`SELECT name FROM stores WHERE id = ${config.store_id}`;
      const storeName = store[0]?.name || 'CnB';

      for (const user of users) {
        const code = `BDAY-${user.id}-${new Date().getFullYear()}-${randomCode()}`;
        const expiresAt = new Date(Date.now() + (config.days_after + 1) * 24 * 60 * 60 * 1000);

        await sql`
          INSERT INTO coupons (code, user_id, store_id, type, discount_percentage, expires_at)
          VALUES (${code}, ${user.id}, ${config.store_id}, 'birthday', ${config.discount_percentage}, ${expiresAt})
          ON CONFLICT (code) DO NOTHING
        `;

        const { subject, html } = birthdayCoupon({
          username: user.username,
          couponCode: code,
          discountPercentage: config.discount_percentage,
          storeName,
          expiresAt,
        });
        await sendMail({ to: user.email, subject, html });

        await createNotification({
          userId: user.id,
          storeId: config.store_id,
          type: 'birthday_coupon',
          title: `¡Feliz cumpleaños! Tenés ${config.discount_percentage}% de descuento`,
          message: `Tu cupón: ${code} — válido hasta ${expiresAt.toLocaleDateString('es-AR')} en ${storeName}`,
          link: null,
        });

        processed++;
      }
    }

    return NextResponse.json({ success: true, processed });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
