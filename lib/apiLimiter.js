import sql from './db';

/**
 * Verifica si la API Key ha excedido su límite mensual de llamadas.
 * @param {object} apiKey - Objeto de la clave API de la base de datos
 * @returns {{allowed: boolean, remaining: number}}
 */
export function checkRateLimit(apiKey) {
  const requestsThisMonth = apiKey.requests_this_month || 0;
  const monthlyLimit = apiKey.monthly_limit || 100;

  if (requestsThisMonth >= monthlyLimit) {
    return {
      allowed: false,
      remaining: 0
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, monthlyLimit - requestsThisMonth)
  };
}

/**
 * Incrementa el contador mensual de llamadas de una clave API y actualiza last_used_at.
 * @param {string} apiKeyId - UUID de la clave API
 */
export async function incrementUsage(apiKeyId) {
  await sql`
    UPDATE api_keys
    SET requests_this_month = requests_this_month + 1,
        last_used_at = NOW()
    WHERE id = ${apiKeyId}
  `;
}

/**
 * Resetea el conteo de llamadas de todas las claves de API (para cron mensual).
 */
export async function resetMonthlyCounters() {
  await sql`
    UPDATE api_keys
    SET requests_this_month = 0
  `;
}
