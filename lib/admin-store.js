import sql from './db';

export async function getAdminStoreId(session) {
  // 1. Primero intentar del JWT (ya en memoria, sin DB)
  if (session?.user?.store_id) return session.user.store_id;
  if (!session?.user?.id) return null;
  // Sólo aplica para admins, no para superadmin
  if (session?.user?.role !== 'admin') return null;

  try {
    // 2. Fallback: leer de la DB (JWT puede estar stale)
    const [user] = await sql`SELECT store_id FROM users WHERE id = ${session.user.id}`;
    if (user?.store_id) return user.store_id;

    // 3. Último recurso: buscar tiendas donde este usuario sea admin
    const stores = await sql`
      SELECT s.id FROM stores s
      JOIN users u ON u.store_id = s.id
      WHERE u.id = ${session.user.id} AND s.active = true
      LIMIT 1
    `;
    return stores[0]?.id ?? null;
  } catch {
    return null;
  }
}
