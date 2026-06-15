import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { PLANS } from '@/lib/fitting-plans';

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

    const [config] = await sql`
      SELECT transfer_enabled, transfer_cbu, transfer_alias, transfer_bank, transfer_holder
      FROM superadmin_config WHERE id = 1
    `;

    if (!config?.transfer_enabled) {
      return NextResponse.json({ error: 'TRANSFER_NOT_CONFIGURED' }, { status: 400 });
    }

    const [payment] = await sql`
      INSERT INTO plan_payments (store_id, plan, amount_usd, payment_method, payment_status)
      VALUES (${storeId}, ${planKey}, ${plan.price_usd}, 'transferencia', 'pending')
      RETURNING id
    `;

    return NextResponse.json({
      payment_id: payment.id,
      transfer_cbu: config.transfer_cbu || '',
      transfer_alias: config.transfer_alias || '',
      transfer_bank: config.transfer_bank || '',
      transfer_holder: config.transfer_holder || '',
      amount_usd: plan.price_usd,
      plan: planKey,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
