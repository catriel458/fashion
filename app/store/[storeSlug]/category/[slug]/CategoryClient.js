'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import { useFittingRoom, CATEGORY_MAP } from '@/components/FittingRoomContext';

const CATEGORY_ICONS = {
  remeras: '👕', pantalones: '👖', abrigos: '🧥',
  camisas: '👔', zapatillas: '👟', gorros: '🧢', accesorios: '👜',
};

export default function CategoryClient({ storeSlug, category, slug, products }) {
  const [search, setSearch] = useState('');

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', paddingTop: '64px' }}>

      <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 5vw, 3rem)', borderBottom: '0.5px solid #e0dbd4', background: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
            <Link href={`/store/${storeSlug}`} style={{ textDecoration: 'none', color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.1em' }}>
              {storeSlug}
            </Link>
            <span style={{ color: '#c8c4bc' }}>/</span>
            <span style={{ color: '#0f0f0f', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.1em' }}>
              {category?.name || slug}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '2rem' }}>{CATEGORY_ICONS[slug] || '🏷️'}</span>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.8rem, 5vw, 3rem)', margin: 0 }}>
                {category?.name || slug}
              </h1>
              <p style={{ margin: '4px 0 0', color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>
                {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(2rem, 4vw, 3rem) clamp(1.5rem, 5vw, 3rem)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '28px' }}>
            <input
              type="text" placeholder="Buscar en esta categoría..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '10px 14px', border: '0.5px solid #e0dbd4', background: '#fff', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none', borderRadius: '2px', width: '100%', maxWidth: '320px', boxSizing: 'border-box' }}
            />
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', color: '#6b6560' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔍</div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem' }}>
                {search ? 'No se encontraron productos con ese nombre.' : 'No hay productos en esta categoría aún.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px' }}>
              {filtered.map(p => <ProductCard key={p.id} product={p} storeSlug={storeSlug} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product, storeSlug }) {
  const [hovered, setHovered] = useState(false);
  const [addedToRoom, setAddedToRoom] = useState(false);
  const { addItem, setIsOpen } = useCart();
  const { addToFittingRoom } = useFittingRoom();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ border: `0.5px solid ${hovered ? '#aaa' : '#e0dbd4'}`, borderRadius: '4px', overflow: 'hidden', transition: 'all 0.25s', background: '#fff', transform: hovered ? 'translateY(-3px)' : 'translateY(0)' }}
    >
      <Link href={`/store/${storeSlug}/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ height: '280px', background: '#f0ede8', overflow: 'hidden', position: 'relative' }}>
          {product.image_url
            ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: hovered ? 'scale(1.04)' : 'scale(1)' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#c8c4bc' }}>🛍️</div>
          }
          {product.stock > 0 && product.stock < 5 && (
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#0f0f0f', color: '#fafaf8', padding: '3px 8px', fontSize: '0.6rem', letterSpacing: '0.1em', borderRadius: '2px' }}>ÚLTIMAS UNIDADES</div>
          )}
        </div>
        <div style={{ padding: '14px 16px 8px' }}>
          <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500, color: '#0f0f0f' }}>{product.name}</h3>
          <p style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: '#0f0f0f' }}>${parseFloat(product.price).toFixed(2)}</p>
        </div>
      </Link>
      <div style={{ padding: '0 16px 8px' }}>
        <button onClick={async (e) => { e.preventDefault(); await addItem(product.id); setIsOpen(true); }}
          style={{ width: '100%', padding: '9px', marginBottom: '6px', background: hovered ? '#0f0f0f' : 'transparent', color: hovered ? '#fafaf8' : '#0f0f0f', border: '0.5px solid #0f0f0f', fontFamily: 'var(--font-sans)', fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '2px', transition: 'all 0.25s' }}>
          Agregar al carrito
        </button>
        <button onClick={(e) => { e.preventDefault(); const cat = CATEGORY_MAP[product.category_slug] || product.category_slug; addToFittingRoom({ id: product.id, name: product.name, category: cat, image_url: product.image_url, slug: product.slug }); setAddedToRoom(true); setTimeout(() => setAddedToRoom(false), 2000); }}
          style={{ width: '100%', padding: '7px', background: addedToRoom ? '#4a7c59' : 'transparent', color: addedToRoom ? '#fff' : '#6b6560', border: `0.5px solid ${addedToRoom ? '#4a7c59' : '#d4cfc8'}`, fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '2px', transition: 'all 0.25s' }}>
          {addedToRoom ? '✓ En el vestidor' : '🧥 Al vestidor'}
        </button>
      </div>
      <div style={{ height: '8px' }} />
    </div>
  );
}
