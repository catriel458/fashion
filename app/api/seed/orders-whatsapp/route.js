import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20)`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS whatsapp_message_template TEXT`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS address TEXT`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS pickup_info TEXT`;

    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP DEFAULT NOW()`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_date TIMESTAMP`;

    await sql`
      CREATE TABLE IF NOT EXISTS store_hours (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL,
        is_open BOOLEAN DEFAULT true,
        open_time TIME,
        close_time TIME,
        UNIQUE(store_id, day_of_week)
      )
    `;

    await sql`
      INSERT INTO store_hours (store_id, day_of_week, is_open, open_time, close_time)
      SELECT s.id, d.day, true, '09:00', '18:00'
      FROM stores s
      CROSS JOIN (SELECT generate_series(0,6) AS day) d
      ON CONFLICT (store_id, day_of_week) DO NOTHING
    `;

    return NextResponse.json({ ok: true, message: 'Migración orders-whatsapp completada correctamente' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
