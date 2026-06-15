import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    await sql`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS level VARCHAR(20) DEFAULT 'explorador'
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS points_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        store_id INTEGER NOT NULL REFERENCES stores(id),
        points INTEGER NOT NULL,
        reason VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS saved_tryons (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        store_id INTEGER NOT NULL REFERENCES stores(id),
        result_image_url TEXT NOT NULL,
        garment_names TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS wishlist (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        store_id INTEGER NOT NULL REFERENCES stores(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_points_history_user ON points_history(user_id, created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_tryons_user ON saved_tryons(user_id, created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id)`;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
