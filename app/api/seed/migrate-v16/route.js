import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    await sql`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS colors TEXT
    `;

    await sql`
      ALTER TABLE cart_items
        ADD COLUMN IF NOT EXISTS color VARCHAR(50)
    `;

    await sql`
      ALTER TABLE order_items
        ADD COLUMN IF NOT EXISTS color VARCHAR(50)
    `;

    return NextResponse.json({ ok: true, message: 'Migración v16 completada: columnas de color agregadas.' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
