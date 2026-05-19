import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminStoreId } from '@/lib/admin-store';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

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
  `;
}

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) return null;
  return session;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const storeId = await getAdminStoreId(session);
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    await ensureTable();
    const points = await sql`
      SELECT * FROM pickup_points WHERE store_id = ${storeId} ORDER BY created_at DESC
    `;
    return NextResponse.json(points);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const storeId = await getAdminStoreId(session);
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    await ensureTable();

    const { name, address, description } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });

    const [point] = await sql`
      INSERT INTO pickup_points (store_id, name, address, description, active)
      VALUES (${storeId}, ${name.trim()}, ${address || null}, ${description || null}, true)
      RETURNING *
    `;
    return NextResponse.json(point, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
