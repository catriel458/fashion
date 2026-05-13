import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Expandir el CHECK constraint de roles para incluir superadmin
    const constraints = await sql`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'users'::regclass AND contype = 'c' AND conname LIKE '%role%'
    `;
    for (const c of constraints) {
      await sql.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS "${c.conname}"`);
    }
    await sql`
      ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN ('visitor', 'admin', 'superadmin'))
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        tagline TEXT,
        logo_url TEXT,
        active BOOLEAN DEFAULT true,
        primary_color VARCHAR(7) DEFAULT '#009aae',
        secondary_color VARCHAR(7) DEFAULT '#ffffff',
        font_family VARCHAR(100) DEFAULT 'Inter',
        hero_title TEXT,
        hero_subtitle TEXT,
        about_text TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS store_images (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        caption TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`ALTER TABLE products   ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id)`;
    await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id)`;
    await sql`ALTER TABLE orders     ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id)`;
    await sql`ALTER TABLE users      ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id)`;
    await sql`ALTER TABLE users      ADD COLUMN IF NOT EXISTS height INTEGER`;
    await sql`ALTER TABLE users      ADD COLUMN IF NOT EXISTS weight INTEGER`;

    await sql`
      INSERT INTO stores (name, slug, tagline, primary_color, font_family, hero_title, hero_subtitle)
      VALUES ('Zara', 'zara', 'Moda para todos', '#000000', 'Inter', 'Zara', 'Moda contemporánea para cada ocasión')
      ON CONFLICT (slug) DO NOTHING
    `;

    await sql`UPDATE products   SET store_id = (SELECT id FROM stores WHERE slug = 'zara') WHERE store_id IS NULL`;
    await sql`UPDATE categories SET store_id = (SELECT id FROM stores WHERE slug = 'zara') WHERE store_id IS NULL`;
    await sql`UPDATE orders     SET store_id = (SELECT id FROM stores WHERE slug = 'zara') WHERE store_id IS NULL`;

    const existing = await sql`SELECT id FROM users WHERE role = 'superadmin' LIMIT 1`;
    if (existing.length === 0) {
      const hash = await bcrypt.hash('superadmin123', 10);
      await sql`
        INSERT INTO users (username, email, password_hash, role)
        VALUES ('superadmin', 'super@admin.com', ${hash}, 'superadmin')
        ON CONFLICT (email) DO UPDATE SET role = 'superadmin', password_hash = ${hash}
      `;
    } else {
      const hash = await bcrypt.hash('superadmin123', 10);
      await sql`UPDATE users SET password_hash = ${hash} WHERE role = 'superadmin'`;
    }

    return NextResponse.json({
      success: true,
      message: 'Migración multi-tenant completada. Superadmin: super@admin.com / superadmin123',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
