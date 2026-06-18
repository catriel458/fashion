import crypto from 'crypto';
import sql from './db';

/**
 * Valida la API Key provista en el encabezado de autorización de la solicitud.
 * @param {Request} request - Objeto de solicitud de Next.js
 * @returns {Promise<{valid: boolean, apiKey?: object, client?: object, error?: string}>}
 */
export async function validateApiKey(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return { valid: false, error: 'Authorization header is missing. Expected Bearer token.' };
    }

    if (!authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Invalid Authorization format. Expected Bearer <key>.' };
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return { valid: false, error: 'API Key is empty.' };
    }

    // Hashear la clave recibida con SHA-256 (nunca loguear la key limpia)
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar clave activa en base de datos
    const keys = await sql`
      SELECT id, client_id, name, is_active, requests_this_month, monthly_limit, last_used_at, created_at
      FROM api_keys
      WHERE key_hash = ${hash} AND is_active = true
      LIMIT 1
    `;

    if (keys.length === 0) {
      return { valid: false, error: 'Unauthorized: API Key is invalid or inactive.' };
    }

    const apiKey = keys[0];

    // Verificar si el cliente asociado está activo
    const clients = await sql`
      SELECT id, name, email, plan, is_active, created_at
      FROM api_clients
      WHERE id = ${apiKey.client_id} AND is_active = true
      LIMIT 1
    `;

    if (clients.length === 0) {
      return { valid: false, error: 'Unauthorized: Associated client account is inactive.' };
    }

    const client = clients[0];

    return {
      valid: true,
      apiKey,
      client
    };
  } catch (error) {
    return {
      valid: false,
      error: `Auth error: ${error.message}`
    };
  }
}
