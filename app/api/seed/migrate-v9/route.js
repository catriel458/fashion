import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    // New columns on orders
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS comprobante_url TEXT`.catch(() => {});
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS factura_url TEXT`.catch(() => {});

    // whatsapp_number on users (for admin WA notify button)
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20)`.catch(() => {});

    // Drop old CHECK constraint that only allowed 'pending','confirmed','cancelled'
    await sql`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check`.catch(() => {});

    // Migrate old status values → new schema
    await sql`UPDATE orders SET status = 'pago_recibido'      WHERE status = 'confirmed'`.catch(() => {});
    await sql`UPDATE orders SET status = 'listo_para_retirar' WHERE status = 'ready'`.catch(() => {});
    await sql`UPDATE orders SET status = 'entregado'          WHERE status = 'delivered'`.catch(() => {});
    await sql`UPDATE orders SET status = 'cancelado'          WHERE status = 'cancelled'`.catch(() => {});

    // Transfer orders still in 'pending' with no comprobante → comprobante_pendiente
    await sql`
      UPDATE orders SET status = 'comprobante_pendiente'
      WHERE status = 'pending' AND payment_method = 'transfer' AND comprobante_url IS NULL
    `.catch(() => {});

    // Remaining 'pending' → pendiente_pago
    await sql`UPDATE orders SET status = 'pendiente_pago' WHERE status = 'pending'`.catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Migración v9: comprobante_url, factura_url, whatsapp_number, nuevos estados de pedido',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
