import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('payment_id');

    const [payment] = await sql`
      SELECT payment_status, plan, paid_at FROM plan_payments WHERE id = ${paymentId}
    `;
    if (!payment) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });

    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
