import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { PLANS } from '@/lib/fitting-plans';
import { getSuperadminMpCredentials } from '@/lib/superadmin-mp-credentials';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { planKey, storeId } = await req.json();

    const plan = PLANS[planKey];
    if (!plan || !(plan.price_usd > 0)) {
      return NextResponse.json({ error: 'Plan invalido' }, { status: 400 });
    }

    const { accessToken } = await getSuperadminMpCredentials();

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: [{
          title: `Plan ${plan.name} - CnB`,
          quantity: 1,
          unit_price: plan.price_usd,
          currency_id: 'USD',
        }],
        external_reference: `plan-${storeId}-${planKey}-${Date.now()}`,
        notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/mp-plan`,
        back_urls: {
          success: `${process.env.NEXTAUTH_URL}/admin/fitting-plans?plan_payment=success`,
          failure: `${process.env.NEXTAUTH_URL}/admin/fitting-plans?plan_payment=failure`,
          pending: `${process.env.NEXTAUTH_URL}/admin/fitting-plans?plan_payment=pending`,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Error MP: ${response.status}`);
    }

    const preference = await response.json();

    const [payment] = await sql`
      INSERT INTO plan_payments (store_id, plan, amount_usd, payment_method, payment_status, mp_preference_id)
      VALUES (${storeId}, ${planKey}, ${plan.price_usd}, 'mercadopago', 'pending', ${preference.id})
      RETURNING id
    `;

    return NextResponse.json({ init_point: preference.init_point, payment_id: payment.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
