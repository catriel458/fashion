import { NextResponse } from 'next/server';
import sql from '@/lib/db';

const CATEGORIES = [
  { name: 'Remeras',    slug: 'remeras' },
  { name: 'Pantalones', slug: 'pantalones' },
  { name: 'Abrigos',    slug: 'abrigos' },
  { name: 'Camisas',    slug: 'camisas' },
  { name: 'Zapatillas', slug: 'zapatillas' },
  { name: 'Gorros',     slug: 'gorros' },
  { name: 'Accesorios', slug: 'accesorios' },
];

export async function POST() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        slug       VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id          SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        name        VARCHAR(255) NOT NULL,
        slug        VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        price       DECIMAL(10,2) NOT NULL,
        stock       INTEGER DEFAULT 0,
        image_url   TEXT,
        active      BOOLEAN DEFAULT true,
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS cart_items (
        id         SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity   INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_products_slug     ON products(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cart_session      ON cart_items(session_id)`;

    for (const cat of CATEGORIES) {
      await sql`
        INSERT INTO categories (name, slug)
        VALUES (${cat.name}, ${cat.slug})
        ON CONFLICT (slug) DO NOTHING
      `;
    }

    const categories = await sql`SELECT * FROM categories ORDER BY id`;

    return NextResponse.json({
      success: true,
      message: 'Base de datos inicializada correctamente',
      categories,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al inicializar la base de datos', details: error.message },
      { status: 500 }
    );
  }
}
