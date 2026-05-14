import sql from './db';

export async function createNotification({ userId, storeId, type, title, message, link }) {
  try {
    await sql`
      INSERT INTO notifications (user_id, store_id, type, title, message, link)
      VALUES (${userId}, ${storeId || null}, ${type}, ${title}, ${message}, ${link || null})
    `;
  } catch {
    // No bloquear el flujo principal si falla la notificación
  }
}
