import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { addPoints } from '@/lib/points';
import { createNotification } from '@/lib/notify';


export const maxDuration = 60;

function extractTryOnImage(data) {
  const message = data?.choices?.[0]?.message;
  const parts   = message?.content;

  if (Array.isArray(parts)) {
    const base64Img = parts.find(p => p.image_base64);
    if (base64Img?.image_base64) return Response.json({ image: `data:image/png;base64,${base64Img.image_base64}` });
    const imgUrl = parts.find(p => p.type === 'image_url');
    if (imgUrl?.image_url?.url) return Response.json({ image: imgUrl.image_url.url });
  }
  if (typeof parts === 'string') {
    if (parts.startsWith('data:image')) return Response.json({ image: parts });
    if (parts.length > 100) return Response.json({ image: `data:image/png;base64,${parts}` });
  }
  const img = message?.images?.[0] || data?.images?.[0] || data?.choices?.[0]?.images?.[0];
  if (img) {
    const url = img?.image_url?.url || img?.url || img?.b64_json || img?.image_base64;
    if (url) {
      if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:image'))) return Response.json({ image: url });
      if (typeof url === 'string' && url.length > 100) return Response.json({ image: `data:image/png;base64,${url}` });
    }
  }
  return Response.json({ error: 'No se pudo extraer la imagen', debug: { hasMessage: !!message, hasContent: !!parts, hasImages: !!message?.images } }, { status: 422 });
}

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

async function handleJsonMode(parsed, apiKey) {
  const { personImage, clothingImages } = parsed;
  if (!personImage || !Array.isArray(clothingImages) || clothingImages.length === 0) {
    return Response.json({ error: 'Faltan personImage o clothingImages' }, { status: 400 });
  }

  const fetchB64 = async (url) => {
    const r = await fetch(url);
    const buf = await r.arrayBuffer();
    return { b64: Buffer.from(buf).toString('base64'), mime: r.headers.get('content-type') || 'image/jpeg' };
  };

  let images;
  try {
    images = await Promise.all([personImage, ...clothingImages].map(fetchB64));
  } catch (e) {
    return Response.json({ error: 'Error al obtener imágenes: ' + e.message }, { status: 400 });
  }

  const [personData, ...clothingData] = images;

const prompt = `You are a virtual try-on AI. Your task is to dress the person from the first image with the clothing items shown in the second image.

MANDATORY OUTPUT REQUIREMENTS:
- The result MUST always be a FULL BODY image showing the person from head to feet — legs and feet must always be fully visible
- NEVER crop the image at the waist, hips, or knees under any circumstance
- If the input photo shows only the upper body, you MUST reconstruct the lower body (legs and feet) naturally to produce a complete standing person
- The background MUST always be a natural park setting: green grass, trees, soft natural daylight — apply this background regardless of the original photo background

The first image may not be perfect — it could be:
- A half-body or upper-body photo (no legs visible)
- A photo taken with a phone in a real environment
- A photo with a cluttered or colored background
- A photo with imperfect lighting or angle

In all these cases you must adapt intelligently:
- Always output a full body from head to feet, reconstructing any missing parts naturally
- Always replace the background with a park setting (green grass, trees, natural light)
- If the pose is not ideal, do your best to apply the garments naturally
- Never return a broken, distorted or empty result — always return a complete person wearing the clothes

The second image may contain one or multiple garments. Identify EVERY item present and apply ALL of them to the person.

Rules:
- Apply every garment visible in the second image, whether it is one item or many
- If there is only one garment, apply just that one
- If there are multiple garments in a collage, apply all of them as a complete outfit
- Replace only the clothing parts that correspond to the provided garments, keep everything else natural
- Keep the exact colors, textures, prints and details of each garment
- Keep the person's face, skin tone, hair and body proportions identical
- Keep the original pose and body position
- Reconstruct any missing body parts naturally and proportionally
- The result must look like a real professional fashion photo taken outdoors in a park
- Never return a blank, broken or incomplete result under any circumstance

CRITICAL: Return ONE single image showing ONLY the person wearing the clothes.
Do NOT show the garment collage in the result.
Do NOT split the image in two halves.
Do NOT show any clothing layout or reference images.
The output must be a single full-body photo of the person dressed, standing in a park setting.`;

  const content = [
    { type: 'text', text: prompt },
    { type: 'image_url', image_url: { url: `data:${personData.mime};base64,${personData.b64}` } },
    ...clothingData.map(c => ({ type: 'image_url', image_url: { url: `data:${c.mime};base64,${c.b64}` } })),
  ];

  const body = {
    model: 'google/gemini-2.5-flash-image',
    messages: [{ role: 'user', content }],
    modalities: ['image'],
  };

  let res, rawText;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    rawText = await res.text();
  } catch (e) {
    if (e.name === 'AbortError') return Response.json({ error: 'Timeout: la generación tardó más de 55 segundos.' }, { status: 504 });
    return Response.json({ error: 'Error de red: ' + e.message }, { status: 502 });
  }

  if (!rawText || rawText.trim() === '') return Response.json({ error: 'Respuesta vacía de OpenRouter.' }, { status: 500 });

  let data;
  try { data = JSON.parse(rawText); }
  catch { return Response.json({ error: 'Respuesta inválida: ' + rawText.substring(0, 200) }, { status: 500 }); }

  if (!res.ok) return Response.json({ error: data?.error?.message || `Error HTTP ${res.status}` }, { status: res.status });

  return extractTryOnImage(data);
}

