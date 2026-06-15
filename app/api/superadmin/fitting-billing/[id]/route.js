import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function PATCH(req, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  try {
    const body = await req.json();
    const { payment_status, comprobante_url, notes } = body;
    let { paid_at } = body;

    if (payment_status === 'paid' && !paid_at) paid_at = new Date().toISOString();

    await sql`
      UPDATE plan_payments SET
        payment_status  = COALESCE(${payment_status   ?? null}, payment_status),
        paid_at         = COALESCE(${paid_at          ?? null}, paid_at),
        comprobante_url = COALESCE(${comprobante_url  ?? null}, comprobante_url),
        notes           = COALESCE(${notes            ?? null}, notes)
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
