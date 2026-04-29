// export async function GET(request) {
//   const apiKey = process.env.GEMINI_API_KEY;
//   const res = await fetch(
//     `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
//   );
//   const data = await res.json();
//   const imageModels = data.models?.filter(m => 
//     m.name.toLowerCase().includes('image') || 
//     m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('flash')
//   );
//   return Response.json(imageModels?.map(m => m.name) || data);
// }

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GEMINI_API_KEY no configurada en .env.local' }, { status: 500 });
  }

  const formData = await request.formData();
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

Generate a single realistic photographic image of that exact person wearing that exact garment. Requirements:
- Preserve the person's face, body shape, skin tone, hair, and original pose as faithfully as possible
- Reproduce the garment's color, pattern, texture, print, and design exactly as shown in the product photo
- Apply natural lighting, realistic fabric draping and wrinkles
- The result should look like a real photograph, not a digital composite
Return ONLY the image with no text, watermarks, or borders.`;

  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: personFile.type, data: personB64 } },
        { inline_data: { mime_type: garmentFile.type, data: garmentB64 } }
      ]
    }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  const data = await res.json();

  if (!res.ok) {
    return Response.json({ error: data?.error?.message || 'Error de Gemini API' }, { status: res.status });
  }

  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));

  if (!imgPart) {
    return Response.json({ error: 'Gemini no devolvió imagen. Probá con otras fotos.' }, { status: 422 });
  }

  return Response.json({
    image: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`
  });
}