export async function POST(request) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: 'OPENROUTER_API_KEY no configurada' },
      { status: 500 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  // Modo JSON: acepta { personImage: URL, clothingImages: [URLs], store_id, product_ids }
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    let parsed;
    try { parsed = await request.json(); }
    catch { return Response.json({ error: 'JSON inválido' }, { status: 400 }); }

    const limitCheck = await checkFittingLimits(parsed.store_id, userId);
    if (limitCheck.error) return limitCheck.error;

    const productIds = parsed.product_ids || parsed.productIds || [];

    const result = await handleJsonMode(parsed, apiKey);
    if (result.status === 200) await registerFittingUsage(limitCheck.storeId, userId, productIds);
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

  const personB64 = await toBase64(personFile);
  const garmentB64 = await toBase64(garmentFile);

  // 🧠 Prompt
const prompt = `You are a virtual try-on AI. Your task is to dress the person from the first image with the clothing items shown in the second image.

MANDATORY OUTPUT REQUIREMENTS:
- The result MUST always be a FULL BODY image showing the person from head to feet — legs and feet must always be fully visible
- NEVER crop the image at the waist, hips, or knees under any circumstance
- If the input photo shows only the upper body, you MUST reconstruct the lower body (legs and feet) naturally to produce a complete standing person
- The background MUST always be a natural park setting: green grass, trees, soft natural daylight — apply this background regardless of the original photo background

The first image may not be perfect — it could be:
- A half-body or upper-body photo (no legs visible)
- A photo taken with a phone in a real environment
- A photo with a cluttered or colored background
- A photo with imperfect lighting or angle

In all these cases you must adapt intelligently:
- Always output a full body from head to feet, reconstructing any missing parts naturally
- Always replace the background with a park setting (green grass, trees, natural light)
- If the pose is not ideal, do your best to apply the garments naturally
- Never return a broken, distorted or empty result — always return a complete person wearing the clothes

The second image may contain one or multiple garments. Identify EVERY item present and apply ALL of them to the person.

Rules:
- Apply every garment visible in the second image, whether it is one item or many
- If there is only one garment, apply just that one
- If there are multiple garments in a collage, apply all of them as a complete outfit
- Replace only the clothing parts that correspond to the provided garments, keep everything else natural
- Keep the exact colors, textures, prints and details of each garment
- Keep the person's face, skin tone, hair and body proportions identical
- Keep the original pose and body position
- Reconstruct any missing body parts naturally and proportionally
- The result must look like a real professional fashion photo taken outdoors in a park
- Never return a blank, broken or incomplete result under any circumstance

CRITICAL: Return ONE single image showing ONLY the person wearing the clothes.
Do NOT show the garment collage in the result.
Do NOT split the image in two halves.
Do NOT show any clothing layout or reference images.
The output must be a single full-body photo of the person dressed, standing in a park setting.`;

  const body = {
    model: 'google/gemini-2.5-flash-image',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${personFile.type};base64,${personB64}`
            }
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${garmentFile.type};base64,${garmentB64}`
            }
          }
        ]
      }
    ],
    modalities: ['image'] // 🔥 importante
  };

  let res, rawText;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeout);
    rawText = await res.text();
  } catch (e) {
    if (e.name === 'AbortError') {
      return Response.json(
        { error: 'Timeout: la generación tardó más de 55 segundos.' },
        { status: 504 }
      );
    }
    return Response.json(
      { error: 'Error de red: ' + e.message },
      { status: 502 }
    );
  }

  if (!rawText || rawText.trim() === '') {
    return Response.json(
      { error: 'Respuesta vacía de OpenRouter.' },
      { status: 500 }
    );
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    return Response.json(
      { error: 'Respuesta inválida: ' + rawText.substring(0, 200) },
      { status: 500 }
    );
  }

  if (!res.ok) {
    return Response.json(
      { error: data?.error?.message || `Error HTTP ${res.status}` },
      { status: res.status }
    );
  }

  const result = extractTryOnImage(data);
  if (result.status === 200) await registerFittingUsage(limitCheck.storeId, userId, productIds);
  return result;
}