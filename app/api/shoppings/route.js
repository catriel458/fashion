import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const shoppings = await sql`
      SELECT s.*, 
             (SELECT COUNT(*)::int FROM stores st WHERE st.shopping_id = s.id AND st.active = true) AS store_count
      FROM shoppings s
      WHERE s.active = true
      ORDER BY s.name ASC
    `;
    return NextResponse.json(shoppings);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
