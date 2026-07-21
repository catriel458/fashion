import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { addPoints } from '@/lib/points';
import { createNotification } from '@/lib/notify';
import { callTryOnIa } from '@/lib/tryOnIa';

export const maxDuration = 60;

async function checkFittingLimits(rawStoreId, userId) {
  const storeId = Number(rawStoreId);
  if (!storeId) return { error: Response.json({ error: 'STORE_NOT_FOUND' }, { status: 404 }) };

  const stores = await sql`
    SELECT fitting_daily_limit_per_user, fitting_monthly_limit, fitting_used_this_month, fitting_month_reset_at
    FROM stores WHERE id = ${storeId}
  `;
  if (!stores.length) return { error: Response.json({ error: 'STORE_NOT_FOUND' }, { status: 404 }) };

  let store = stores[0];

  const resetAt = new Date(store.fitting_month_reset_at);
  const nextReset = new Date(resetAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (new Date() > nextReset) {
    await sql`UPDATE stores SET fitting_used_this_month = 0, fitting_month_reset_at = NOW() WHERE id = ${storeId}`;
    store = { ...store, fitting_used_this_month: 0 };
  }

  const [{ count }] = await sql`
    SELECT COUNT(*) as count FROM fitting_room_usage
    WHERE user_id = ${userId} AND store_id = ${storeId} AND used_at > NOW() - INTERVAL '1 day'
  `;

  if (Number(count) >= store.fitting_daily_limit_per_user) {
    return { error: Response.json({ error: 'USER_LIMIT_REACHED', message: 'Alcanzaste tu límite diario de probadas. Volvé mañana!' }, { status: 429 }) };
  }

  if (store.fitting_used_this_month >= store.fitting_monthly_limit) {
    return { error: Response.json({ error: 'STORE_LIMIT_REACHED', message: 'Esta tienda no tiene más probadas disponibles este mes.' }, { status: 429 }) };
  }

  return { ok: true, storeId };
}

async function registerFittingUsage(storeId, userId, productIds) {
  // Asegurar la existencia de la tabla para registrar prendas probadas
  await sql`
    CREATE TABLE IF NOT EXISTS fitting_room_item_logs (
      id SERIAL PRIMARY KEY,
      store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`INSERT INTO fitting_room_usage (store_id, user_id) VALUES (${storeId}, ${userId})`;
  await sql`UPDATE stores SET fitting_used_this_month = fitting_used_this_month + 1 WHERE id = ${storeId}`;

  // Registrar cada prenda en fitting_room_item_logs
  if (productIds && Array.isArray(productIds) && productIds.length > 0) {
    for (const prodId of productIds) {
      if (prodId) {
        await sql`
          INSERT INTO fitting_room_item_logs (store_id, user_id, product_id)
          VALUES (${storeId}, ${userId}, ${prodId})
        `;
      }
    }
  }

  try {
    const [{ count }] = await sql`
      SELECT COUNT(*)::int as count FROM fitting_room_usage WHERE user_id = ${userId}
    `;

    if (count === 1) {
      const couponCode = `PRIMERAPROBADA-${userId}`;
      await sql`
        INSERT INTO coupons (code, user_id, store_id, type, discount_percentage, expires_at)
        VALUES (${couponCode}, ${userId}, ${storeId}, 'first_tryon', 15, NOW() + INTERVAL '7 days')
        ON CONFLICT DO NOTHING
      `;

      await createNotification({
        userId,
        storeId,
        type: 'first_tryon_coupon',
        title: 'Cupon por tu primera probada!',
        message: `Usaste el probador virtual por primera vez. Tenes 15% de descuento valido por 7 dias. Codigo: ${couponCode}`,
        link: '/profile/benefits',
      });

      await addPoints(userId, storeId, 'first_tryon');
    } else {
      await addPoints(userId, storeId, 'tryon');
    }
  } catch (err) {
    // Evitar que falle el flujo principal si hay un error en los puntos o cupones
  }
}

async function handleJsonMode(parsed, height, weight) {
  const { personImage, clothingImages } = parsed;
  if (!personImage || !Array.isArray(clothingImages) || clothingImages.length === 0) {
    return Response.json({ error: 'Faltan personImage o clothingImages' }, { status: 400 });
  }

  try {
    const imageResult = await callTryOnIa({
      personImage,
      clothingImages,
      height,
      weight
    });
    return Response.json({ image: imageResult });
  } catch (e) {
    const status = e.name === 'AbortError' || e.message.includes('Timeout') ? 504 : 500;
    return Response.json({ error: e.message }, { status });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  // Consultar peso y altura del usuario en la base de datos
  const users = await sql`SELECT height, weight FROM users WHERE id = ${userId}`;
  const userObj = users[0] || {};
  const height = userObj.height || null;
  const weight = userObj.weight || null;

  // Modo JSON: acepta { personImage: URL, clothingImages: [URLs], store_id, product_ids }
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    let parsed;
    try {
      parsed = await request.json();
    } catch {
      return Response.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const limitCheck = await checkFittingLimits(parsed.store_id, userId);
    if (limitCheck.error) return limitCheck.error;

    const productIds = parsed.product_ids || parsed.productIds || [];

    const result = await handleJsonMode(parsed, height, weight);
    if (result.status === 200) {
      await registerFittingUsage(limitCheck.storeId, userId, productIds);
    }
    return result;
  }

  // 📥 Leer form
  let formData;
  try {
    formData = await request.formData();
  } catch (e) {
    return Response.json(
      { error: 'Error leyendo el form: ' + e.message },
      { status: 400 }
    );
  }

  const limitCheck = await checkFittingLimits(formData.get('store_id'), userId);
  if (limitCheck.error) return limitCheck.error;

  let productIds = [];
  try {
    const rawIds = formData.get('product_ids');
    if (rawIds) productIds = JSON.parse(rawIds);
  } catch (e) {}

  const personFile = formData.get('person');
  const garmentFile = formData.get('garment');

  if (!personFile || !garmentFile) {
    return Response.json(
      { error: 'Faltan imágenes' },
      { status: 400 }
    );
  }

  // 🔄 Convertir a base64
  const toBase64 = async (file) => {
    const buffer = await file.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  };

  try {
    const personB64 = await toBase64(personFile);
    const garmentB64 = await toBase64(garmentFile);

    const imageResult = await callTryOnIa({
      personImage: { b64: personB64, mime: personFile.type },
      clothingImages: [{ b64: garmentB64, mime: garmentFile.type }],
      height,
      weight
    });

    await registerFittingUsage(limitCheck.storeId, userId, productIds);
    return Response.json({ image: imageResult });
  } catch (e) {
    const status = e.name === 'AbortError' || e.message.includes('Timeout') ? 504 : 500;
    return Response.json({ error: e.message }, { status });
  }
}