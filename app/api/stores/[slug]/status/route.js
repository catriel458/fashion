import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export async function GET(req, { params }) {
  try {
    const { slug } = params;
    const stores = await sql`SELECT id FROM stores WHERE slug = ${slug} AND active = true`;
    if (!stores.length) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

    const storeId = stores[0].id;
    const hours = await sql`SELECT * FROM store_hours WHERE store_id = ${storeId} ORDER BY day_of_week`;

    if (!hours.length) return NextResponse.json({ is_open: null });

    // Hora actual en Argentina UTC-3
    const nowAr = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    const dayOfWeek = nowAr.getDay();
    const hh = String(nowAr.getHours()).padStart(2, '0');
    const mm = String(nowAr.getMinutes()).padStart(2, '0');
    const currentTime = `${hh}:${mm}`;

    const todayHours = hours.find(h => h.day_of_week === dayOfWeek);

    if (todayHours?.is_open && todayHours.open_time && todayHours.close_time) {
      const openT  = todayHours.open_time.slice(0, 5);
      const closeT = todayHours.close_time.slice(0, 5);
      if (currentTime >= openT && currentTime <= closeT) {
        return NextResponse.json({ is_open: true, closes_at: closeT });
      }
    }

    // Buscar próxima apertura
    for (let i = 1; i <= 7; i++) {
      const nextDay = (dayOfWeek + i) % 7;
      const nextH = hours.find(h => h.day_of_week === nextDay && h.is_open && h.open_time);
      if (nextH) {
        return NextResponse.json({
          is_open: false,
          opens_next_day:  i === 1 ? 'mañana' : DAY_NAMES[nextDay],
          opens_next_time: nextH.open_time.slice(0, 5),
        });
      }
    }

    return NextResponse.json({ is_open: false, opens_next_day: null, opens_next_time: null });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
