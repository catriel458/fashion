export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const results = [];

  async function run(name, fn) {
    try { await fn(); results.push({ ok: true, name }); }
    catch (e) { results.push({ ok: false, name, error: e.message }); }
  }

  await run('email_verification_tokens', () => sql`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token      VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      used       BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('password_reset_tokens', () => sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token      VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      used       BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('users.email_verified', () => sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false
  `);

  await run('users.first_name', () => sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)
  `);

  await run('users.last_name', () => sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)
  `);

  await run('users.birth_date', () => sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE
  `);

  await run('notifications', () => sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      store_id   INTEGER REFERENCES stores(id) ON DELETE CASCADE,
      type       VARCHAR(50) NOT NULL,
      title      VARCHAR(255) NOT NULL,
      message    TEXT NOT NULL,
      read       BOOLEAN DEFAULT false,
      link       TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('birthday_discount_config', () => sql`
    CREATE TABLE IF NOT EXISTS birthday_discount_config (
      id                  SERIAL PRIMARY KEY,
      store_id            INTEGER REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
      enabled             BOOLEAN DEFAULT false,
      discount_percentage INTEGER DEFAULT 10,
      days_before         INTEGER DEFAULT 0,
      days_after          INTEGER DEFAULT 3,
      created_at          TIMESTAMP DEFAULT NOW(),
      updated_at          TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('coupons', () => sql`
    CREATE TABLE IF NOT EXISTS coupons (
      id                  SERIAL PRIMARY KEY,
      code                VARCHAR(50) NOT NULL UNIQUE,
      user_id             INTEGER REFERENCES users(id) ON DELETE CASCADE,
      store_id            INTEGER REFERENCES stores(id) ON DELETE CASCADE,
      type                VARCHAR(50) DEFAULT 'birthday',
      discount_percentage INTEGER NOT NULL,
      used                BOOLEAN DEFAULT false,
      expires_at          TIMESTAMP NOT NULL,
      created_at          TIMESTAMP DEFAULT NOW()
    )
  `);

  const errors = results.filter(r => !r.ok);
  return NextResponse.json({
    success: errors.length === 0,
    results,
  });
}
