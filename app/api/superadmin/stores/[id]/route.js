import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { del } from '@vercel/blob';
import sql from '@/lib/db';

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function GET(request, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const stores = await sql`SELECT * FROM stores WHERE id = ${id}`;
    if (stores.length === 0) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    const images = await sql`SELECT * FROM store_images WHERE store_id = ${id} ORDER BY sort_order, id`;
    const admin  = await sql`SELECT id, username, email FROM users WHERE store_id = ${id} AND role = 'admin' LIMIT 1`;
    return NextResponse.json({ ...stores[0], images, admin: admin[0] || null });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;
    const body = await request.json();
    const {
      name, tagline, primary_color, secondary_color, accent_color, font_family,
      button_style, hero_title, hero_subtitle, hero_button_text, hero_season, about_text,
      social_instagram, social_whatsapp, social_facebook, contact_email, contact_phone, active,
      header_color, footer_color,
      header_font, header_font_size, header_text_color,
      footer_font, footer_font_size, footer_text_color,
      panel_bg_color, panel_text_color,
    } = body;

    const existing = await sql`SELECT * FROM stores WHERE id = ${id}`;
    if (existing.length === 0) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
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
        active           = ${active           ?? prev.active},
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
      WHERE id = ${id}
      RETURNING *
    `;
    revalidatePath(`/store/${store[0].slug}`);
    return NextResponse.json(store[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { id } = params;

    const [store] = await sql`SELECT id, logo_url FROM stores WHERE id = ${id}`;
    if (!store) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

    const categoryRows = await sql`SELECT image_url FROM categories WHERE store_id = ${id} AND image_url IS NOT NULL`;
    const productRows = await sql`SELECT image_url FROM products WHERE store_id = ${id} AND image_url IS NOT NULL`;
    const galleryRows = await sql`SELECT image_url FROM store_images WHERE store_id = ${id}`;

    await sql`DELETE FROM stores WHERE id = ${id}`;

    const urls = new Set();
    if (store.logo_url) urls.add(store.logo_url);
    for (const row of categoryRows) if (row.image_url) urls.add(row.image_url);
    for (const row of productRows) if (row.image_url) urls.add(row.image_url);
    for (const row of galleryRows) if (row.image_url) urls.add(row.image_url);

    for (const url of urls) {
      try { await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
