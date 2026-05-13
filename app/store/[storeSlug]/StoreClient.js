'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import { useFittingRoom, CATEGORY_MAP } from '@/components/FittingRoomContext';

const CATEGORY_ICONS = {
  remeras: '👕', pantalones: '👖', abrigos: '🧥',
  camisas: '👔', zapatillas: '👟', gorros: '🧢', accesorios: '👜',
};

export default function StoreClient({ store, images, categories, products, storeSlug }) {
  const primary = store.primary_color || '#009aae';

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>

      {/* Keyframes para animaciones */}
      <style>{`
        @keyframes bounceDown {
          0%, 100% { transform: translateY(0) translateX(-50%); opacity: 0.7; }
          50% { transform: translateY(10px) translateX(-50%); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{
        height: 'min(72vh, 620px)',
        background: primary,
        display: 'flex', alignItems: 'center',
        paddingTop: '64px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Contenido */}
        <div style={{
          position: 'relative', zIndex: 2,
          padding: '0 clamp(1.5rem, 8vw, 6rem)',
          animation: 'fadeIn 0.7s ease both',
        }}>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.65rem',
            letterSpacing: '0.35em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.65)', marginBottom: '16px',
          }}>
            Nueva temporada · 2025
          </p>
          <h1 style={{
            fontFamily: 'var(--font-serif)', fontWeight: 300,
            fontSize: 'clamp(3.5rem, 10vw, 7rem)',
            color: '#fff', margin: '0 0 20px 0',
            lineHeight: 1.0, letterSpacing: '-0.01em',
          }}>
            {store.hero_title || store.name}
          </h1>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
            color: 'rgba(255,255,255,0.75)',
            maxWidth: '380px', marginBottom: '36px', lineHeight: 1.7,
          }}>
            {store.hero_subtitle || store.tagline || ''}
          </p>
          <a href={images.length > 0 ? '#carousel' : '#productos'} style={{
            display: 'inline-block', padding: '12px 28px',
            border: '0.5px solid rgba(255,255,255,0.6)',
            color: '#fff', textDecoration: 'none',
            fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>
            Ver colección
          </a>
        </div>

        {/* Fade inferior — transición suave hacia el carousel */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', zIndex: 3,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.18) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Flecha animada — solo si hay carousel */}
        {images.length > 0 && (
          <a
            href="#carousel"
            style={{
              position: 'absolute', bottom: '28px', left: '50%',
              animation: 'bounceDown 2s ease-in-out infinite',
              zIndex: 4, textDecoration: 'none',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </a>
        )}
      </section>

      {/* ── CARRUSEL ── */}
      {images.length > 0 && (
        <div id="carousel" style={{ scrollMarginTop: '64px' }}>
          {/* Encabezado de sección */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: 'clamp(2rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem) clamp(1rem, 2vw, 1.2rem)',
            background: '#fafaf8',
          }}>
            <div style={{ flex: 1, height: '0.5px', background: '#e0dbd4' }} />
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: '0.65rem',
              letterSpacing: '0.28em', textTransform: 'uppercase',
              color: '#6b6560', margin: 0, whiteSpace: 'nowrap',
            }}>
              Colección
            </p>
            <div style={{ flex: 1, height: '0.5px', background: '#e0dbd4' }} />
          </div>
          <Carousel images={images} />
        </div>
      )}

      {/* ── SOBRE NOSOTROS ── */}
      {store.about_text && (
        <section style={{ padding: 'clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3rem)', background: '#fff' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '16px' }}>
              Sobre nosotros
            </p>
            <p style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', lineHeight: 1.8, color: '#1a1a1a' }}>
              {store.about_text}
            </p>
          </div>
        </section>
      )}

      {/* ── CATEGORÍAS ── */}
      {categories.length > 0 && (
        <section style={{ padding: 'clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3rem)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '8px' }}>Explorar</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', margin: '0 0 32px 0' }}>Categorías</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
              {categories.map(cat => <CategoryCard key={cat.id} cat={cat} storeSlug={storeSlug} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── PRODUCTOS DESTACADOS ── */}
      <section id="productos" style={{ padding: 'clamp(2.5rem, 5vw, 4.5rem) clamp(1.5rem, 5vw, 3rem)', background: '#f0ede8' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '8px' }}>Selección</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', margin: '0 0 32px 0' }}>
            {products.length === 0 ? 'Sin productos aún' : 'Productos destacados'}
          </h2>
          {products.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px' }}>
              {products.map(p => <ProductCard key={p.id} product={p} storeSlug={storeSlug} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '0.5px solid #e8e4df', padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', background: '#fafaf8' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', letterSpacing: '0.08em', color: '#1a1a1a' }}>
          FASHION<span style={{ color: '#6b6560' }}>MALL</span>
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: '#bbb', letterSpacing: '0.06em' }}>
          © {new Date().getFullYear()} FashionMall · {store.name}
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────── Carousel ─────────────────── */
function Carousel({ images }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <div style={{ position: 'relative', width: '100%', background: '#0f0f0f', overflow: 'hidden' }}>

      {/* Slides — altura se adapta a la imagen activa */}
      <div style={{ position: 'relative', width: '100%' }}>
        {images.map((img, i) => (
          <div
            key={img.id}
            style={{
              display: i === idx ? 'block' : 'none',
              position: 'relative',
              width: '100%',
            }}
          >
            <img
              src={img.image_url}
              alt={img.caption || ''}
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '80vh', objectFit: 'contain', margin: '0 auto' }}
            />
            {/* Caption editable desde admin */}
            {img.caption && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '48px 32px 24px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              }}>
                <p style={{
                  fontFamily: 'var(--font-serif)', fontWeight: 300,
                  fontSize: 'clamp(1rem, 3vw, 1.6rem)',
                  color: '#fff', margin: 0, letterSpacing: '0.02em',
                }}>
                  {img.caption}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Controles debajo */}
      {images.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '14px 0', background: '#0f0f0f' }}>
          <button
            onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >‹</button>

          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{ width: i === idx ? '24px' : '8px', height: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer', padding: 0, background: i === idx ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'all 0.3s' }}
            />
          ))}

          <button
            onClick={() => setIdx(i => (i + 1) % images.length)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >›</button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── CategoryCard ─────────────────── */
function CategoryCard({ cat, storeSlug }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={`/store/${storeSlug}/category/${cat.slug}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '24px 12px', border: `0.5px solid ${hovered ? '#888' : '#e0dbd4'}`,
          borderRadius: '4px', textAlign: 'center', cursor: 'pointer',
          transition: 'all 0.25s', background: '#fff',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        }}
      >
        <div style={{ fontSize: '1.6rem', marginBottom: '10px' }}>{CATEGORY_ICONS[cat.slug] || '🏷️'}</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0f0f0f', fontWeight: 500 }}>
          {cat.name}
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────── ProductCard ─────────────────── */
function ProductCard({ product, storeSlug }) {
  const [hovered, setHovered] = useState(false);
  const [addedToRoom, setAddedToRoom] = useState(false);
  const { addItem, setIsOpen } = useCart();
  const { addToFittingRoom } = useFittingRoom();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `0.5px solid ${hovered ? '#aaa' : '#e0dbd4'}`,
        borderRadius: '4px', overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.25s', background: '#fff',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
      }}
    >
      <Link href={`/store/${storeSlug}/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ height: '280px', background: '#f0ede8', overflow: 'hidden', position: 'relative' }}>
          {product.image_url
            ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: hovered ? 'scale(1.04)' : 'scale(1)' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#c8c4bc' }}>🛍️</div>
          }
          {product.stock > 0 && product.stock < 5 && (
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#0f0f0f', color: '#fafaf8', padding: '3px 8px', fontSize: '0.6rem', letterSpacing: '0.1em', borderRadius: '2px' }}>
              ÚLTIMAS UNIDADES
            </div>
          )}
        </div>
        <div style={{ padding: '14px 16px 8px' }}>
          {product.category_name && (
            <p style={{ margin: '0 0 3px', fontFamily: 'var(--font-sans)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6b6560' }}>
              {product.category_name}
            </p>
          )}
          <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500, color: '#0f0f0f' }}>{product.name}</h3>
          <p style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: '#0f0f0f' }}>${parseFloat(product.price).toFixed(2)}</p>
        </div>
      </Link>
      <div style={{ padding: '0 16px 8px' }}>
        <button
          onClick={async (e) => { e.preventDefault(); await addItem(product.id); setIsOpen(true); }}
          style={{
            width: '100%', padding: '9px', marginBottom: '6px',
            background: hovered ? '#0f0f0f' : 'transparent', color: hovered ? '#fafaf8' : '#0f0f0f',
            border: '0.5px solid #0f0f0f', fontFamily: 'var(--font-sans)', fontSize: '0.68rem',
            letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '2px', transition: 'all 0.25s',
          }}
        >
          Agregar al carrito
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            const category = CATEGORY_MAP[product.category_slug] || product.category_slug;
            addToFittingRoom({ id: product.id, name: product.name, category, image_url: product.image_url, slug: product.slug });
            setAddedToRoom(true);
            setTimeout(() => setAddedToRoom(false), 2000);
          }}
          style={{
            width: '100%', padding: '7px',
            background: addedToRoom ? '#4a7c59' : 'transparent', color: addedToRoom ? '#fff' : '#6b6560',
            border: `0.5px solid ${addedToRoom ? '#4a7c59' : '#d4cfc8'}`,
            fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            cursor: 'pointer', borderRadius: '2px', transition: 'all 0.25s',
          }}
        >
          {addedToRoom ? '✓ En el vestidor' : '🧥 Al vestidor'}
        </button>
      </div>
      <div style={{ height: '8px' }} />
    </div>
  );
}
