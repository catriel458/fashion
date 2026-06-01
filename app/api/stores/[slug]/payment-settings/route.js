import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const [store] = await sql`
      SELECT transfer_enabled, transfer_cbu, transfer_alias, transfer_bank, transfer_holder, mp_enabled
      FROM stores WHERE slug = ${params.slug} AND active = true
    `.catch(() => []);

    if (!store) {
      return NextResponse.json({ transfer_enabled: false, mp_enabled: false, not_configured: true });
    }

    return NextResponse.json({
      transfer_enabled: store.transfer_enabled ?? false,
      transfer_cbu:     store.transfer_cbu     || '',
      transfer_alias:   store.transfer_alias   || '',
      transfer_bank:    store.transfer_bank    || '',
      transfer_holder:  store.transfer_holder  || '',
      mp_enabled:       store.mp_enabled       ?? false,
    });
  } catch (error) {
    // Columnas no existen aún (pre-migración) — no bloquear el checkout
    return NextResponse.json({ transfer_enabled: false, mp_enabled: false, not_configured: true });
  }
}
