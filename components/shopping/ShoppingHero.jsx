'use client';
import { useState, useEffect } from 'react';

export default function ShoppingHero({ shopping, primaryColor, carouselImages }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (!carouselImages || carouselImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % carouselImages.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [carouselImages]);

  const hasCarousel = carouselImages && carouselImages.length > 0;

  return (
    <section style={{
      position: 'relative',
      height: '420px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      overflow: 'hidden',
      borderBottom: '0.5px solid #cbd5e1',
      background: hasCarousel ? '#0a0a0a' : `linear-gradient(135deg, ${primaryColor}1a, ${primaryColor}05)`,
    }}>
      {/* Background images for carousel */}
      {hasCarousel && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {carouselImages.map((img, idx) => (
            <div
              key={img.id}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${img.image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: idx === currentIdx ? 0.6 : 0,
                transition: 'opacity 1.8s ease-in-out',
              }}
            />
          ))}
          {/* Dark Overlay for readability */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.75))',
            zIndex: 1
          }} />
        </div>
      )}

      {/* Hero Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '850px',
        margin: '0 auto',
        padding: '0 24px',
        color: hasCarousel ? '#ffffff' : '#0f0f0f'
      }}>
        {shopping.tagline && (
          <span style={{
            fontSize: '0.68rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: hasCarousel ? '#e8ddd0' : primaryColor,
            fontWeight: 700,
            display: 'block',
            marginBottom: '14px',
            textShadow: hasCarousel ? '0 1px 4px rgba(0,0,0,0.6)' : 'none'
          }}>
            {shopping.tagline}
          </span>
        )}
        <h1 style={{
          fontFamily: `var(--font-serif)`,
          fontWeight: 300,
          fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)',
          margin: '0 0 18px',
          letterSpacing: '0.01em',
          lineHeight: 1.15,
          textShadow: hasCarousel ? '0 2px 10px rgba(0,0,0,0.85)' : 'none',
          color: hasCarousel ? '#ffffff' : '#0f0f0f'
        }}>
          {shopping.hero_title || `Bienvenido a ${shopping.name}`}
        </h1>
        <p style={{
          margin: '0 auto',
          color: hasCarousel ? '#e8ddd0' : '#6b6560',
          fontSize: 'clamp(0.9rem, 2.2vw, 1.12rem)',
          lineHeight: 1.6,
          fontWeight: 300,
          maxWidth: '650px',
          textShadow: hasCarousel ? '0 1px 5px rgba(0,0,0,0.7)' : 'none'
        }}>
          {shopping.hero_subtitle || 'Explorá las mejores marcas con probador virtual interactivo y hace tu pedido directo por WhatsApp.'}
        </p>

        {/* Carousel indicators */}
        {hasCarousel && carouselImages.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '28px' }}>
            {carouselImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  border: 'none',
                  background: idx === currentIdx ? '#ffffff' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'background 0.3s'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
