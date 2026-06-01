import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const [addr] = await sql`
      SELECT * FROM user_addresses
      WHERE user_id = ${session.user.id} AND is_default = true
      LIMIT 1
    `.catch(() => []);
    return NextResponse.json(addr || null);
  } catch {
    return NextResponse.json(null);
  }
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { full_address, lat, lng, street, number, floor_apt, city, province, postal_code } = await req.json();

    if (!full_address) return NextResponse.json({ error: 'Dirección requerida' }, { status: 400 });

    await sql`DELETE FROM user_addresses WHERE user_id = ${session.user.id}`.catch(() => {});

    const [addr] = await sql`
      INSERT INTO user_addresses
        (user_id, full_address, lat, lng, street, number, floor_apt, city, province, postal_code, is_default)
      VALUES
        (${session.user.id}, ${full_address}, ${lat || null}, ${lng || null},
         ${street || null}, ${number || null}, ${floor_apt || null},
         ${city || null}, ${province || null}, ${postal_code || null}, true)
      RETURNING *
    `;

    return NextResponse.json(addr);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
