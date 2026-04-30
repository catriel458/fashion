export const maxDuration = 60;

export async function POST(request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'OPENROUTER_API_KEY no configurada en .env.local' }, { status: 500 });
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

  const parts = data?.choices?.[0]?.message?.content;

  // LOG para ver la estructura exacta en Vercel Logs
  console.log('PARTS TYPE:', typeof parts);
  console.log('FULL RESPONSE:', JSON.stringify(data?.choices?.[0]?.message, null, 2));

  if (Array.isArray(parts)) {
    const imgPart = parts.find(p => p.type === 'image_url');
    if (imgPart?.image_url?.url) {
      return Response.json({ image: imgPart.image_url.url });
    }
  }

  if (typeof parts === 'string' && parts.startsWith('data:image')) {
    return Response.json({ image: parts });
  }

  // A veces OpenRouter devuelve base64 puro sin el prefijo data:
  if (typeof parts === 'string' && parts.length > 1000) {
    return Response.json({ image: `data:image/png;base64,${parts}` });
  }

  const textPart = Array.isArray(parts) ? parts.find(p => p.type === 'text')?.text : parts;
  return Response.json({
    error: `No se generó imagen. Respuesta: ${textPart || JSON.stringify(data).substring(0, 300)}`
  }, { status: 422 });
}