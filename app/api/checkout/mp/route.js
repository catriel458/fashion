import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMpCredentials } from '@/lib/mp-credentials';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { orderId, storeId, cartItems, customerData, successUrl, failureUrl, pendingUrl } = await req.json();
    if (!storeId || !cartItems?.length || !orderId) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const creds = await getMpCredentials(storeId);
    const externalReference = `${storeId}-${orderId}`;

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${creds.accessToken}`,
      },
      body: JSON.stringify({
        items: cartItems.map(item => ({
          title:      item.title,
          quantity:   item.quantity,
          unit_price: parseFloat(item.unit_price),
          currency_id: 'ARS',
        })),
        payer: { email: customerData?.email || session.user.email },
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl,
        },
        auto_return: 'approved',
        external_reference:  externalReference,
        statement_descriptor: 'TnB Store',
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Error MP: ${response.status}`);
    }

    const preference = await response.json();
    const checkoutUrl = creds.isTest ? preference.sandbox_init_point : preference.init_point;

    return NextResponse.json({ checkoutUrl, preferenceId: preference.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
