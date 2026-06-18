import sql from './db';

/**
 * Registra una llamada a la API en la tabla de base de datos api_requests_log.
 * @param {object} logData - Objeto con los datos de registro de la petición
 */
export async function logRequest({
  apiKeyId,
  clientId,
  endpoint,
  garmentsCount,
  status,
  processingTimeMs,
  errorMessage
}) {
  try {
    await sql`
      INSERT INTO api_requests_log (
        api_key_id,
        client_id,
        endpoint,
        garments_count,
        status,
        processing_time_ms,
        error_message
      ) VALUES (
        ${apiKeyId || null},
        ${clientId || null},
        ${endpoint || null},
        ${garmentsCount || null},
        ${status || null},
        ${processingTimeMs || null},
        ${errorMessage || null}
      )
    `;
  } catch (err) {
    console.error('Error al persistir log de la API:', err);
  }
}
