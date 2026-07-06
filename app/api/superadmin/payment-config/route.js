import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) return null;
  return session;
}

async function ensureHotsaleColumns() {
  await Promise.all([
    sql`ALTER TABLE superadmin_config ADD COLUMN IF NOT EXISTS hotsale_enabled BOOLEAN DEFAULT false`.catch(() => {}),
    sql`ALTER TABLE superadmin_config ADD COLUMN IF NOT EXISTS hotsale_coupon_code VARCHAR(50)`.catch(() => {}),
    sql`ALTER TABLE superadmin_config ADD COLUMN IF NOT EXISTS hotsale_discount_percent INTEGER DEFAULT 0`.catch(() => {}),
    sql`ALTER TABLE superadmin_config ADD COLUMN IF NOT EXISTS hotsale_coupon_text TEXT`.catch(() => {}),
  ]);
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  try {
    await ensureHotsaleColumns();

    const [config] = await sql`
      SELECT mp_enabled, mp_access_token, transfer_enabled,
             transfer_cbu, transfer_alias, transfer_bank, transfer_holder,
             hotsale_enabled, hotsale_coupon_code, hotsale_discount_percent, hotsale_coupon_text
      FROM superadmin_config WHERE id = 1
    `;

    return NextResponse.json({
      mp_enabled:       config?.mp_enabled       ?? false,
      has_mp_token:     !!config?.mp_access_token,
      transfer_enabled: config?.transfer_enabled ?? false,
      transfer_cbu:     config?.transfer_cbu     || '',
      transfer_alias:   config?.transfer_alias   || '',
      transfer_bank:    config?.transfer_bank    || '',
      transfer_holder:  config?.transfer_holder  || '',
      hotsale_enabled:  config?.hotsale_enabled  ?? false,
      hotsale_coupon_code: config?.hotsale_coupon_code || '',
      hotsale_discount_percent: config?.hotsale_discount_percent ?? 0,
      hotsale_coupon_text: config?.hotsale_coupon_text || '',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  try {
    await ensureHotsaleColumns();

    const body = await req.json();
    const {
      mp_enabled,
      mp_access_token,
      transfer_enabled,
      transfer_cbu,
      transfer_alias,
      transfer_bank,
      transfer_holder,
      hotsale_enabled,
      hotsale_coupon_code,
      hotsale_discount_percent,
      hotsale_coupon_text,
    } = body;

    if (mp_access_token && mp_access_token.trim()) {
      await sql`
        UPDATE superadmin_config SET mp_access_token = ${encrypt(mp_access_token.trim())}
        WHERE id = 1
      `;
    }

    await sql`
      UPDATE superadmin_config SET
        mp_enabled               = ${mp_enabled               ?? false},
        transfer_enabled         = ${transfer_enabled         ?? false},
        transfer_cbu             = ${transfer_cbu             || null},
        transfer_alias           = ${transfer_alias           || null},
        transfer_bank            = ${transfer_bank            || null},
        transfer_holder          = ${transfer_holder          || null},
        hotsale_enabled          = ${hotsale_enabled          ?? false},
        hotsale_coupon_code      = ${hotsale_coupon_code      || null},
        hotsale_discount_percent = ${hotsale_discount_percent || 0},
        hotsale_coupon_text      = ${hotsale_coupon_text      || null},
        updated_at               = NOW()
      WHERE id = 1
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
