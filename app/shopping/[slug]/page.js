import Link from 'next/link';
import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import ShoppingHero from '@/components/shopping/ShoppingHero';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = params;
  const [shopping] = await sql`SELECT name, tagline FROM shoppings WHERE slug = ${slug} AND active = true LIMIT 1`;
  if (!shopping) return { title: 'Shopping no encontrado' };
  return {
    title: `${shopping.name} — TnB Fashion`,
    description: shopping.tagline || 'Explorá las mejores marcas en nuestro shopping colectivo interactivo.',
  };
}

export default async function PublicShoppingPage({ params }) {
  const { slug } = params;

  // 1. Obtener shopping
  const [shopping] = await sql`
    SELECT * FROM shoppings 
    WHERE slug = ${slug} AND active = true 
    LIMIT 1
  `;

  if (!shopping) {
    notFound();
  }

  // 2. Obtener tiendas del shopping
  const stores = await sql`
    SELECT * FROM stores 
    WHERE shopping_id = ${shopping.id} AND active = true 
    ORDER BY name ASC
  `;

  const primaryColor = shopping.primary_color || '#009aae';
  const secondaryColor = shopping.secondary_color || '#ffffff';
  const fontFamily = shopping.font_family || 'Inter';

  // Combinaciones estilísticas
  const activeFonts = Array.from(new Set([fontFamily].filter(Boolean)));

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', fontFamily: `${fontFamily}, sans-serif` }}>
      {activeFonts.map(f => (
        <link key={f} rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`} />
      ))}

      {/* Header */}
      <header style={{
        background: '#fff', borderBottom: '0.5px solid #cbd5e1', padding: '16px clamp(1rem, 4vw, 3rem)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {shopping.logo_url ? (
            <img src={shopping.logo_url} alt={shopping.name} style={{ height: '36px', maxWidth: '160px', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontFamily: `${fontFamily}, var(--font-serif)`, fontWeight: 700, fontSize: '1.25rem', letterSpacing: '0.02em', color: '#0f0f0f' }}>
              {shopping.name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/login" style={{
            fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0f0f0f',
            textDecoration: 'none', border: '0.5px solid #0f0f0f', padding: '8px 16px', borderRadius: '2px', fontWeight: 600
          }}>
            Login Admin
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section style={{
        background: `linear-gradient(135deg, ${primaryColor}1a, ${primaryColor}05)`,
        padding: 'clamp(3.5rem, 8vw, 6rem) clamp(1.2rem, 4vw, 3rem)',
        textAlign: 'center', borderBottom: '0.5px solid #cbd5e1'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {shopping.tagline && (
            <span style={{ fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: primaryColor, fontWeight: 700, display: 'block', marginBottom: '8px' }}>
              {shopping.tagline}
            </span>
          )}
          <h1 style={{
            fontFamily: `var(--font-serif)`, fontWeight: 300,
            fontSize: 'clamp(2rem, 5vw, 3.4rem)', margin: '0 0 16px', letterSpacing: '0.02em',
            color: '#0f0f0f', lineHeight: 1.15
          }}>
            {shopping.hero_title || `Bienvenido a ${shopping.name}`}
          </h1>
          <p style={{ margin: 0, color: '#6b6560', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', lineHeight: 1.6 }}>
            {shopping.hero_subtitle || 'Explorá las mejores marcas con probador virtual interactivo y hace tu pedido directo por WhatsApp.'}
          </p>
        </div>
      </section>

      {/* Main Grid: Stores */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(2.5rem, 6vw, 4rem) clamp(1rem, 4vw, 2.5rem)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: '1.8rem', margin: '0 0 8px', letterSpacing: '0.02em', color: '#0f0f0f' }}>
            Nuestras Tiendas Comerciales
          </h2>
          <p style={{ margin: 0, color: '#6b6560', fontSize: '0.85rem' }}>
            Hacé clic en cualquier marca para ver su catálogo, probarse prendas online y realizar pedidos.
          </p>
        </div>

        {stores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', background: '#fff', border: '0.5px solid #cbd5e1', borderRadius: '4px', color: '#6b6560' }}>
            Sin marcas registradas actualmente en este shopping.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {stores.map(store => {
              const radius = store.button_style === 'pill' ? '999px' : store.button_style === 'sharp' ? '0px' : '4px';
              return (
                <div key={store.id} style={{
                  background: '#fff', border: '0.5px solid #cbd5e1', borderRadius: '4px',
                  display: 'flex', flexDirection: 'column', overflow: 'hidden',
                  transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.01)'
                }} className="store-card">
                  {/* Banner mini */}
                  <div style={{
                    height: '80px', background: store.header_color || store.primary_color || primaryColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px',
                    position: 'relative'
                  }}>
                    {store.logo_url ? (
                      <img src={store.logo_url} alt="" style={{ height: '36px', maxWidth: '140px', objectFit: 'contain', background: '#fff', padding: '4px', borderRadius: '2px', border: '1px solid rgba(0,0,0,0.08)' }} />
                    ) : (
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.05em' }}>
                        {store.name}
                      </span>
                    )}
                  </div>

                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 600, color: '#0f0f0f' }}>{store.name}</h3>
                    <p style={{ margin: '0 0 16px', color: '#6b6560', fontSize: '0.8rem', lineHeight: 1.4, flex: 1 }}>
                      {store.tagline || 'Visita nuestra tienda para ver toda la colección de temporada.'}
                    </p>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Link href={`/store/${store.slug}`} style={{ flex: 1, textDecoration: 'none' }}>
                        <button style={{
                          width: '100%', background: store.accent_color || '#0f0f0f', color: '#fff',
                          border: 'none', padding: '10px 14px', cursor: 'pointer', borderRadius: radius,
                          fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600
                        }}>
                          Ver Catálogo
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* About Section */}
        {shopping.description && (
          <section style={{ marginTop: '72px', borderTop: '0.5px solid #cbd5e1', paddingTop: '48px', maxWidth: '800px', margin: '72px auto 0' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: '1.5rem', margin: '0 0 16px', color: '#0f0f0f' }}>
              Sobre Nosotros
            </h3>
            <p style={{ margin: 0, color: '#6b6560', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {shopping.description}
            </p>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer style={{ background: '#0f0f0f', color: '#8b847f', padding: '48px 24px', textAlign: 'center', fontSize: '0.8rem', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontFamily: `var(--font-serif)`, fontSize: '1.2rem', color: '#fff', marginBottom: '8px', letterSpacing: '0.02em' }}>
            {shopping.name}
          </div>
          {shopping.tagline && <div style={{ marginBottom: '24px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{shopping.tagline}</div>}
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} {shopping.name}. Todos los derechos reservados. <br />
            Powered by TnB Fashion.
          </div>
        </div>
      </footer>
    </div>
  );
}
