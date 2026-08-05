import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stores = await sql`
      SELECT id, name, slug, tagline, logo_url, primary_color, secondary_color, font_family, active, fitting_plan, featured_until,
             (SELECT image_url FROM store_images WHERE store_id = stores.id ORDER BY sort_order, id LIMIT 1) AS cover_image_url
      FROM stores
      WHERE active = true 
        AND (is_independent = false OR is_independent IS NULL)
        AND shopping_id IS NULL
      ORDER BY name
    `;

    const now = new Date();
    
    // Filtramos tiendas destacadas activas con planes válidos (pro o scale)
    const activeFeatured = stores.filter(s => {
      if (!s.featured_until) return false;
      const expDate = new Date(s.featured_until);
      const isPlanEligible = s.fitting_plan === 'pro' || s.fitting_plan === 'scale';
      return expDate > now && isPlanEligible;
    });

    let featuredStore = null;
    if (activeFeatured.length > 0) {
      // Ordenamos por vencimiento más lejano
      activeFeatured.sort((a, b) => new Date(b.featured_until) - new Date(a.featured_until));
      featuredStore = activeFeatured[0];
      featuredStore.is_featured_by_payment = true;
    } else if (stores.length > 0) {
      // Rotación automática diaria usando el día del año como semilla
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const daySeed = Math.floor((now - startOfYear) / 86400000);
      
      // Ordenamos por ID para tener un índice estable
      const sortedForRotation = [...stores].sort((a, b) => a.id - b.id);
      const rotationIndex = daySeed % sortedForRotation.length;
      featuredStore = sortedForRotation[rotationIndex];
      featuredStore.is_featured_by_payment = false;
    }

    let finalStores = [];
    if (featuredStore) {
      // Creamos una copia para añadir is_featured_by_payment
      const featuredCopy = { ...featuredStore };
      finalStores.push(featuredCopy);
      
      // Añadimos el resto de tiendas manteniendo su orden original (alfabético por nombre)
      const rest = stores
        .filter(s => s.id !== featuredStore.id)
        .map(s => ({ ...s, is_featured_by_payment: false }));
      finalStores = [...finalStores, ...rest];
    } else {
      finalStores = stores.map(s => ({ ...s, is_featured_by_payment: false }));
    }

    return NextResponse.json(finalStores);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
