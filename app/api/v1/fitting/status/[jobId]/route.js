import { NextResponse } from 'next/server';

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

export async function GET(request, { params }) {
  const { jobId } = params;

  // REEMPLAZAR: cuando el procesamiento sea async, consultar estado real del job
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  return NextResponse.json(
    {
      jobId,
      status: 'completed',
      resultImageUrl: 'https://placehold.co/600x800',
      expiresAt
    },
    { status: 200, headers: corsHeaders }
  );
}
