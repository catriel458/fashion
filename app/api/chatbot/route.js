import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CHATBOT_CONFIGS } from '@/lib/chatbot-prompts';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    let role = 'guest';

    if (session?.user) {
      const dbRole = session.user.role;
      if (dbRole === 'admin' || dbRole === 'superadmin') {
        role = 'admin';
      } else {
        role = 'buyer'; // mapped from visitor
      }
    }

    const config = CHATBOT_CONFIGS[role];
    return NextResponse.json({
      role,
      suggestions: config.suggestions
    });
  } catch (error) {
    console.error('Chatbot GET error:', error);
    return NextResponse.json({ error: 'Error al obtener sugerencias del chatbot' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'El cuerpo de la petición debe contener un arreglo de mensajes' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    let role = 'guest';

    if (session?.user) {
      const dbRole = session.user.role;
      if (dbRole === 'admin' || dbRole === 'superadmin') {
        role = 'admin';
      } else {
        role = 'buyer'; // mapped from visitor
      }
    }

    const config = CHATBOT_CONFIGS[role];
    const systemPrompt = config.systemPrompt;

    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not defined in the environment variables');
      return NextResponse.json({ error: 'El servicio de IA no está configurado (GROQ_API_KEY faltante)' }, { status: 500 });
    }

    // Call Groq API via direct fetch call to the OpenAI-compatible completions endpoint
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.2,
        max_tokens: 1024
      })
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('Groq API returned an error:', errText);
      return NextResponse.json({ error: 'Error en la respuesta del chatbot' }, { status: 500 });
    }

    const data = await groqResponse.json();
    const reply = data.choices?.[0]?.message?.content || 'Disculpa, no pude procesar tu mensaje en este momento.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chatbot POST error:', error);
    return NextResponse.json({ error: 'Error interno en el chatbot' }, { status: 500 });
  }
}
