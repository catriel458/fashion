import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminStoreId } from '@/lib/admin-store';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

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
    const [store] = await sql`
      SELECT delivery_enabled, delivery_cost, delivery_radius_km,
             store_lat, store_lng, store_address, store_city, store_province,
             delivery_whatsapp, contact_email
      FROM stores WHERE id = ${storeId}
    `;
    if (!store) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    return NextResponse.json({
      delivery_enabled:   store.delivery_enabled   ?? false,
      delivery_cost:      store.delivery_cost      ?? 0,
      delivery_radius_km: store.delivery_radius_km ?? 5,
      store_lat:          store.store_lat          ?? null,
      store_lng:          store.store_lng          ?? null,
      store_address:      store.store_address      || '',
      store_city:         store.store_city         || '',
      store_province:     store.store_province     || '',
      delivery_whatsapp:  store.delivery_whatsapp  || '',
      contact_email:      store.contact_email      || '',
    });
  } catch {
    return NextResponse.json({ delivery_enabled: false, delivery_cost: 0, delivery_radius_km: 5, store_address: '', contact_email: '' });
  }
}

export async function PUT(req) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const storeId = await getAdminStoreId(session);
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    const {
      delivery_enabled, delivery_cost, delivery_radius_km,
      store_lat, store_lng, store_address, store_city, store_province,
      delivery_whatsapp, contact_email,
    } = await req.json();

    await sql`
      UPDATE stores SET
        delivery_enabled   = ${delivery_enabled ?? false},
        delivery_cost      = ${parseFloat(delivery_cost) || 0},
        delivery_radius_km = ${parseFloat(delivery_radius_km) || 5},
        store_lat          = ${store_lat   || null},
        store_lng          = ${store_lng   || null},
        store_address      = ${store_address  || null},
        store_city         = ${store_city     || null},
        store_province     = ${store_province || null},
        delivery_whatsapp  = ${delivery_whatsapp || null},
        contact_email      = ${contact_email    || null},
        updated_at         = NOW()
      WHERE id = ${storeId}
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
