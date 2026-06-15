import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';
import sql from '@/lib/db';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const paymentId = formData.get('payment_id');
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });
    if (!paymentId) return NextResponse.json({ error: 'payment_id requerido' }, { status: 400 });

    const ext = file.name.split('.').pop();
    const filename = `plan-comprobantes/${paymentId}.${ext}`;
    const blob = await put(filename, file, { access: 'public' });

    await sql`UPDATE plan_payments SET comprobante_url = ${blob.url} WHERE id = ${paymentId}`;

    return NextResponse.json({ comprobante_url: blob.url });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
