'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import UserButton from '@/components/UserButton';
import WelcomePopupGeneral from '@/components/WelcomePopupGeneral';

const CAROUSEL_ITEMS = [
  { gif: '/gifs/1.gif', label: 'Nueva colección' },
  { gif: '/gifs/2.gif', label: 'Probate todo' },
  { gif: '/gifs/3.gif', label: 'Las mejores marcas' },
  { gif: '/gifs/4.gif', label: 'Tu estilo, tu regla' },
  { gif: '/gifs/5.gif', label: 'Looks de temporada' },
];

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
  const [topPopup, setTopPopup] = useState(null);

  useEffect(() => {
    fetch(`/api/stores?_=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setStores(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch(`/api/stores/top-popup?_=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setTopPopup(data); })
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
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: isMobile ? 18 : 22, fontWeight: 400, letterSpacing: '0.08em' }}>TnB</span>
          </Link>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gray-dark)', marginTop: 1 }}>Try & Buy</span>
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
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.3) 100%)' }} />
            <div style={{ position: 'relative', textAlign: 'center', color: '#fff', padding: isMobile ? '0 1.5rem' : '0 2rem' }}>
              <p style={{
                fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase',
                marginBottom: 14, opacity: 0.7, fontFamily: 'var(--font-sans)',
              }}>
                Try & Buy
              </p>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: isMobile ? '2.8rem' : 'clamp(3rem, 8vw, 7rem)',
                fontWeight: 300, lineHeight: 1.1, marginBottom: 28,
                letterSpacing: '0.02em',
              }}>
                {item.label}
              </h1>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/stores#tiendas" style={{
                  display: 'inline-block', fontSize: 11, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: '#fff',
                  border: '0.5px solid rgba(255,255,255,0.6)',
                  padding: isMobile ? '12px 28px' : '14px 36px', textDecoration: 'none',
                }}>
                  Ver tiendas
                </Link>
                <a href="#editorial-section" style={{
                  fontSize: 11, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: '#fff',
                  textDecoration: 'underline', textUnderlineOffset: '6px',
                  fontWeight: 500, cursor: 'pointer',
                }}>
                  Descubrir novedades
                </a>
              </div>
            </div>
          </div>
        ))}

        {/* Slim Progress Bar Indicator */}
        <div style={{
          position: 'absolute', bottom: isMobile ? 32 : 40,
          left: '50%', transform: 'translateX(-50%)',
          width: '180px', height: '2px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '1px',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        onClick={() => setCurrent(c => (c + 1) % CAROUSEL_ITEMS.length)}
        title="Siguiente slide"
        >
          <div style={{
            width: `${((current + 1) / CAROUSEL_ITEMS.length) * 100}%`,
            height: '100%',
            background: '#fff',
            transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }} />
        </div>
      </div>

      {/* ── TIRA DE CONFIANZA ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{
          background: '#f4f3f0',
          borderBottom: '0.5px solid #e8e4df',
          padding: '16px 1rem',
          color: '#6b6560',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.72rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '12px' : '0px',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <span>Envío a todo el país</span>
          </div>
          {!isMobile && <span style={{ opacity: 0.3 }}>|</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            <span>Cambios simples</span>
          </div>
          {!isMobile && <span style={{ opacity: 0.3 }}>|</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Pago 100% seguro</span>
          </div>
          {!isMobile && <span style={{ opacity: 0.3 }}>|</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <span>Atención exclusiva</span>
          </div>
        </div>
      </motion.div>

      {/* ── SECCIÓN EDITORIAL ── */}
      <motion.section
        id="editorial-section"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.0 }}
        style={{
          padding: isMobile ? '64px 1.2rem' : '100px 2.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: isMobile ? '32px' : '64px',
        }}
      >
        {/* Image side */}
        <div style={{
          flex: 1,
          width: '100%',
          height: isMobile ? '320px' : '480px',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
        }}>
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop"
            alt="Tendencia de la semana"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Text side */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.72rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--gray-dark)',
            marginBottom: '16px',
            fontWeight: 600,
            display: 'block',
          }}>
            Tendencia de la semana
          </span>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: isMobile ? '2rem' : '3.4rem',
            fontWeight: 300,
            lineHeight: 1.15,
            color: 'var(--black)',
            margin: '0 0 24px 0',
            letterSpacing: '0.01em',
          }}>
            La sofisticación de la sastrería relajada
          </h2>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            lineHeight: 1.7,
            color: '#4a4540',
            margin: '0 0 32px 0',
            fontWeight: 300,
          }}>
            Esta temporada, las siluetas holgadas y las texturas naturales redefinen la elegancia cotidiana. Descubrí cómo combinar prendas atemporales con tecnología interactiva en nuestro probador virtual para crear un guardarropa inteligente y adaptado a tu estilo.
          </p>
          <div>
            <a href="#tiendas" style={{
              display: 'inline-block',
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--black)',
              borderBottom: '1px solid var(--black)',
              textDecoration: 'none',
              paddingBottom: '4px',
              fontWeight: 600,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Explorar Colecciones →
            </a>
          </div>
        </div>
      </motion.section>

      {/* ── SECCIÓN MARCAS ── */}
      <section id="tiendas" style={{ padding: isMobile ? '56px 1.2rem' : '80px 2.5rem', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 56 }}
        >
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
        </motion.div>

        <div className="bento-grid">
          {stores.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--gray-dark)', fontSize: 13, padding: '32px 0' }}>
              Cargando tiendas...
            </div>
          ) : stores.map((store, index) => {
            const isFirst = index === 0;
            const gridColumn = isFirst ? 'span 2' : 'span 1';
            const gridRow = isFirst ? (isMobile ? 'span 1' : 'span 2') : 'span 1';
            const height = isFirst ? (isMobile ? '280px' : '480px') : (isMobile ? '160px' : '230px');
            
            // Premium fallback placeholders from Unsplash
            const fallbackImages = [
              'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop',
            ];
            const coverImage = store.cover_image_url || fallbackImages[index % fallbackImages.length];

            return (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                style={{
                  gridColumn,
                  gridRow,
                  height,
                  display: 'flex',
                }}
              >
                <Link
                  href={`/store/${store.slug}`}
                  className="bento-card"
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                >
                  {/* Full-bleed background */}
                  <div
                    className="bento-card-bg"
                    style={{ backgroundImage: `url(${coverImage})` }}
                  />
                  
                  {/* Gradient overlay */}
                  <div className="bento-card-overlay" />
                  
                  {/* Content */}
                  <div className="bento-card-content">
                    <h3 style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: isFirst ? (isMobile ? '1.5rem' : '2.4rem') : (isMobile ? '1.15rem' : '1.45rem'),
                      color: '#fff',
                      fontWeight: 300,
                      letterSpacing: '0.04em',
                      lineHeight: 1.2,
                      margin: '0 0 6px 0',
                    }}>
                      {store.name}
                    </h3>
                    {store.tagline && (
                      <p style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: isFirst ? '0.78rem' : '0.68rem',
                        color: 'rgba(255,255,255,0.7)',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        margin: 0,
                      }}>
                        {store.tagline}
                      </p>
                    )}
                    <div style={{
                      height: '2px',
                      width: '32px',
                      background: store.primary_color || '#009aae',
                      marginTop: '12px',
                    }} />
                  </div>
                </Link>
              </motion.div>
            );
          })}
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
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, letterSpacing: '0.08em', color: '#1a1a1a' }}>TnB</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gray-dark)' }}>Try & Buy</span>
        </div>

        <div style={{ display: 'flex', gap: '2rem', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-dark)' }}>
          <span style={{ cursor: 'pointer' }}>Tiendas</span>
          <span style={{ cursor: 'pointer' }}>Contacto</span>
        </div>

        <div style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.06em' }}>
          © {new Date().getFullYear()} TnB
        </div>
      </footer>

      {topPopup && (
        <WelcomePopupGeneral
          storeId={topPopup.id}
          storeName={topPopup.name}
          discountPercent={topPopup.welcome_popup_discount}
          storeSlug={topPopup.slug}
          primaryColor={topPopup.primary_color}
          isHotsale={topPopup.is_hotsale}
          hotsaleCouponCode={topPopup.hotsale_coupon_code}
          hotsaleCouponText={topPopup.hotsale_coupon_text}
        />
      )}

    </div>
  );
}
