/**
 * Resuelve una entrada de imagen (URL, Data URI o string Base64) a un objeto { b64, mime }
 * @param {string|object} input - Entrada de la imagen
 * @returns {Promise<{b64: string, mime: string}>}
 */
async function getB64AndMime(input) {
  if (input && typeof input === 'object' && input.b64 && input.mime) {
    return input;
  }

  if (typeof input !== 'string') {
    throw new Error('Formato de imagen inválido. Debe ser una URL o una cadena base64.');
  }

  // 1. Manejar Data URIs (ej: data:image/png;base64,...)
  if (input.startsWith('data:')) {
    const match = input.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { mime: match[1], b64: match[2] };
    }
    throw new Error('Data URL base64 inválido.');
  }

  // 2. Descargar de URLs públicas remotas (http/https)
  if (input.startsWith('http://') || input.startsWith('https://')) {
    const res = await fetch(input);
    if (!res.ok) {
      throw new Error(`Error al descargar la imagen de ${input}: HTTP ${res.status}`);
    }
    const buf = await res.arrayBuffer();
    const mime = res.headers.get('content-type') || 'image/jpeg';
    return {
      b64: Buffer.from(buf).toString('base64'),
      mime
    };
  }

  // 3. Asumir que es una cadena base64 cruda
  if (input.length > 100) {
    return { mime: 'image/jpeg', b64: input };
  }

  throw new Error('Formato de imagen no reconocido. Debe ser una URL válida o base64.');
}

/**
 * Llama a la IA de OpenRouter para procesar la simulación de vestidor virtual (Try-On).
 * @param {object} params - Parámetros de la simulación
 * @param {string|object} params.personImage - Foto del usuario (URL, base64 o {b64, mime})
 * @param {Array<string|object>} params.clothingImages - Listado de prendas (URL, base64 o {b64, mime})
 * @returns {Promise<string>} - String conteniendo el resultado en formato URL o base64
 */
export async function callTryOnIa({ personImage, clothingImages, height, weight }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY no configurada');
  }

  // Resolver todas las imágenes a base64 de manera asíncrona
  const [resolvedPerson, ...resolvedClothing] = await Promise.all([
    getB64AndMime(personImage),
    ...clothingImages.map(getB64AndMime)
  ]);

  let bodySpecPrompt = '';
  if (height || weight) {
    bodySpecPrompt = `
- The person in the output image MUST have a physical body shape matching a height of ${height ? height + ' cm' : 'average height'} and a weight of ${weight ? weight + ' kg' : 'average weight'}.
- You MUST adjust the body frame, waist width, limbs, and overall volume to be highly faithful to these measurements (e.g., if the weight is high relative to height, the model MUST be realistically overweight, plus-sized, or full-figured, with matching thicker arms, legs, and waist; if the weight is low, they must be slender or thin).
- If the original person photo is a full-body standing photo, you MUST match the body proportions visible in the photo but also adjust them to align with the specified height and weight parameters.
- If the original person photo is NOT a full-body photo (e.g., a cropped half-body or portrait), reconstruct the missing lower body (legs, knees, feet) and scale the body volume and thickness to faithfully represent the specified standing height of ${height ? height + ' cm' : 'average'} and weight of ${weight ? weight + ' kg' : 'average'}.
- Always use the height and weight parameters as the primary source of truth for the model's final body build, shape, and physical proportions to ensure the output body build is as realistic and faithful as possible to the specified dimensions.`;
  }

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
- Never return a blank, broken or incomplete result under any circumstance${bodySpecPrompt}

CRITICAL: Return ONE single image showing ONLY the person wearing the clothes.
Do NOT show the garment collage in the result.
Do NOT split the image in two halves.
Do NOT show any clothing layout or reference images.
The output must be a single full-body photo of the person dressed, standing in a park setting.`;

  const content = [
    { type: 'text', text: prompt },
    { type: 'image_url', image_url: { url: `data:${resolvedPerson.mime};base64,${resolvedPerson.b64}` } },
    ...resolvedClothing.map(c => ({ type: 'image_url', image_url: { url: `data:${c.mime};base64,${c.b64}` } })),
  ];

  const body = {
    model: 'google/gemini-2.5-flash-image',
    messages: [{ role: 'user', content }],
    modalities: ['image'],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    signal: controller.signal
  });
  clearTimeout(timeout);

  const rawText = await res.text();

  if (!rawText || rawText.trim() === '') {
    throw new Error('Respuesta vacía de OpenRouter.');
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error('Respuesta inválida de OpenRouter (no es JSON válido): ' + rawText.substring(0, 200));
  }

  if (!res.ok) {
    throw new Error(data?.error?.message || `Error HTTP ${res.status}`);
  }

  // Extraer la imagen del formato de respuesta de OpenRouter/Gemini
  const message = data?.choices?.[0]?.message;
  const parts = message?.content;

  if (Array.isArray(parts)) {
    const base64Img = parts.find(p => p.image_base64);
    if (base64Img?.image_base64) return `data:image/png;base64,${base64Img.image_base64}`;
    const imgUrl = parts.find(p => p.type === 'image_url');
    if (imgUrl?.image_url?.url) return imgUrl.image_url.url;
  }

  if (typeof parts === 'string') {
    if (parts.startsWith('data:image')) return parts;
    if (parts.length > 100) return `data:image/png;base64,${parts}`;
  }

  const img = message?.images?.[0] || data?.images?.[0] || data?.choices?.[0]?.images?.[0];
  if (img) {
    const url = img?.image_url?.url || img?.url || img?.b64_json || img?.image_base64;
    if (url) {
      if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:image'))) return url;
      if (typeof url === 'string' && url.length > 100) return `data:image/png;base64,${url}`;
    }
  }

  throw new Error('No se pudo extraer la imagen del resultado de OpenRouter.');
}
