import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { calculateDistance } from '@/lib/geocoding';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const storeSlug = searchParams.get('storeSlug');
  const lat = parseFloat(searchParams.get('lat'));
  const lng = parseFloat(searchParams.get('lng'));

  if (!storeSlug || isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ available: false, message: 'Parámetros inválidos' });
  }

  try {
    const [store] = await sql`
      SELECT delivery_enabled, delivery_cost, delivery_radius_km, store_lat, store_lng
      FROM stores WHERE slug = ${storeSlug} AND active = true
    `.catch(() => []);

    if (!store || !store.delivery_enabled) {
      return NextResponse.json({ available: false, message: 'Este local no ofrece envío a domicilio' });
    }

    if (!store.store_lat || !store.store_lng) {
      return NextResponse.json({ available: false, message: 'El local no tiene configurada su ubicación de envío' });
    }

    const distance = calculateDistance(lat, lng, parseFloat(store.store_lat), parseFloat(store.store_lng));
    const radiusKm = parseFloat(store.delivery_radius_km) || 5;
    const cost = parseFloat(store.delivery_cost) || 0;
    const distanceRounded = Math.round(distance * 10) / 10;

    if (distance <= radiusKm) {
      return NextResponse.json({
        available: true,
        cost,
        distance: distanceRounded,
        message: `Hacemos envíos a tu zona — Costo: $${cost % 1 === 0 ? cost.toFixed(0) : cost.toFixed(2)}`,
      });
    }

    return NextResponse.json({
      available: false,
      distance: distanceRounded,
      message: `Tu domicilio está a ${distanceRounded} km. Zona de cobertura: ${radiusKm} km. Podés retirar en nuestros locales.`,
    });
  } catch {
    return NextResponse.json({ available: false, message: 'Error al verificar disponibilidad' });
  }
}
