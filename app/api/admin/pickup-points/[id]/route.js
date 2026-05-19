import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminStoreId } from '@/lib/admin-store';
import sql from '@/lib/db';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS pickup_points (
      id SERIAL PRIMARY KEY,
      store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
      name VARCHAR(200) NOT NULL,
      address TEXT,
      description TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `.catch(() => {});
}

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) return null;
  return session;
}

export async function PUT(req, { params }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const storeId = await getAdminStoreId(session);
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    await ensureTable();
    const { id } = params;
    const { name, address, description, active } = await req.json();
    const [point] = await sql`
      UPDATE pickup_points
      SET name = COALESCE(${name || null}, name),
          address = COALESCE(${address || null}, address),
          description = COALESCE(${description || null}, description),
          active = COALESCE(${active ?? null}, active)
      WHERE id = ${id} AND store_id = ${storeId}
      RETURNING *
    `;
    if (!point) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(point);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const storeId = await getAdminStoreId(session);
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    await ensureTable();
    const { id } = params;
    await sql`DELETE FROM pickup_points WHERE id = ${id} AND store_id = ${storeId}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
