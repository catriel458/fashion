import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    // 1. Crear tabla api_clients
    await sql`
      CREATE TABLE IF NOT EXISTS api_clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        plan VARCHAR(50) NOT NULL DEFAULT 'starter',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 2. Crear tabla api_keys
    await sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES api_clients(id) ON DELETE CASCADE,
        key_hash VARCHAR(255) NOT NULL,
        key_preview VARCHAR(20) NOT NULL,
        name VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        requests_this_month INTEGER DEFAULT 0,
        monthly_limit INTEGER DEFAULT 100,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 3. Crear tabla api_requests_log
    await sql`
      CREATE TABLE IF NOT EXISTS api_requests_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
        client_id UUID REFERENCES api_clients(id) ON DELETE SET NULL,
        endpoint VARCHAR(255),
        garments_count INTEGER,
        status VARCHAR(50),
        processing_time_ms INTEGER,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    return NextResponse.json({ ok: true, message: "Tablas B2B creadas correctamente" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
