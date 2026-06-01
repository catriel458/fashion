import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminStoreId } from '@/lib/admin-store';
import sql from '@/lib/db';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) return null;
  return session;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const storeId = await getAdminStoreId(session);
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    const [store] = await sql`
      SELECT mp_enabled, mp_test_mode, mp_public_key, mp_access_token,
             transfer_enabled, transfer_cbu, transfer_alias, transfer_bank, transfer_holder
      FROM stores WHERE id = ${storeId}
    `;
    if (!store) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

    return NextResponse.json({
      mp_enabled:       store.mp_enabled       ?? false,
      mp_test_mode:     store.mp_test_mode     ?? true,
      mp_public_key:    store.mp_public_key    || '',
      has_mp_token:     !!store.mp_access_token,
      system_test_mode: process.env.MP_TEST_MODE === 'true',
      transfer_enabled: store.transfer_enabled ?? false,
      transfer_cbu:     store.transfer_cbu     || '',
      transfer_alias:   store.transfer_alias   || '',
      transfer_bank:    store.transfer_bank    || '',
      transfer_holder:  store.transfer_holder  || '',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const storeId = await getAdminStoreId(session);
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    const body = await req.json();
    const {
      mp_enabled,
      mp_access_token,
      mp_public_key,
      transfer_enabled,
      transfer_cbu,
      transfer_alias,
      transfer_bank,
      transfer_holder,
    } = body;

    const [current] = await sql`SELECT mp_access_token FROM stores WHERE id = ${storeId}`;
    let encryptedToken = current?.mp_access_token || null;
    if (mp_access_token && mp_access_token.trim()) {
      encryptedToken = encrypt(mp_access_token.trim());
    }

    await sql`
      UPDATE stores SET
        mp_enabled       = ${mp_enabled       ?? false},
        mp_public_key    = ${mp_public_key    || null},
        mp_access_token  = ${encryptedToken},
        transfer_enabled = ${transfer_enabled ?? false},
        transfer_cbu     = ${transfer_cbu     || null},
        transfer_alias   = ${transfer_alias   || null},
        transfer_bank    = ${transfer_bank    || null},
        transfer_holder  = ${transfer_holder  || null},
        updated_at       = NOW()
      WHERE id = ${storeId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
