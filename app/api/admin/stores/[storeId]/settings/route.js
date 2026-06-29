import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminStoreId } from '@/lib/admin-store';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { storeId } = params;

  // Si el usuario es admin, validamos que tenga acceso a la tienda indicada en params
  if (session.user.role === 'admin') {
    const adminStoreId = await getAdminStoreId(session);
    if (String(adminStoreId) !== String(storeId)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const { welcome_popup_enabled, welcome_popup_discount } = body;

    if (typeof welcome_popup_enabled !== 'boolean') {
      return NextResponse.json({ error: 'welcome_popup_enabled debe ser de tipo boolean' }, { status: 400 });
    }

    const discount = parseInt(welcome_popup_discount, 10);
    if (isNaN(discount) || discount < 1 || discount > 100) {
      return NextResponse.json({ error: 'El porcentaje de descuento debe estar entre 1 y 100' }, { status: 400 });
    }

    await sql`
      UPDATE stores
      SET
        welcome_popup_enabled = ${welcome_popup_enabled},
        welcome_popup_discount = ${discount},
        updated_at = NOW()
      WHERE id = ${storeId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
