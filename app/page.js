'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import UserButton from '@/components/UserButton';

const CAROUSEL_ITEMS = [
  { gif: '/gifs/1.gif', label: 'Nueva colección' },
  { gif: '/gifs/2.gif', label: 'Probate todo' },
  { gif: '/gifs/3.gif', label: 'Las mejores marcas' },
  { gif: '/gifs/4.gif', label: 'Tu estilo, tu regla' },
  { gif: '/gifs/5.gif', label: 'Looks de temporada' },
];

// Tiendas se cargan dinámicamente desde la DB vía API

function StoreLogo({ store, isMobile }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = store.logo_url;

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={store.name}
        onError={() => setImgError(true)}
        style={{
          height: isMobile ? '44px' : '56px',
          maxWidth: '160px',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    );
  }

  return (
    <div style={{
      fontFamily: 'var(--font-serif)',
      fontSize: isMobile ? 22 : 26,
      color: '#0f0f0f',
      letterSpacing: '0.06em',
      fontWeight: 400,
    }}>
      {store.name}
    </div>
  );
}

export default function Home() {
  const [current,  setCurrent]  = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stores,   setStores]   = useState([]);

  useEffect(() => {
    fetch(`/api/stores?_=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setStores(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % CAROUSEL_ITEMS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--white)' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 1.2rem' : '0 2.5rem', height: isMobile ? 56 : 64,
        background: 'rgba(250,250,248,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '0.5px solid #e8e4df',
      }}>

        {/* Logo */}
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: isMobile ? 18 : 22, fontWeight: 400, letterSpacing: '0.08em' }}>
          FASHION<span style={{ color: 'var(--gray-dark)' }}>MALL</span>
        </div>

        {/* Links desktop */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '2rem', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-dark)' }}>
            <span style={{ cursor: 'pointer' }}>Tiendas</span>
            <span style={{ cursor: 'pointer' }}>Novedades</span>
            <span style={{ cursor: 'pointer' }}>Ofertas</span>
          </div>
        )}

        {/* Derecha */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <UserButton />
          <span style={{ fontSize: isMobile ? 22 : 20, cursor: 'pointer' }}>🛍</span>

          {/* Hamburguesa mobile */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 5, padding: 4,
              }}
            >
              <span style={{ display: 'block', width: 22, height: 1.5, background: menuOpen ? 'transparent' : '#1a1a1a', transition: 'all 0.2s' }} />
              <span style={{ display: 'block', width: 22, height: 1.5, background: '#1a1a1a', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translateY(4px)' : 'none' }} />
              <span style={{ display: 'block', width: 22, height: 1.5, background: '#1a1a1a', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translateY(-4px)' : 'none' }} />
            </button>
          )}
        </div>
      </nav>

      {/* ── MENÚ MOBILE DESPLEGABLE ── */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed', top: 56, left: 0, right: 0, zIndex: 99,
          background: 'rgba(250,250,248,0.97)', backdropFilter: 'blur(12px)',
          borderBottom: '0.5px solid #e8e4df',
          padding: '1.5rem 1.5rem 2rem',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          {['Tiendas', 'Novedades', 'Ofertas'].map(item => (
            <span key={item} style={{
              fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--gray-dark)', cursor: 'pointer',
              borderBottom: '0.5px solid #e8e4df', paddingBottom: 16,
            }}>
              {item}
            </span>
          ))}
        </div>
      )}

      {/* ── HERO CARROUSEL ── */}
      <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        {CAROUSEL_ITEMS.map((item, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${item.gif})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: i === current ? 1 : 0,
            transition: 'opacity 1s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
            <div style={{ position: 'relative', textAlign: 'center', color: '#fff', padding: isMobile ? '0 1.5rem' : '0 2rem' }}>
              <p style={{
                fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase',
                marginBottom: 14, opacity: 0.7, fontFamily: 'var(--font-sans)',
              }}>
                Tu shopping virtual
              </p>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: isMobile ? '2.8rem' : 'clamp(3rem, 8vw, 7rem)',
                fontWeight: 300, lineHeight: 1.1, marginBottom: 28,
                letterSpacing: '0.02em',
              }}>
                {item.label}
              </h1>
              <Link href="/#tiendas" style={{
                display: 'inline-block', fontSize: 11, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: '#fff',
                border: '0.5px solid rgba(255,255,255,0.6)',
                padding: isMobile ? '12px 28px' : '14px 36px', textDecoration: 'none',
              }}>
                Ver tiendas
              </Link>
            </div>
          </div>
        ))}

        {/* Dots */}
        <div style={{
          position: 'absolute', bottom: isMobile ? 24 : 32,
          left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 8,
        }}>
          {CAROUSEL_ITEMS.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)} style={{
              width: i === current ? 24 : 6, height: 6, borderRadius: 3,
              background: i === current ? '#fff' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.3s',
            }} />
          ))}
        </div>
      </div>

      {/* ── SECCIÓN MARCAS ── */}
      <section id="tiendas" style={{ padding: isMobile ? '56px 1.2rem' : '80px 2.5rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 56 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gray-dark)', marginBottom: 12 }}>
            Nuestras tiendas
          </p>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: isMobile ? '1.8rem' : 'clamp(2rem, 4vw, 3.5rem)',
            fontWeight: 300,
          }}>
            Las mejores marcas, en un solo lugar
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: isMobile ? 10 : 16,
        }}>
          {stores.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--gray-dark)', fontSize: 13, padding: '32px 0' }}>
              Cargando tiendas...
            </div>
          ) : stores.map(store => (
            <Link key={store.id} href={`/store/${store.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                border: '0.5px solid #e0dbd4', borderRadius: 10,
                overflow: 'hidden', background: '#fff', cursor: 'pointer',
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.borderColor = '#ccc'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e0dbd4'; }}
              >
                {/* Zona de logo/nombre — fondo blanco */}
                <div style={{
                  padding: isMobile ? '28px 16px 20px' : '36px 20px 24px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  minHeight: isMobile ? '110px' : '130px', gap: '8px',
                }}>
                  <StoreLogo store={store} isMobile={isMobile} />
                  {store.tagline && (
                    <div style={{ fontSize: 10, color: '#6b6560', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {store.tagline}
                    </div>
                  )}
                </div>
                {/* Franja de color de marca abajo */}
                <div style={{ height: '5px', background: store.primary_color || '#009aae' }} />
              </div>
            </Link>
          ))}
        </div>
      </section>


      {/* ── FOOTER ── */}
<footer style={{
  borderTop: '0.5px solid #e8e4df',
  padding: isMobile ? '32px 1.5rem' : '40px 2.5rem',
  display: 'flex',
  flexDirection: isMobile ? 'column' : 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: isMobile ? 16 : 0,
  background: 'var(--white)',
}}>
  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, letterSpacing: '0.08em', color: '#1a1a1a' }}>
    FASHION<span style={{ color: 'var(--gray-dark)' }}>MALL</span>
  </div>

  <div style={{ display: 'flex', gap: '2rem', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-dark)' }}>
    <span style={{ cursor: 'pointer' }}>Tiendas</span>
    <span style={{ cursor: 'pointer' }}>Contacto</span>
  </div>

  <div style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.06em' }}>
    © {new Date().getFullYear()} FashionMall
  </div>
</footer>

    </div>
  );
}