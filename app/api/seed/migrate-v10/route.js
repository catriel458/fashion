import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    // orders.status was VARCHAR(20) but 'comprobante_pendiente' is 21 chars
    await sql`ALTER TABLE orders ALTER COLUMN status TYPE TEXT`;

    // orders.payment_method was VARCHAR(20) — widen defensively
    await sql`ALTER TABLE orders ALTER COLUMN payment_method TYPE TEXT`;

    return NextResponse.json({
      success: true,
      message: 'Migración v10: orders.status y orders.payment_method ampliados a TEXT',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
