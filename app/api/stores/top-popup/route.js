import sql from '@/lib/db.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, name, slug, welcome_popup_discount, primary_color
      FROM stores
      WHERE welcome_popup_enabled = true
      ORDER BY welcome_popup_discount DESC
      LIMIT 1
    `;
    if (!rows.length) {
      return Response.json(null, { status: 404 });
    }
    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
