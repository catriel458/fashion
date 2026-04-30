export const maxDuration = 60;

export async function POST(request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'OPENROUTER_API_KEY no configurada' }, { status: 500 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (e) {
    return Response.json({ error: 'Error leyendo el form: ' + e.message }, { status: 400 });
  }

  const personFile = formData.get('person');
  const garmentFile = formData.get('garment');

  if (!personFile || !garmentFile) {
    return Response.json({ error: 'Faltan imágenes' }, { status: 400 });
  }

  const toBase64 = async (file) => {
    const buffer = await file.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  };

  const personB64 = await toBase64(personFile);
  const garmentB64 = await toBase64(garmentFile);

  const prompt = `You are a virtual try-on AI for a fashion e-commerce platform.
The first image shows a person (the customer).
The second image shows a clothing item (the garment to try on).
Generate a single realistic photographic image of that exact person wearing that exact garment.
- Preserve the person's face, body shape, skin tone, hair, and original pose
- Reproduce the garment's color, pattern, texture exactly
- Apply natural lighting and realistic fabric draping
Return ONLY the image.`;

  const body = {
    model: 'google/gemini-2.5-flash-image',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:${personFile.type};base64,${personB64}` } },
        { type: 'image_url', image_url: { url: `data:${garmentFile.type};base64,${garmentB64}` } }
      ]
    }],
    modalities: ['image', 'text']
  };

  let res, rawText;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);
    rawText = await res.text();
  } catch (e) {
    if (e.name === 'AbortError') {
      return Response.json({ error: 'Timeout: la generación tardó más de 55 segundos.' }, { status: 504 });
    }
    return Response.json({ error: 'Error de red: ' + e.message }, { status: 502 });
  }

  if (!rawText || rawText.trim() === '') {
    return Response.json({ error: 'Respuesta vacía de OpenRouter.' }, { status: 500 });
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    return Response.json({ error: 'Respuesta inválida: ' + rawText.substring(0, 200) }, { status: 500 });
  }

  if (!res.ok) {
    return Response.json({ error: data?.error?.message || `Error HTTP ${res.status}` }, { status: res.status });
  }

  const message = data?.choices?.[0]?.message;
  const parts = message?.content;

  // Caso 1: content es array con image_url
  if (Array.isArray(parts)) {
    const imgPart = parts.find(p => p.type === 'image_url');
    if (imgPart?.image_url?.url) {
      return Response.json({ image: imgPart.image_url.url });
    }
    const txtPart = parts.find(p => p.type === 'text');
    if (txtPart?.text) {
      return Response.json({ error: `Gemini respondió texto: ${txtPart.text.substring(0, 200)}` }, { status: 422 });
    }
  }

  // Caso 2: content es string con data URL
  if (typeof parts === 'string') {
    if (parts.startsWith('data:image')) {
      return Response.json({ image: parts });
    }
    // Caso 3: string base64 puro sin prefijo
    if (parts.length > 500) {
      return Response.json({ image: `data:image/png;base64,${parts}` });
    }
    return Response.json({ error: `Sin imagen. Respuesta: ${parts.substring(0, 300)}` }, { status: 422 });
  }

  // Caso 4: imagen en message.images (formato alternativo de OpenRouter)
  const imageData = message?.images?.[0];
  if (imageData) {
    const url = imageData?.image_url?.url || imageData?.url;
    if (url) return Response.json({ image: url });
  }

  return Response.json({
    error: `Formato desconocido. content type: ${typeof parts}. Keys del mensaje: ${Object.keys(message || {}).join(', ')}`
  }, { status: 422 });
}