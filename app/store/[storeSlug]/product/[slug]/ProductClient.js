'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import { useFittingRoom, CATEGORY_MAP } from '@/components/FittingRoomContext';

export default function ProductClient({ product, storeSlug }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [addedToRoom, setAddedToRoom] = useState(false);
  const { addItem, setIsOpen } = useCart();
  const { addToFittingRoom } = useFittingRoom();

  const handleAddToCart = async () => {
    await addItem(product.id, quantity);
    setAdded(true); setIsOpen(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleAddToFittingRoom = () => {
    const category = CATEGORY_MAP[product.category_slug] || product.category_slug;
    addToFittingRoom({ id: product.id, name: product.name, category, image_url: product.image_url, slug: product.slug });
    setAddedToRoom(true);
    setTimeout(() => setAddedToRoom(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', paddingTop: '64px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(2rem, 4vw, 3.5rem) clamp(1.5rem, 5vw, 3rem)' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
          <Link href={`/store/${storeSlug}`} style={{ textDecoration: 'none', color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.1em' }}>{storeSlug}</Link>
          {product.category_slug && (<><span style={{ color: '#c8c4bc' }}>/</span><Link href={`/store/${storeSlug}/category/${product.category_slug}`} style={{ textDecoration: 'none', color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.1em' }}>{product.category_name}</Link></>)}
          <span style={{ color: '#c8c4bc' }}>/</span>
          <span style={{ color: '#0f0f0f', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.1em' }}>{product.name}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(2rem, 5vw, 4rem)', alignItems: 'start' }}>

          {/* Imagen */}
          <div style={{ background: '#f0ede8', borderRadius: '4px', overflow: 'hidden', aspectRatio: '3/4', border: '0.5px solid #e0dbd4' }}>
            {product.image_url
              ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', color: '#c8c4bc' }}>🛍️</div>
            }
          </div>

          {/* Detalles */}
          <div style={{ padding: 'clamp(0rem, 2vw, 1rem) 0' }}>
            {product.category_name && (
              <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-sans)', fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#6b6560' }}>{product.category_name}</p>
            )}
            <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', margin: '0 0 16px', lineHeight: 1.15 }}>{product.name}</h1>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', margin: '0 0 28px', color: '#0f0f0f' }}>${parseFloat(product.price).toFixed(2)}</p>

            {product.description && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: '#6b6560', lineHeight: 1.7, margin: '0 0 32px', maxWidth: '440px' }}>{product.description}</p>
            )}

            {product.stock <= 0 ? (
              <div style={{ marginBottom: '24px', padding: '10px 14px', background: '#f5f5f5', border: '0.5px solid #e0dbd4', borderRadius: '2px', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#6b6560' }}>Sin stock disponible</div>
            ) : product.stock < 5 ? (
              <div style={{ marginBottom: '24px', padding: '10px 14px', background: '#fff9f0', border: '0.5px solid #fde8c0', borderRadius: '2px', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#a0620a' }}>Últimas {product.stock} unidades</div>
            ) : null}

            {product.stock > 0 && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '10px' }}>Cantidad</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '36px', height: '36px', border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', minWidth: '24px', textAlign: 'center', fontWeight: 500 }}>{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} style={{ width: '36px', height: '36px', border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
                <button onClick={handleAddToCart} style={{ width: '100%', maxWidth: '400px', padding: '15px', background: added ? '#2e7d32' : '#0f0f0f', color: '#fafaf8', border: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.78rem', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '2px', transition: 'background 0.3s', marginBottom: '10px' }}>
                  {added ? '✓ Agregado al carrito' : 'Agregar al carrito'}
                </button>
                <button onClick={handleAddToFittingRoom} style={{ width: '100%', maxWidth: '400px', padding: '12px', background: addedToRoom ? '#4a7c59' : 'transparent', color: addedToRoom ? '#fafaf8' : '#6b6560', border: `0.5px solid ${addedToRoom ? '#4a7c59' : '#d4cfc8'}`, fontFamily: 'var(--font-sans)', fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '2px', transition: 'all 0.3s' }}>
                  {addedToRoom ? '✓ En el vestidor' : '🧥 Agregar al vestidor'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
