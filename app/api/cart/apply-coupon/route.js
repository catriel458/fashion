import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Debés iniciar sesión para usar cupones' }, { status: 401 });

  try {
    const { code, storeSlug } = await req.json();
    if (!code?.trim()) return NextResponse.json({ error: 'Código requerido' }, { status: 400 });

    const stores = await sql`SELECT id FROM stores WHERE slug = ${storeSlug}`;
    if (stores.length === 0) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    const storeId = stores[0].id;

    const coupons = await sql`
      SELECT * FROM coupons
      WHERE UPPER(code) = UPPER(${code.trim()})
        AND store_id = ${storeId}
        AND user_id = ${session.user.id}
        AND used = false
        AND expires_at > NOW()
    `;

    if (coupons.length === 0) {
      return NextResponse.json({ error: 'Cupón inválido, ya utilizado o expirado' }, { status: 400 });
    }

    const coupon = coupons[0];
    return NextResponse.json({
      discount_percentage: coupon.discount_percentage,
      coupon_id: coupon.id,
      message: `¡Cupón aplicado! ${coupon.discount_percentage}% de descuento`,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
