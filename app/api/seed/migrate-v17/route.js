import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await sql`
      ALTER TABLE stores
        ADD COLUMN IF NOT EXISTS is_independent BOOLEAN DEFAULT false
    `;

    return NextResponse.json({ ok: true, message: 'Migración v17 completada: columna is_independent agregada a stores.' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
