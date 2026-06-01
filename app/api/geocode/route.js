import { NextResponse } from 'next/server';
import { searchAddress } from '@/lib/geocoding';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  if (q.length < 3) return NextResponse.json([]);
  try {
    const results = await searchAddress(q);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
