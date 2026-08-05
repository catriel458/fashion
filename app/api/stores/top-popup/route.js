import sql from '@/lib/db.js';

export const dynamic = 'force-dynamic';

async function ensureHotsaleColumns() {
  await Promise.all([
    sql`ALTER TABLE superadmin_config ADD COLUMN IF NOT EXISTS hotsale_enabled BOOLEAN DEFAULT false`.catch(() => {}),
    sql`ALTER TABLE superadmin_config ADD COLUMN IF NOT EXISTS hotsale_coupon_code VARCHAR(50)`.catch(() => {}),
    sql`ALTER TABLE superadmin_config ADD COLUMN IF NOT EXISTS hotsale_discount_percent INTEGER DEFAULT 0`.catch(() => {}),
    sql`ALTER TABLE superadmin_config ADD COLUMN IF NOT EXISTS hotsale_coupon_text TEXT`.catch(() => {}),
  ]);
}

export async function GET() {
  try {
    await ensureHotsaleColumns();

    const [config] = await sql`
      SELECT hotsale_enabled, hotsale_coupon_code, hotsale_discount_percent, hotsale_coupon_text
      FROM superadmin_config WHERE id = 1
    `;

    if (config && config.hotsale_enabled) {
      return Response.json({
        id: -999,
        name: 'HOT SALE',
        slug: 'hotsale',
        welcome_popup_discount: config.hotsale_discount_percent,
        primary_color: '#ff3333', // Hot Sale red
        is_hotsale: true,
        hotsale_coupon_code: config.hotsale_coupon_code,
        hotsale_coupon_text: config.hotsale_coupon_text,
      });
    }

    // Fallback: highest welcome discount store
    const rows = await sql`
      SELECT id, name, slug, welcome_popup_discount, primary_color
      FROM stores
      WHERE welcome_popup_enabled = true 
        AND (is_independent = false OR is_independent IS NULL)
        AND shopping_id IS NULL
      ORDER BY welcome_popup_discount DESC
      LIMIT 1
    `;
    if (!rows.length) {
      return Response.json(null, { status: 404 });
    }
    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
