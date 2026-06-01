import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS mp_access_token TEXT`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS mp_public_key TEXT`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS mp_test_mode BOOLEAN DEFAULT true`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS mp_enabled BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS transfer_enabled BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS transfer_cbu TEXT`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS transfer_alias TEXT`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS transfer_bank TEXT`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS transfer_holder TEXT`;
    return NextResponse.json({ success: true, message: 'Migración v7 completada: columnas de métodos de pago agregadas a stores.' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
