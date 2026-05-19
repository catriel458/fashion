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
    const [store] = await sql`SELECT * FROM stores WHERE id = ${storeId}`;
    if (!store) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

    const hours = await sql`SELECT * FROM store_hours WHERE store_id = ${storeId} ORDER BY day_of_week`.catch(() => []);

    return NextResponse.json({ ...store, hours });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const storeId = await getAdminStoreId(session);
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    const body = await req.json();
    const { whatsapp_number, whatsapp_message_template, address, pickup_info, hours } = body;

    // Limpiar número de WhatsApp: solo dígitos
    let cleanWa = whatsapp_number ? whatsapp_number.replace(/\D/g, '') : null;
    if (cleanWa && (cleanWa.length < 10 || cleanWa.length > 15)) {
      return NextResponse.json({ error: 'El número de WhatsApp debe tener entre 10 y 15 dígitos' }, { status: 400 });
    }

    await sql`
      UPDATE stores
      SET whatsapp_number = ${cleanWa},
          whatsapp_message_template = ${whatsapp_message_template || null},
          address = ${address || null},
          pickup_info = ${pickup_info || null},
          updated_at = NOW()
      WHERE id = ${storeId}
    `;

    // Upsert horarios
    if (Array.isArray(hours)) {
      for (const h of hours) {
        await sql`
          INSERT INTO store_hours (store_id, day_of_week, is_open, open_time, close_time)
          VALUES (${storeId}, ${h.day_of_week}, ${h.is_open}, ${h.open_time || null}, ${h.close_time || null})
          ON CONFLICT (store_id, day_of_week)
          DO UPDATE SET is_open = EXCLUDED.is_open, open_time = EXCLUDED.open_time, close_time = EXCLUDED.close_time
        `;
      }
    }

    const [updated] = await sql`SELECT id, name, whatsapp_number, whatsapp_message_template, address, pickup_info FROM stores WHERE id = ${storeId}`;
    const updatedHours = await sql`SELECT * FROM store_hours WHERE store_id = ${storeId} ORDER BY day_of_week`;

    return NextResponse.json({ ...updated, hours: updatedHours });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
