'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import { useFittingRoom, CATEGORY_MAP } from '@/components/FittingRoomContext';

export default function ProductPage({ params }) {
  const { slug } = params;

  const [product,      setProduct]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [quantity,     setQuantity]     = useState(1);
  const [added,        setAdded]        = useState(false);
  const [addedToRoom,  setAddedToRoom]  = useState(false);

  const { addItem, setIsOpen } = useCart();
  const { addToFittingRoom }   = useFittingRoom();

  useEffect(() => {
    fetch(`/api/products?slug=${slug}`)
      .then(r => r.json())
      .then(data => setProduct(Array.isArray(data) ? data[0] : null))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    await addItem(product.id, quantity);
    setAdded(true);
    setIsOpen(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleAddToFittingRoom = () => {
    if (!product) return;
    const category = CATEGORY_MAP[product.category_slug] || product.category_slug;
    addToFittingRoom({ id: product.id, name: product.name, category, image_url: product.image_url, slug: product.slug });
    setAddedToRoom(true);
    setTimeout(() => setAddedToRoom(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf8' }}>
        <span style={{ fontFamily: 'var(--font-sans)', color: '#6b6560', fontSize: '0.875rem' }}>Cargando...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafaf8', gap: '16px' }}>
        <div style={{ fontSize: '2.5rem' }}>😕</div>
        <p style={{ fontFamily: 'var(--font-sans)', color: '#6b6560', fontSize: '0.875rem' }}>Producto no encontrado.</p>
        <Link href="/store/zara" style={{ textDecoration: 'none', color: '#0f0f0f', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', borderBottom: '0.5px solid #0f0f0f', paddingBottom: '2px' }}>
          Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', paddingTop: '64px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(2rem, 4vw, 3.5rem) clamp(1.5rem, 5vw, 3rem)' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
          <Link href="/store/zara" style={{ textDecoration: 'none', color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.1em' }}>
            Zara
          </Link>
          {product.category_slug && (
            <>
              <span style={{ color: '#c8c4bc' }}>/</span>
              <Link href={`/store/zara/category/${product.category_slug}`} style={{ textDecoration: 'none', color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.1em' }}>
                {product.category_name}
              </Link>
            </>
          )}
          <span style={{ color: '#c8c4bc' }}>/</span>
          <span style={{ color: '#0f0f0f', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.1em' }}>
            {product.name}
          </span>
        </div>

        {/* Product layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'clamp(2rem, 5vw, 4rem)',
          alignItems: 'start',
        }}>

          {/* Image */}
          <div style={{
            background: '#f0ede8', borderRadius: '4px',
            overflow: 'hidden', aspectRatio: '3/4',
            border: '0.5px solid #e0dbd4',
          }}>
            {product.image_url ? (
              <img
                src={product.image_url} alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', color: '#c8c4bc' }}>
                🛍️
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ padding: 'clamp(0rem, 2vw, 1rem) 0' }}>

            {product.category_name && (
              <p style={{ margin: '0 0 10px 0', fontFamily: 'var(--font-sans)', fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#6b6560' }}>
                {product.category_name}
              </p>
            )}

            <h1 style={{
              fontFamily: 'var(--font-serif)', fontWeight: 300,
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              margin: '0 0 16px 0', lineHeight: 1.15, letterSpacing: '0.01em',
            }}>
              {product.name}
            </h1>

            <p style={{
              fontFamily: 'var(--font-serif)', fontWeight: 400,
              fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              margin: '0 0 28px 0', color: '#0f0f0f',
            }}>
              ${parseFloat(product.price).toFixed(2)}
            </p>

            {product.description && (
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
                color: '#6b6560', lineHeight: 1.7,
                margin: '0 0 32px 0', maxWidth: '440px',
              }}>
                {product.description}
              </p>
            )}

            {/* Stock indicator */}
            {product.stock <= 0 ? (
              <div style={{ marginBottom: '24px', padding: '10px 14px', background: '#f5f5f5', border: '0.5px solid #e0dbd4', borderRadius: '2px', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#6b6560', letterSpacing: '0.1em' }}>
                Sin stock disponible
              </div>
            ) : product.stock < 5 ? (
              <div style={{ marginBottom: '24px', padding: '10px 14px', background: '#fff9f0', border: '0.5px solid #fde8c0', borderRadius: '2px', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#a0620a', letterSpacing: '0.08em' }}>
                Últimas {product.stock} unidades disponibles
              </div>
            ) : null}

            {/* Quantity selector */}
            {product.stock > 0 && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '10px' }}>
                    Cantidad
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      style={{
                        width: '36px', height: '36px',
                        border: '0.5px solid #e0dbd4', background: 'none',
                        cursor: 'pointer', borderRadius: '2px',
                        fontSize: '1.1rem', color: '#0f0f0f',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      −
                    </button>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', minWidth: '24px', textAlign: 'center', fontWeight: 500 }}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      style={{
                        width: '36px', height: '36px',
                        border: '0.5px solid #e0dbd4', background: 'none',
                        cursor: 'pointer', borderRadius: '2px',
                        fontSize: '1.1rem', color: '#0f0f0f',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  style={{
                    width: '100%', maxWidth: '400px',
                    padding: '15px',
                    background: added ? '#2e7d32' : '#0f0f0f',
                    color: '#fafaf8', border: 'none',
                    fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                    cursor: 'pointer', borderRadius: '2px',
                    transition: 'background 0.3s',
                    marginBottom: '10px',
                  }}
                >
                  {added ? '✓ Agregado al carrito' : 'Agregar al carrito'}
                </button>

                <button
                  onClick={handleAddToFittingRoom}
                  style={{
                    width: '100%', maxWidth: '400px',
                    padding: '12px',
                    background: addedToRoom ? '#4a7c59' : 'transparent',
                    color: addedToRoom ? '#fafaf8' : '#6b6560',
                    border: '0.5px solid',
                    borderColor: addedToRoom ? '#4a7c59' : '#d4cfc8',
                    fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    cursor: 'pointer', borderRadius: '2px',
                    transition: 'all 0.3s',
                    marginBottom: '12px',
                  }}
                >
                  {addedToRoom ? '✓ En el vestidor' : '🧥 Agregar al vestidor'}
                </button>
              </>
            )}

            {/* Probador link */}
            <Link href="/probador" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              textDecoration: 'none', color: '#6b6560',
              fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
              letterSpacing: '0.1em', marginTop: '8px',
              transition: 'color 0.2s',
            }}>
              <span>✨</span>
              <span>Probátelo con el Probador IA</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
