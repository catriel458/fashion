import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS accent_color     VARCHAR(7)   DEFAULT '#0f0f0f'`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS button_style     VARCHAR(20)  DEFAULT 'rounded'`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS hero_button_text VARCHAR(100) DEFAULT 'Ver colección'`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS hero_season      TEXT         DEFAULT 'Nueva temporada · 2025'`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS social_instagram TEXT`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS social_whatsapp  VARCHAR(30)`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS social_facebook  TEXT`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS contact_email    VARCHAR(255)`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS contact_phone    VARCHAR(50)`;
    return NextResponse.json({ success: true, message: 'Migración v2 completada.' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
