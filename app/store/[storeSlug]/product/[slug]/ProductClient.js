'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import { useFittingRoom, CATEGORY_MAP } from '@/components/FittingRoomContext';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

const getAvailableSizes = (categorySlug) => {
  if (!categorySlug) return null;
  const slug = categorySlug.toLowerCase();
  if (
    slug.includes('zapatilla') ||
    slug.includes('calzado') ||
    slug.includes('zapato') ||
    slug.includes('bota') ||
    slug.includes('sneaker')
  ) {
    return ['38', '39', '40', '41', '42', '43', '44', '45'];
  }
  if (
    slug.includes('remera') ||
    slug.includes('pantalon') ||
    slug.includes('abrigo') ||
    slug.includes('camisa') ||
    slug.includes('jean') ||
    slug.includes('buzo') ||
    slug.includes('vestido') ||
    slug.includes('campera') ||
    slug.includes('remeron') ||
    slug.includes('shorts') ||
    slug.includes('ropa') ||
    slug.includes('prenda') ||
    slug.includes('polera') ||
    slug.includes('saco') ||
    slug.includes('chaleco') ||
    slug.includes('calza') ||
    slug.includes('pollera')
  ) {
    return ['S', 'M', 'L', 'XL', 'XXL'];
  }
  return null;
};

