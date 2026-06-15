import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS fitting_plan VARCHAR(20) DEFAULT 'starter'`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS fitting_monthly_limit INTEGER DEFAULT 100`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS fitting_used_this_month INTEGER DEFAULT 0`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS fitting_daily_limit_per_user INTEGER DEFAULT 5`;
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS fitting_month_reset_at TIMESTAMPTZ DEFAULT NOW()`;

    await sql`
      CREATE TABLE IF NOT EXISTS fitting_room_usage (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        used_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_fitting_usage_store_date ON fitting_room_usage(store_id, used_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_fitting_usage_user_date ON fitting_room_usage(user_id, used_at)`;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
