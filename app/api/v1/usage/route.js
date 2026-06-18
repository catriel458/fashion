import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/apiAuth';

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

export async function GET(request) {
  try {
    // 1. Validar clave de API provista
    const authResult = await validateApiKey(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { apiKey, client } = authResult;
    const limit = apiKey.monthly_limit;
    const usage = apiKey.requests_this_month;
    const remaining = Math.max(0, limit - usage);

    const responseHeaders = {
      ...corsHeaders,
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
    };

    return NextResponse.json(
      {
        plan: client.plan,
        requestsThisMonth: usage,
        monthlyLimit: limit,
        remaining,
        lastUsedAt: apiKey.last_used_at ? new Date(apiKey.last_used_at).toISOString() : null
      },
      { status: 200, headers: responseHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
