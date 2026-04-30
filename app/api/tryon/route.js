export const maxDuration = 60;

export async function POST(request) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: 'OPENROUTER_API_KEY no configurada' },
      { status: 500 }
    );
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
  const prompt = `You are a virtual try-on AI.
Put the garment from the second image onto the person in the first image.

Keep:
- same face
- same body
- same pose

Garment must match exactly (color, texture, print).

Return ONLY a base64 image. No text.`;

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

  // 🧪 DEBUG (activar si necesitás)
  // console.log("FULL RESPONSE:", JSON.stringify(data, null, 2));

  const message = data?.choices?.[0]?.message;
  const parts = message?.content;

  // =========================
  // 🟢 CASO 1: image_base64
  // =========================
  if (Array.isArray(parts)) {
    const base64Img = parts.find(p => p.image_base64);
    if (base64Img?.image_base64) {
      return Response.json({
        image: `data:image/png;base64,${base64Img.image_base64}`
      });
    }

    const imgUrl = parts.find(p => p.type === 'image_url');
    if (imgUrl?.image_url?.url) {
      return Response.json({ image: imgUrl.image_url.url });
    }
  }

  // =========================
  // 🟢 CASO 2: string directo
  // =========================
  if (typeof parts === 'string') {
    if (parts.startsWith('data:image')) {
      return Response.json({ image: parts });
    }

    if (parts.length > 100) {
      return Response.json({
        image: `data:image/png;base64,${parts}`
      });
    }
  }

  // =========================
  // 🟢 CASO 3: images (TU CASO)
  // =========================
  const img =
    message?.images?.[0] ||
    data?.images?.[0] ||
    data?.choices?.[0]?.images?.[0];

  if (img) {
    const url =
      img?.image_url?.url ||
      img?.url ||
      img?.b64_json ||
      img?.image_base64;

    if (url) {
      // URL directa
      if (typeof url === 'string' &&
        (url.startsWith('http') || url.startsWith('data:image'))
      ) {
        return Response.json({ image: url });
      }

      // base64 puro
      if (typeof url === 'string' && url.length > 100) {
        return Response.json({
          image: `data:image/png;base64,${url}`
        });
      }
    }
  }

  // =========================
  // 🔴 ERROR FINAL
  // =========================
  return Response.json(
    {
      error: 'No se pudo extraer la imagen',
      debug: {
        hasMessage: !!message,
        hasContent: !!parts,
        hasImages: !!message?.images
      }
    },
    { status: 422 }
  );
}