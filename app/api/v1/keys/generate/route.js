import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export async function POST(request) {
  try {
    // Validar permisos de superadministrador
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Cuerpo de solicitud JSON inválido' }, { status: 400 });
    }

    const { clientId, name, plan } = body;
    const selectedPlan = plan || 'starter';

    let clientUuid = clientId;

    // Si no se provee un cliente, se crea de forma automática para facilitar pruebas
    if (!clientUuid) {
      const email = body.email || `api-merchant-${crypto.randomBytes(4).toString('hex')}@cnb.com`;
      const clientName = name || 'Mercante API Autogenerado';

      const newClients = await sql`
        INSERT INTO api_clients (name, email, plan)
        VALUES (${clientName}, ${email}, ${selectedPlan})
        RETURNING id
      `;
      clientUuid = newClients[0].id;
    } else {
      const clients = await sql`SELECT id FROM api_clients WHERE id = ${clientUuid}`;
      if (clients.length === 0) {
        return NextResponse.json({ error: 'El clientId especificado no existe.' }, { status: 404 });
      }
    }

    // Límite mensual por plan
    let monthlyLimit = 100;
    if (selectedPlan === 'pro') {
      monthlyLimit = 5000;
    } else if (selectedPlan === 'business') {
      monthlyLimit = 999999;
    }

    // Generación de key cnb_live_ + 32 caracteres hex
    const randomHex = crypto.randomBytes(16).toString('hex'); // 16 bytes = 32 caracteres hex
    const rawKey = `cnb_live_${randomHex}`;

    // Hashear con SHA-256 para persistencia segura
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    // Muestra abreviada de control
    const keyPreview = `cnb_live_${randomHex.substring(0, 4)}...${randomHex.substring(28)}`;

    const keyName = name || `API Key ${selectedPlan.toUpperCase()}`;

    // Insertar key en la tabla
    const newKeys = await sql`
      INSERT INTO api_keys (client_id, key_hash, key_preview, name, monthly_limit)
      VALUES (${clientUuid}, ${keyHash}, ${keyPreview}, ${keyName}, ${monthlyLimit})
      RETURNING id, key_preview, monthly_limit, created_at
    `;

    // RETORNO DE CLAVE EN TEXTO PLANO UNA ÚNICA VEZ
    // La clave rawKey se muestra solo en esta respuesta. No se guarda en texto plano en la BD.
    return NextResponse.json({
      success: true,
      apiKeyId: newKeys[0].id,
      keyPreview: newKeys[0].key_preview,
      monthlyLimit: newKeys[0].monthly_limit,
      createdAt: newKeys[0].created_at,
      clientId: clientUuid,
      rawKey
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  });
}
