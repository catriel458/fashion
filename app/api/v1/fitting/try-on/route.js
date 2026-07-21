import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/apiAuth';
import { checkRateLimit, incrementUsage } from '@/lib/apiLimiter';
import { logRequest } from '@/lib/apiLogger';
import { processFitting } from '@/lib/fittingProcessor';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request) {
  const startTime = Date.now();
  let apiKeyId = null;
  let clientId = null;
  let limit = 100;
  let remaining = 100;
  let garmentsCount = 0;

  try {
    // 1. Validar la clave API en cabeceras
    const authResult = await validateApiKey(request);
    if (!authResult.valid) {
      await logRequest({
        apiKeyId: null,
        clientId: null,
        endpoint: '/api/v1/fitting/try-on',
        garmentsCount: 0,
        status: 'unauthorized',
        processingTimeMs: Date.now() - startTime,
        errorMessage: authResult.error
      });

      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { apiKey, client } = authResult;
    apiKeyId = apiKey.id;
    clientId = client.id;
    limit = apiKey.monthly_limit;
    remaining = limit - apiKey.requests_this_month;

    // 2. Control de límite mensual de peticiones (Rate Limit)
    const limitResult = checkRateLimit(apiKey);
    if (!limitResult.allowed) {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const resetDate = nextMonth.toISOString().slice(0, 10); // YYYY-MM-DD

      await logRequest({
        apiKeyId,
        clientId,
        endpoint: '/api/v1/fitting/try-on',
        garmentsCount: 0,
        status: 'rate_limited',
        processingTimeMs: Date.now() - startTime,
        errorMessage: 'Rate limit exceeded'
      });

      const limitHeaders = {
        ...corsHeaders,
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
      };

      return NextResponse.json(
        { error: 'Rate limit exceeded', remaining: 0, resetDate },
        { status: 429, headers: limitHeaders }
      );
    }

    // 3. Parsear el body y validar campos requeridos
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body.' },
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
          }
        }
      );
    }

    const { userPhoto, garments, height, weight } = body;
    garmentsCount = Array.isArray(garments) ? garments.length : 0;

    if (!userPhoto) {
      const errMessage = 'El campo "userPhoto" es obligatorio.';
      await logRequest({
        apiKeyId,
        clientId,
        endpoint: '/api/v1/fitting/try-on',
        garmentsCount,
        status: 'bad_request',
        processingTimeMs: Date.now() - startTime,
        errorMessage: errMessage
      });
      return NextResponse.json(
        { error: errMessage },
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
          }
        }
      );
    }

    if (!garments || !Array.isArray(garments) || garments.length < 1 || garments.length > 5) {
      const errMessage = 'El listado "garments" es obligatorio y debe ser un array con entre 1 y 5 elementos.';
      await logRequest({
        apiKeyId,
        clientId,
        endpoint: '/api/v1/fitting/try-on',
        garmentsCount,
        status: 'bad_request',
        processingTimeMs: Date.now() - startTime,
        errorMessage: errMessage
      });
      return NextResponse.json(
        { error: errMessage },
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
          }
        }
      );
    }

    // 4. Ejecutar simulación IA
    const fitResult = await processFitting({ userPhoto, garments, height, weight });

    // 5. Registrar e incrementar uso
    await incrementUsage(apiKeyId);

    const newRemaining = Math.max(0, remaining - 1);
    const newRequestsCount = apiKey.requests_this_month + 1;

    // 6. Escribir log de éxito
    const processingTimeMs = Date.now() - startTime;
    await logRequest({
      apiKeyId,
      clientId,
      endpoint: '/api/v1/fitting/try-on',
      garmentsCount,
      status: 'success',
      processingTimeMs,
      errorMessage: null
    });

    // 7. Retornar respuesta
    const responseHeaders = {
      ...corsHeaders,
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(newRemaining),
    };

    return NextResponse.json(
      {
        success: true,
        resultImageUrl: fitResult.resultImageUrl,
        expiresAt: fitResult.expiresAt,
        usage: {
          requestsThisMonth: newRequestsCount,
          monthlyLimit: limit,
          remaining: newRemaining
        }
      },
      { status: 200, headers: responseHeaders }
    );

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    await logRequest({
      apiKeyId,
      clientId,
      endpoint: '/api/v1/fitting/try-on',
      garmentsCount,
      status: 'error',
      processingTimeMs,
      errorMessage: error.message
    });

    const errHeaders = {
      ...corsHeaders,
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
    };

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: errHeaders }
    );
  }
}
