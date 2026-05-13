import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) return null;
  return session;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const storeId = session.user.role === 'superadmin' ? null : session.user.store_id;
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    const stores = await sql`SELECT * FROM stores WHERE id = ${storeId}`;
    if (stores.length === 0) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    const images = await sql`SELECT * FROM store_images WHERE store_id = ${storeId} ORDER BY sort_order, id`;
    return NextResponse.json({ ...stores[0], images });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const storeId = session.user.store_id;
  if (!storeId) return NextResponse.json({ error: 'Sin tienda asignada' }, { status: 404 });

  try {
    const body = await request.json();
    const {
      name, tagline, primary_color, secondary_color, accent_color, font_family,
      button_style, hero_title, hero_subtitle, hero_button_text, hero_season, about_text,
      social_instagram, social_whatsapp, social_facebook, contact_email, contact_phone,
      header_color, footer_color,
      header_font, header_font_size, header_text_color,
      footer_font, footer_font_size, footer_text_color,
      panel_bg_color, panel_text_color,
    } = body;

    const existing = await sql`SELECT * FROM stores WHERE id = ${storeId}`;
    if (existing.length === 0) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    const prev = existing[0];

    const store = await sql`
      UPDATE stores SET
        name             = ${name             ?? prev.name},
        tagline          = ${tagline          ?? prev.tagline},
        primary_color    = ${primary_color    ?? prev.primary_color},
        secondary_color  = ${secondary_color  ?? prev.secondary_color},
        accent_color     = ${accent_color     ?? prev.accent_color},
        font_family      = ${font_family      ?? prev.font_family},
        button_style     = ${button_style     ?? prev.button_style},
        hero_title       = ${hero_title       ?? prev.hero_title},
        hero_subtitle    = ${hero_subtitle    ?? prev.hero_subtitle},
        hero_button_text = ${hero_button_text ?? prev.hero_button_text},
        hero_season      = ${hero_season      ?? prev.hero_season},
        about_text       = ${about_text       ?? prev.about_text},
        social_instagram = ${social_instagram ?? prev.social_instagram},
        social_whatsapp  = ${social_whatsapp  ?? prev.social_whatsapp},
        social_facebook  = ${social_facebook  ?? prev.social_facebook},
        contact_email    = ${contact_email    ?? prev.contact_email},
        contact_phone    = ${contact_phone    ?? prev.contact_phone},
        header_color      = ${header_color      ?? prev.header_color},
        footer_color      = ${footer_color      ?? prev.footer_color},
        header_font       = ${header_font       ?? prev.header_font},
        header_font_size  = ${header_font_size  ?? prev.header_font_size},
        header_text_color = ${header_text_color ?? prev.header_text_color},
        footer_font       = ${footer_font       ?? prev.footer_font},
        footer_font_size  = ${footer_font_size  ?? prev.footer_font_size},
        footer_text_color = ${footer_text_color ?? prev.footer_text_color},
        panel_bg_color    = ${panel_bg_color    ?? prev.panel_bg_color},
        panel_text_color  = ${panel_text_color  ?? prev.panel_text_color},
        updated_at        = NOW()
      WHERE id = ${storeId}
      RETURNING *
    `;
    return NextResponse.json(store[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
