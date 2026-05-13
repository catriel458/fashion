import { CartProvider } from '@/components/CartContext';
import StoreNavbar from '@/components/StoreNavbar';
import CartSidebar from '@/components/CartSidebar';
import FittingRoomPanel from '@/components/FittingRoomPanel';
import StoreThemeProvider from '@/components/StoreThemeProvider';
import sql from '@/lib/db';
import { notFound } from 'next/navigation';

async function getStore(slug) {
  try {
    const rows = await sql`SELECT * FROM stores WHERE slug = ${slug} AND active = true`;
    return rows[0] || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const store = await getStore(params.storeSlug);
  return {
    title: `${store?.name || params.storeSlug} — CnB`,
    description: store?.tagline || `Tienda en CnB`,
  };
}

export default async function StoreLayout({ children, params }) {
  const { storeSlug } = params;
  const store = await getStore(storeSlug);
  if (!store) notFound();

  return (
    <CartProvider>
      <StoreThemeProvider store={store} />
      <StoreNavbar
        storeSlug={storeSlug}
        storeName={store.name}
        storeLogo={store.logo_url || null}
        headerBg={store.header_color || null}
        headerTextColor={store.header_text_color || null}
        headerFont={store.header_font || null}
        headerFontSize={store.header_font_size || null}
        primaryColor={store.primary_color || '#009aae'}
      />
      <CartSidebar storeSlug={storeSlug} />
      <FittingRoomPanel />
      {children}
    </CartProvider>
  );
}
