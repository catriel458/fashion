import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20)`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(20) DEFAULT 'pickup'`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,7)`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(10,7)`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(10,2) DEFAULT 0`;

    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(10,2) DEFAULT 0`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS delivery_radius_km DECIMAL(6,2) DEFAULT 5`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_lat DECIMAL(10,7)`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_lng DECIMAL(10,7)`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_address TEXT`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_city TEXT`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_province TEXT`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS delivery_whatsapp TEXT`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS contact_email TEXT`;

    await sql`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        full_address TEXT,
        street TEXT,
        number TEXT,
        floor_apt TEXT,
        city TEXT,
        province TEXT,
        postal_code TEXT,
        lat DECIMAL(10,7),
        lng DECIMAL(10,7),
        is_default BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    return NextResponse.json({ success: true, message: 'Migración v8: delivery, contact_email, user_addresses.' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
