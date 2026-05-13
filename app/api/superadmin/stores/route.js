import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function GET() {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const stores = await sql`
      SELECT s.*,
        COUNT(DISTINCT p.id)::int AS product_count,
        (SELECT u.username FROM users u WHERE u.store_id = s.id AND u.role = 'admin' LIMIT 1) AS admin_name
      FROM stores s
      LEFT JOIN products p ON p.store_id = s.id
      GROUP BY s.id
      ORDER BY s.name
    `;
    return NextResponse.json(stores);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const body = await req.json();
    const {
      name, tagline, primary_color, secondary_color, accent_color, font_family,
      button_style, hero_title, hero_subtitle, hero_button_text, hero_season, about_text,
      social_instagram, social_whatsapp, social_facebook, contact_email, contact_phone,
      header_color, footer_color,
      header_font, header_font_size, header_text_color,
      footer_font, footer_font_size, footer_text_color,
      initial_categories,
    } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });

    const slug = slugify(name);

    const store = await sql`
      INSERT INTO stores (
        name, slug, tagline, primary_color, secondary_color, accent_color, font_family,
        button_style, hero_title, hero_subtitle, hero_button_text, hero_season, about_text,
        social_instagram, social_whatsapp, social_facebook, contact_email, contact_phone,
        header_color, footer_color,
        header_font, header_font_size, header_text_color,
        footer_font, footer_font_size, footer_text_color
      )
      VALUES (
        ${name.trim()},
        ${slug},
        ${tagline || null},
        ${primary_color || '#009aae'},
        ${secondary_color || '#ffffff'},
        ${accent_color || '#0f0f0f'},
        ${font_family || 'Inter'},
        ${button_style || 'rounded'},
        ${hero_title || null},
        ${hero_subtitle || null},
        ${hero_button_text || 'Ver colección'},
        ${hero_season || null},
        ${about_text || null},
        ${social_instagram || null},
        ${social_whatsapp || null},
        ${social_facebook || null},
        ${contact_email || null},
        ${contact_phone || null},
        ${header_color || null},
        ${footer_color || null},
        ${header_font || null},
        ${header_font_size || null},
        ${header_text_color || null},
        ${footer_font || null},
        ${footer_font_size || null},
        ${footer_text_color || null}
      )
      RETURNING *
    `;

    // Crear categorías iniciales si fueron especificadas
    if (Array.isArray(initial_categories) && initial_categories.length > 0) {
      for (const catName of initial_categories) {
        if (!catName?.trim()) continue;
        const catSlug = slugify(catName);
        await sql`
          INSERT INTO categories (name, slug, store_id)
          VALUES (${catName.trim()}, ${catSlug}, ${store[0].id})
          ON CONFLICT DO NOTHING
        `.catch(() => {});
      }
    }

    return NextResponse.json(store[0], { status: 201 });
  } catch (error) {
    if (error.message.includes('unique')) return NextResponse.json({ error: 'Ya existe una tienda con ese nombre/slug' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
