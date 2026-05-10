'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';

const CATEGORY_ICONS = {
  remeras:    '👕',
  pantalones: '👖',
  abrigos:    '🧥',
  camisas:    '👔',
  zapatillas: '👟',
  gorros:     '🧢',
  accesorios: '👜',
};

export default function ZaraStorePage() {
  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ]).then(([cats, prods]) => {
      setCategories(Array.isArray(cats)  ? cats  : []);
      setProducts(  Array.isArray(prods) ? prods.slice(0, 8) : []);
    }).catch(() => {
      setCategories([]);
      setProducts([]);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>

      {/* Hero */}
      <section style={{
        height: 'min(72vh, 620px)',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #2a2a2a 100%)',
        display: 'flex', alignItems: 'center',
        paddingTop: '64px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'relative', zIndex: 2,
          padding: '0 clamp(1.5rem, 8vw, 6rem)',
        }}>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.65rem',
            letterSpacing: '0.35em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)', marginBottom: '16px',
          }}>
            Nueva temporada · 2025
          </p>
          <h1 style={{
            fontFamily: 'var(--font-serif)', fontWeight: 300,
            fontSize: 'clamp(3.5rem, 10vw, 7rem)',
            color: '#fafaf8', margin: '0 0 20px 0',
            lineHeight: 1.0, letterSpacing: '-0.01em',
          }}>
            Zara
          </h1>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
            color: 'rgba(255,255,255,0.55)',
            maxWidth: '380px', marginBottom: '36px', lineHeight: 1.7,
          }}>
            Moda contemporánea para cada ocasión.<br />
            Nuevas colecciones disponibles.
          </p>
          <a href="#productos" style={{
            display: 'inline-block', padding: '12px 28px',
            border: '0.5px solid rgba(255,255,255,0.45)',
            color: '#fafaf8', textDecoration: 'none',
            fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            transition: 'all 0.3s',
          }}>
            Ver colección
          </a>
        </div>

        <div style={{
          position: 'absolute', right: '-80px', top: '50%',
          transform: 'translateY(-50%)',
          width: '480px', height: '480px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
      </section>

      {/* Categories */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3rem)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.65rem',
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: '#6b6560', marginBottom: '8px',
          }}>
            Explorar
          </p>
          <h2 style={{
            fontFamily: 'var(--font-serif)', fontWeight: 300,
            fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
            margin: '0 0 32px 0', letterSpacing: '0.02em',
          }}>
            Categorías
          </h2>

          {loading ? (
            <div style={{ color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.875rem' }}>
              Cargando...
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '10px',
            }}>
              {categories.map(cat => (
                <CategoryCard key={cat.id} cat={cat} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured products */}
      <section id="productos" style={{
        padding: 'clamp(2.5rem, 5vw, 4.5rem) clamp(1.5rem, 5vw, 3rem)',
        background: '#f0ede8',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.65rem',
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: '#6b6560', marginBottom: '8px',
          }}>
            Selección
          </p>
          <h2 style={{
            fontFamily: 'var(--font-serif)', fontWeight: 300,
            fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
            margin: '0 0 32px 0',
          }}>
            {loading ? 'Cargando...' : products.length === 0 ? 'Sin productos aún' : 'Productos destacados'}
          </h2>

          {!loading && products.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6b6560' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🏪</div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', marginBottom: '20px' }}>
                Todavía no hay productos. Agregá productos desde el panel admin.
              </p>
              <Link href="/admin/products" style={{
                display: 'inline-block', padding: '10px 22px',
                background: '#0f0f0f', color: '#fafaf8',
                textDecoration: 'none', fontFamily: 'var(--font-sans)',
                fontSize: '0.72rem', letterSpacing: '0.14em',
                textTransform: 'uppercase', borderRadius: '2px',
              }}>
                Panel admin
              </Link>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: '16px',
            }}>
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer store */}
      <footer style={{
        borderTop: '0.5px solid #e8e4df',
        padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)',
        display: 'flex', flexWrap: 'wrap', gap: '16px',
        justifyContent: 'space-between', alignItems: 'center',
        background: '#fafaf8',
      }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', letterSpacing: '0.08em', color: '#1a1a1a' }}>
          FASHION<span style={{ color: '#6b6560' }}>MALL</span>
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: '#bbb', letterSpacing: '0.06em' }}>
          © {new Date().getFullYear()} FashionMall · Zara
        </div>
      </footer>
    </div>
  );
}

function CategoryCard({ cat }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={`/store/zara/category/${cat.slug}`} style={{ textDecoration: 'none' }}>
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
        <div style={{ fontSize: '1.6rem', marginBottom: '10px' }}>
          {CATEGORY_ICONS[cat.slug] || '🏷️'}
        </div>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: '#0f0f0f', fontWeight: 500,
        }}>
          {cat.name}
        </div>
      </div>
    </Link>
  );
}

function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);
  const { addItem, setIsOpen } = useCart();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    await addItem(product.id);
    setIsOpen(true);
  };

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
      <Link href={`/store/zara/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ height: '280px', background: '#f0ede8', overflow: 'hidden', position: 'relative' }}>
          {product.image_url ? (
            <img
              src={product.image_url} alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: hovered ? 'scale(1.04)' : 'scale(1)' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#c8c4bc' }}>
              🛍️
            </div>
          )}
          {product.stock > 0 && product.stock < 5 && (
            <div style={{
              position: 'absolute', top: '10px', left: '10px',
              background: '#0f0f0f', color: '#fafaf8',
              padding: '3px 8px', fontSize: '0.6rem',
              letterSpacing: '0.1em', borderRadius: '2px',
              fontFamily: 'var(--font-sans)',
            }}>
              ÚLTIMAS UNIDADES
            </div>
          )}
        </div>

        <div style={{ padding: '14px 16px 8px' }}>
          {product.category_name && (
            <p style={{ margin: '0 0 3px 0', fontFamily: 'var(--font-sans)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6b6560' }}>
              {product.category_name}
            </p>
          )}
          <h3 style={{ margin: '0 0 6px 0', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500, color: '#0f0f0f' }}>
            {product.name}
          </h3>
          <p style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 400, color: '#0f0f0f' }}>
            ${parseFloat(product.price).toFixed(2)}
          </p>
        </div>
      </Link>

      <div style={{ padding: '0 16px 16px' }}>
        <button
          onClick={handleAddToCart}
          style={{
            width: '100%', padding: '9px',
            background: hovered ? '#0f0f0f' : 'transparent',
            color: hovered ? '#fafaf8' : '#0f0f0f',
            border: '0.5px solid #0f0f0f',
            fontFamily: 'var(--font-sans)', fontSize: '0.68rem',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            cursor: 'pointer', borderRadius: '2px',
            transition: 'all 0.25s',
          }}
        >
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}
