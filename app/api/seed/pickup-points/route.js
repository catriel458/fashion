import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS pickup_points (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        address TEXT,
        description TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_point_id INTEGER REFERENCES pickup_points(id)`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_point_name VARCHAR(200)`;
    return NextResponse.json({ ok: true, message: 'Migración pickup-points completada' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
