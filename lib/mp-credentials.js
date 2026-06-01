import sql from './db';
import { decrypt } from './encryption';

export async function getMpCredentials(storeId) {
  if (process.env.MP_TEST_MODE === 'true') {
    if (!process.env.MP_ACCESS_TOKEN_TEST) throw new Error('MP_ACCESS_TOKEN_TEST no configurado');
    return {
      accessToken: process.env.MP_ACCESS_TOKEN_TEST,
      publicKey: process.env.MP_PUBLIC_KEY_TEST || '',
      isTest: true,
    };
  }

  const [store] = await sql`SELECT mp_access_token, mp_public_key FROM stores WHERE id = ${storeId}`;
  if (!store?.mp_access_token) throw new Error('Mercado Pago no configurado para este local');

  return {
    accessToken: decrypt(store.mp_access_token),
    publicKey: store.mp_public_key || '',
    isTest: false,
  };
}
