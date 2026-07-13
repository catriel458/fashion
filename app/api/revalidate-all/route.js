import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Revalidar la página global de tiendas
    revalidatePath('/stores');

    // 2. Obtener todas las tiendas y sus categorías para revalidarlas todas
    const stores = await sql`SELECT id, slug FROM stores`;
    for (const store of stores) {
      // Revalidar el home de la tienda
      revalidatePath(`/store/${store.slug}`);
      
      // Revalidar cada una de las categorías de la tienda
      const categories = await sql`SELECT slug FROM categories WHERE store_id = ${store.id}`;
      for (const cat of categories) {
        revalidatePath(`/store/${store.slug}/category/${cat.slug}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Se ha purgado la caché de todas las tiendas y categorías correctamente.' 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
