import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Obtener la URL de conexión (censurando la contraseña)
    const rawUrl = process.env.DATABASE_URL || '';
    const maskedUrl = rawUrl.replace(/:[^:@]+@/, ':***@');

    // 2. Hacer una consulta directa a la base de datos
    const stores = await sql`SELECT id, name, slug, active FROM stores ORDER BY id`;

    return NextResponse.json({
      databaseUrl: maskedUrl,
      storesCount: stores.length,
      stores: stores
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
