import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS header_color VARCHAR(30)`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS footer_color VARCHAR(30)`;
    return NextResponse.json({ success: true, message: 'Migración v3 completada: header_color y footer_color agregados.' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