export default function ProductClient({ product, storeSlug, storeId }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [addedToRoom, setAddedToRoom] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { data: session } = useSession();
  const { addItem, setIsOpen } = useCart();
  const { addToFittingRoom } = useFittingRoom();

  const [showSizerModal, setShowSizerModal] = useState(false);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [fit, setFit] = useState('normal');
  const [sizerResult, setSizerResult] = useState(null);
  const [savedMeasurements, setSavedMeasurements] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  const availableSizes = getAvailableSizes(product.category_slug);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('cnb_user_measurements');
      if (data) {
        const parsed = JSON.parse(data);
        setSavedMeasurements(parsed);
        const sizes = getAvailableSizes(product.category_slug);
        if (sizes && sizes.includes(parsed.size)) {
          setSelectedSize(parsed.size);
        }
      }
    }
  }, [product.category_slug]);

  const calculateRecommendedSize = (h, w, f) => {
    let size = 'M';
    if (w < 55) {
      size = 'S';
    } else if (w >= 55 && w < 68) {
      size = 'M';
    } else if (w >= 68 && w < 82) {
      size = 'L';
    } else if (w >= 82 && w < 95) {
      size = 'XL';
    } else {
      size = 'XXL';
    }

    if (h > 185 && size === 'S') size = 'M';
    if (h > 190 && size === 'M') size = 'L';
    if (h < 160 && size === 'L') size = 'M';

    const sizeOrder = ['S', 'M', 'L', 'XL', 'XXL'];
    let sizeIdx = sizeOrder.indexOf(size);
    if (f === 'suelto' && sizeIdx < sizeOrder.length - 1) {
      sizeIdx++;
    } else if (f === 'ajustado' && sizeIdx > 0) {
      sizeIdx--;
    }
    return sizeOrder[sizeIdx];
  };

  useEffect(() => {
    if (session?.user && storeId) {
      fetch(`/api/wishlist?store_id=${storeId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const found = data.some(item => item.product_id === product.id);
            setInWishlist(found);
          }
        })
        .catch(() => {});
    }
  }, [session, storeId, product.id]);

  const handleWishlist = async () => {
    if (!session?.user) {
      toast.error("Debes iniciar sesión para guardar en favoritos");
      return;
    }
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        const res = await fetch(`/api/wishlist?product_id=${product.id}`, { method: 'DELETE' });
        if (res.ok) {
          setInWishlist(false);
          toast("Eliminado de favoritos");
        }
      } else {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: product.id, store_id: storeId })
        });
        if (res.ok) {
          setInWishlist(true);
          toast.success("Agregado a favoritos!");
        }
      }
    } catch {
      toast.error("Error al actualizar favoritos");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (availableSizes && !selectedSize) {
      toast.error("Por favor, seleccioná un talle");
      return;
    }
    await addItem(product.id, quantity, selectedSize);
    setAdded(true); setIsOpen(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleAddToFittingRoom = () => {
    const category = CATEGORY_MAP[product.category_slug] || product.category_slug;
    addToFittingRoom({ id: product.id, name: product.name, category, image_url: product.image_url, slug: product.slug });
    setAddedToRoom(true);
    setTimeout(() => setAddedToRoom(false), 2000);
  };

  const images = (product.image_urls && product.image_urls.length > 0)
    ? product.image_urls
    : (product.image_url ? [product.image_url] : []);

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsZoomed(false);
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      handleNextImage(e);
    } else if (diff < -50) {
      handlePrevImage(e);
    }
    setTouchStartX(null);
  };

  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleDownloadImage = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'producto.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.download = filename || 'producto.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
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

          {/* Imagen / Carousel Container */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Main Carousel viewport */}
            <div 
              style={{ 
                background: '#f0ede8', 
                borderRadius: '4px', 
                overflow: 'hidden', 
                aspectRatio: '3/4', 
                border: '0.5px solid #e0dbd4',
                position: 'relative',
                cursor: images.length > 0 ? 'pointer' : 'default'
              }}
              onClick={() => { if (images.length > 0) setIsLightboxOpen(true); }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {images.length > 0 ? (
                <>
                  {/* Sliding Track */}
                  <div style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    transform: `translate3d(-${currentImageIndex * 100}%, 0, 0)`,
                    transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  }}>
                    {images.map((imgUrl, idx) => (
                      <div key={idx} style={{ flex: '0 0 100%', width: '100%', height: '100%', position: 'relative' }}>
                        <img 
                          src={imgUrl} 
                          alt={`${product.name} - ${idx + 1}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none', pointerEvents: 'none' }} 
                        />
                      </div>
                    ))}
                  </div>

                  {/* Magnifying overlay button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(4px)',
                      border: '0.5px solid #e0dbd4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'all 0.2s',
                      zIndex: 10
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    title="Ver en pantalla completa"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      <line x1="11" y1="8" x2="11" y2="14"></line>
                      <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                  </button>

                  {/* Left / Right navigation overlays */}
                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={handlePrevImage}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '12px',
                          transform: 'translateY(-50%)',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(4px)',
                          border: '0.5px solid #e0dbd4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          transition: 'all 0.2s',
                          zIndex: 10,
                          fontSize: '1.2rem',
                          color: '#0f0f0f'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                        title="Anterior"
                      >
                        ‹
                      </button>
                      <button 
                        onClick={handleNextImage}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          right: '12px',
                          transform: 'translateY(-50%)',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(4px)',
                          border: '0.5px solid #e0dbd4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          transition: 'all 0.2s',
                          zIndex: 10,
                          fontSize: '1.2rem',
                          color: '#0f0f0f'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                        title="Siguiente"
                      >
                        ›
                      </button>

                      {/* Dots indicators */}
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '6px',
                        zIndex: 10
                      }}>
                        {images.map((_, idx) => (
                          <div 
                            key={idx}
                            style={{
                              width: currentImageIndex === idx ? '16px' : '6px',
                              height: '6px',
                              borderRadius: '3px',
                              background: currentImageIndex === idx ? '#0f0f0f' : 'rgba(15, 15, 15, 0.25)',
                              transition: 'all 0.3s ease'
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', color: '#c8c4bc' }}>🛍️</div>
              )}
            </div>

            {/* Thumbnails Row */}
            {images.length > 1 && (
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '12px',
                overflowX: 'auto',
                paddingBottom: '6px',
                scrollbarWidth: 'thin'
              }}>
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    style={{
                      width: '60px',
                      height: '80px',
                      flexShrink: 0,
                      borderRadius: '2px',
                      overflow: 'hidden',
                      padding: 0,
                      border: currentImageIndex === idx ? '1.5px solid #0f0f0f' : '0.5px solid #e0dbd4',
                      background: 'none',
                      cursor: 'pointer',
                      opacity: currentImageIndex === idx ? 1 : 0.65,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      if (currentImageIndex !== idx) e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={e => {
                      if (currentImageIndex !== idx) e.currentTarget.style.opacity = '0.65';
                    }}
                  >
                    <img src={imgUrl} alt={`Miniatura ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
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
                {/* Sizing advisor - Only for clothing (apparel) */}
                {availableSizes && availableSizes.includes('M') && (
                  savedMeasurements ? (
                    <div style={{
                      background: '#f5f3f0', border: '0.5px solid #e0dbd4', borderRadius: '4px',
                      padding: '10px 14px', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: '16px', fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
                      maxWidth: '400px', boxSizing: 'border-box'
                    }}>
                      <div>
                        📏 Tu talle sugerido es <strong>{savedMeasurements.size}</strong> <span style={{ color: '#888', fontSize: '0.68rem' }}>({savedMeasurements.height}cm, {savedMeasurements.weight}kg)</span>
                      </div>
                      <button 
                        onClick={() => {
                          setHeight(savedMeasurements.height);
                          setWeight(savedMeasurements.weight);
                          setFit(savedMeasurements.fit);
                          setShowSizerModal(true);
                        }}
                        style={{ background: 'none', border: 'none', textDecoration: 'underline', color: '#0f0f0f', cursor: 'pointer', padding: 0, fontSize: '0.7rem', fontFamily: 'var(--font-sans)' }}
                      >
                        Editar
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowSizerModal(true)}
                      style={{
                        background: 'none', border: '0.5px solid #d4cfc8', borderRadius: '2px',
                        padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                        fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.08em',
                        textTransform: 'uppercase', cursor: 'pointer', color: '#6b6560',
                        width: '100%', maxWidth: '400px', justifyContent: 'center', marginBottom: '16px',
                        boxSizing: 'border-box'
                      }}
                    >
                      📏 ¿Cuál es mi talle? Calcular
                    </button>
                  )
                )}

                {/* Size Selector */}
                {availableSizes && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '10px' }}>Seleccionar Talle</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {availableSizes.map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          style={{
                            minWidth: '40px',
                            height: '40px',
                            padding: '0 8px',
                            border: '0.5px solid',
                            borderColor: selectedSize === sz ? '#0f0f0f' : '#d4cfc8',
                            background: selectedSize === sz ? '#0f0f0f' : 'transparent',
                            color: selectedSize === sz ? '#fafaf8' : '#0f0f0f',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.78rem',
                            fontWeight: selectedSize === sz ? 600 : 400,
                            cursor: 'pointer',
                            borderRadius: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                <button
                  onClick={handleWishlist}
                  disabled={wishlistLoading}
                  style={{
                    width: '100%', maxWidth: '400px', padding: '12px',
                    background: 'transparent',
                    color: inWishlist ? '#e11d48' : '#6b6560',
                    border: `0.5px solid ${inWishlist ? '#e11d48' : '#d4cfc8'}`,
                    fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    cursor: 'pointer', borderRadius: '2px', transition: 'all 0.3s',
                    marginTop: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  {inWishlist ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#e11d48" stroke="#e11d48" strokeWidth="1.5">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      Guardado en favoritos
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      Agregar a favoritos
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sizer Modal overlay */}
      {showSizerModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,15,15,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 4000, padding: '20px', animation: 'sizerFadeIn 0.2s ease-out'
        }}
        onClick={() => { setShowSizerModal(false); setSizerResult(null); }}
        >
          <style>{`
            @keyframes sizerFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes sizerSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          `}</style>

          <div style={{
            background: '#fff', borderRadius: '8px', maxWidth: '440px', width: '100%',
            padding: '30px 24px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            animation: 'sizerSlideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative'
          }}
          onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => { setShowSizerModal(false); setSizerResult(null); }}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: '#6b6560' }}
            >
              ✕
            </button>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 300, margin: '0 0 8px', color: '#0f0f0f' }}>
              Recomendador de talles
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '0.78rem', color: '#6b6560', lineHeight: 1.5 }}>
              Ingresá tu altura y peso para calcular tu talle recomendado según nuestras prendas.
            </p>

            {!sizerResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Altura */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 600 }}>Altura</label>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f0f0f' }}>{height} cm</span>
                  </div>
                  <input 
                    type="range" min="130" max="220" value={height} 
                    onChange={e => setHeight(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#0f0f0f', cursor: 'pointer' }}
                  />
                </div>

                {/* Peso */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 600 }}>Peso</label>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f0f0f' }}>{weight} kg</span>
                  </div>
                  <input 
                    type="range" min="30" max="150" value={weight} 
                    onChange={e => setWeight(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#0f0f0f', cursor: 'pointer' }}
                  />
                </div>

                {/* Calce Preferido */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 600, marginBottom: '8px' }}>Calce preferido</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {[
                      { val: 'ajustado', label: 'Ajustado' },
                      { val: 'normal', label: 'Regular' },
                      { val: 'suelto', label: 'Suelto' }
                    ].map(fOption => (
                      <button
                        key={fOption.val}
                        type="button"
                        onClick={() => setFit(fOption.val)}
                        style={{
                          padding: '8px 4px', border: '0.5px solid', 
                          borderColor: fit === fOption.val ? '#0f0f0f' : '#e0dbd4',
                          background: fit === fOption.val ? '#0f0f0f' : 'transparent',
                          color: fit === fOption.val ? '#fff' : '#6b6560',
                          fontSize: '0.72rem', cursor: 'pointer', borderRadius: '3px',
                          transition: 'all 0.2s', fontFamily: 'var(--font-sans)'
                        }}
                      >
                        {fOption.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const recommended = calculateRecommendedSize(height, weight, fit);
                    setSizerResult(recommended);
                  }}
                  style={{
                    marginTop: '10px', width: '100%', padding: '13px', background: '#0f0f0f', color: '#fff',
                    border: 'none', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                    fontWeight: 600, cursor: 'pointer', borderRadius: '3px'
                  }}
                >
                  Calcular talle
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 0 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📏</div>
                <p style={{ margin: '0 0 6px', fontSize: '0.82rem', color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Talle recomendado</p>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', fontWeight: 300, margin: '0 0 16px', color: '#0f0f0f' }}>
                  {sizerResult}
                </h2>
                
                <div style={{ background: '#f5f3f0', padding: '12px 16px', borderRadius: '4px', fontSize: '0.78rem', color: '#6b6560', lineHeight: 1.5, marginBottom: '24px' }}>
                  Para una altura de <strong>{height}cm</strong> y un peso de <strong>{weight}kg</strong> con calce <strong>{fit === 'normal' ? 'regular' : fit}</strong>, estimamos que el talle {sizerResult} se adaptará idealmente a tu cuerpo.
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      const measurements = { height, weight, fit, size: sizerResult };
                      localStorage.setItem('cnb_user_measurements', JSON.stringify(measurements));
                      setSavedMeasurements(measurements);
                      if (availableSizes && availableSizes.includes(sizerResult)) {
                        setSelectedSize(sizerResult);
                      }
                      setShowSizerModal(false);
                      setSizerResult(null);
                      toast.success("Talle guardado en tu perfil");
                    }}
                    style={{
                      flex: 1, padding: '12px', background: '#0f0f0f', color: '#fff',
                      border: 'none', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                      fontWeight: 600, cursor: 'pointer', borderRadius: '3px'
                    }}
                  >
                    Guardar datos
                  </button>
                  <button
                    onClick={() => setSizerResult(null)}
                    style={{
                      padding: '12px 18px', border: '0.5px solid #d4cfc8', background: 'transparent',
                      color: '#6b6560', fontSize: '0.72rem', cursor: 'pointer', borderRadius: '3px',
                      fontFamily: 'var(--font-sans)'
                    }}
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox / Zoom / Download Modal */}
      {isLightboxOpen && images.length > 0 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 5000, padding: '20px', animation: 'sizerFadeIn 0.2s ease-out'
        }}
        onClick={() => { setIsLightboxOpen(false); setIsZoomed(false); }}
        >
          {/* Header Controls */}
          <div style={{
            position: 'absolute', top: '20px', left: 0, right: 0,
            display: 'flex', justifyContent: 'space-between', padding: '0 24px',
            zIndex: 5100, pointerEvents: 'none'
          }}>
            {/* Info / Title */}
            <div style={{ color: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.78rem', letterSpacing: '0.1em', pointerEvents: 'auto' }}>
              <span style={{ fontWeight: 600 }}>{product.name}</span>
              <span style={{ color: '#888', marginLeft: '8px' }}>({currentImageIndex + 1} de {images.length})</span>
            </div>

            {/* Actions: Zoom, Download, Close */}
            <div style={{ display: 'flex', gap: '16px', pointerEvents: 'auto' }}>
              {/* Zoom Button */}
              <button 
                onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
                style={{
                  background: 'none', border: 'none', color: '#fafaf8', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-sans)',
                  fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase'
                }}
                title={isZoomed ? "Reducir" : "Ampliar"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  {isZoomed ? (
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  ) : (
                    <>
                      <line x1="11" y1="8" x2="11" y2="14"></line>
                      <line x1="8" y1="11" x2="14" y2="11"></line>
                    </>
                  )}
                </svg>
                {isZoomed ? "Ajustar" : "Zoom"}
              </button>

              {/* Download Button */}
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleDownloadImage(images[currentImageIndex], `${product.slug}-${currentImageIndex + 1}.jpg`);
                }}
                style={{
                  background: 'none', border: 'none', color: '#fafaf8', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-sans)',
                  fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase'
                }}
                title="Descargar imagen"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Descargar
              </button>

              {/* Close Button */}
              <button 
                onClick={() => { setIsLightboxOpen(false); setIsZoomed(false); }}
                style={{
                  background: 'none', border: 'none', color: '#fafaf8', cursor: 'pointer',
                  fontSize: '1.2rem', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center'
                }}
                title="Cerrar"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Main Image Viewport */}
          <div 
            style={{
              width: '100%',
              height: '80vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Nav Arrow inside lightbox */}
            {images.length > 1 && !isZoomed && (
              <button 
                onClick={handlePrevImage}
                style={{
                  position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                  width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer',
                  fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 5200, transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                ‹
              </button>
            )}

            {/* Right Nav Arrow inside lightbox */}
            {images.length > 1 && !isZoomed && (
              <button 
                onClick={handleNextImage}
                style={{
                  position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                  width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer',
                  fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 5200, transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                ›
              </button>
            )}

            {/* Zoomable Image Wrapper */}
            <div 
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: isZoomed ? 'hidden' : 'visible',
                position: 'relative'
              }}
              onClick={() => setIsZoomed(!isZoomed)}
              onMouseMove={handleMouseMove}
            >
              <img 
                src={images[currentImageIndex]} 
                alt={`${product.name} - ampliada`}
                style={{
                  maxWidth: isZoomed ? 'none' : '90%',
                  maxHeight: isZoomed ? 'none' : '90%',
                  width: isZoomed ? 'auto' : 'auto',
                  height: isZoomed ? 'auto' : 'auto',
                  objectFit: 'contain',
                  transformOrigin: isZoomed ? `${zoomPos.x}% ${zoomPos.y}%` : 'center center',
                  transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
                  cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                  transition: isZoomed ? 'none' : 'transform 0.2s ease',
                  userSelect: 'none'
                }}
              />
            </div>
          </div>

          {/* Dots inside lightbox */}
          {images.length > 1 && !isZoomed && (
            <div style={{
              position: 'absolute', bottom: '30px',
              display: 'flex', gap: '8px', zIndex: 5200
            }}>
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    border: 'none',
                    background: currentImageIndex === idx ? '#fff' : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'background 0.2s'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
