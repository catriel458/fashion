import sql from './db';
import { decrypt } from './encryption';

export async function getSuperadminMpCredentials() {
  if (process.env.MP_TEST_MODE === 'true') {
    if (!process.env.MP_ACCESS_TOKEN_TEST) throw new Error('MP_ACCESS_TOKEN_TEST no configurado');
    return {
      accessToken: process.env.MP_ACCESS_TOKEN_TEST,
      isTest: true,
    };
  }

  const [config] = await sql`SELECT mp_access_token FROM superadmin_config WHERE id = 1`;
  if (!config?.mp_access_token) {
    throw new Error('Mercado Pago no configurado. Configura tu Access Token en Superadmin > Configuracion.');
  }

  return {
    accessToken: decrypt(config.mp_access_token),
    isTest: false,
  };
}
