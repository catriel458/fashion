import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  return NextResponse.json(tables.map(t => t.table_name));
}
