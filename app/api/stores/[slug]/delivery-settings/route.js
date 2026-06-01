import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const [store] = await sql`
      SELECT delivery_enabled, delivery_cost, delivery_radius_km,
             store_lat, store_lng, delivery_whatsapp, whatsapp_number
      FROM stores WHERE slug = ${params.slug} AND active = true
    `.catch(() => []);

    if (!store) return NextResponse.json({ delivery_enabled: false });

    return NextResponse.json({
      delivery_enabled:   store.delivery_enabled   ?? false,
      delivery_cost:      parseFloat(store.delivery_cost)      || 0,
      delivery_radius_km: parseFloat(store.delivery_radius_km) || 5,
      store_lat:          store.store_lat ? parseFloat(store.store_lat) : null,
      store_lng:          store.store_lng ? parseFloat(store.store_lng) : null,
      whatsapp:           store.delivery_whatsapp || store.whatsapp_number || null,
    });
  } catch {
    return NextResponse.json({ delivery_enabled: false });
  }
}
