import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS header_font        VARCHAR(100)`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS header_font_size   VARCHAR(20)`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS header_text_color  VARCHAR(30)`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS footer_font        VARCHAR(100)`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS footer_font_size   VARCHAR(20)`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS footer_text_color  VARCHAR(30)`;
    return NextResponse.json({ success: true, message: 'Migración v4 completada: tipografía de header y footer agregada.' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
