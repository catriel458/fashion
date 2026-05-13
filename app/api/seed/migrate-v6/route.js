import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT`;
    return NextResponse.json({ success: true, message: 'Migración v6 completada: image_url agregado a categories.' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
