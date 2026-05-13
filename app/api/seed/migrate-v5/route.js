import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS panel_bg_color   VARCHAR(30) DEFAULT '#fafaf8'`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS panel_text_color VARCHAR(30) DEFAULT '#0f0f0f'`;
    return NextResponse.json({ success: true, message: 'Migración v5 completada: panel_bg_color y panel_text_color agregados.' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
