import { NextResponse } from 'next/server';
import crypto from 'crypto';
import sql from '@/lib/db';

export async function GET() {
  try {
    // 1. Crear cliente Demo en api_clients si no existe
    let clientId;
    const clients = await sql`SELECT id FROM api_clients WHERE email = 'demo@tnb.com'`;
    if (clients.length === 0) {
      const newClients = await sql`
        INSERT INTO api_clients (name, email, plan)
        VALUES ('Demo Client', 'demo@tnb.com', 'starter')
        RETURNING id
      `;
      clientId = newClients[0].id;
    } else {
      clientId = clients[0].id;
    }

    // 2. Hashear la API key de demostración
    const rawDemoKey = 'tnb_demo_xxxxxxxxxxxxxxxxxxxx';
    const keyHash = crypto.createHash('sha256').update(rawDemoKey).digest('hex');
    const keyPreview = 'tnb_demo_xxxx...xxxx';

    // 3. Insertar la clave de pruebas en api_keys si no existe
    const keys = await sql`SELECT id FROM api_keys WHERE key_hash = ${keyHash}`;
    if (keys.length === 0) {
      await sql`
        INSERT INTO api_keys (client_id, key_hash, key_preview, name, monthly_limit)
        VALUES (${clientId}, ${keyHash}, ${keyPreview}, 'Demo Key', 100)
      `;
    } else {
      // Resetear uso mensual para que el rate limit no impida probar la demo
      await sql`
        UPDATE api_keys
        SET requests_this_month = 0
        WHERE key_hash = ${keyHash}
      `;
    }

    return NextResponse.json({ ok: true, message: "Usuario Demo y clave creados correctamente" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
