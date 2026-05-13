'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useFittingRoom } from './FittingRoomContext';
import { useCart } from './CartContext';

const ZONE_CONFIG = [
  { category: 'gorro',      label: 'Gorro',      pos: { top: 2,   left: 76  } },
  { category: 'remera',     label: 'Remera',     pos: { top: 68,  left: 10  } },
  { category: 'camisa',     label: 'Camisa',     pos: { top: 118, left: 10  } },
  { category: 'abrigo',     label: 'Abrigo',     pos: { top: 68,  left: 142 } },
  { category: 'pantalon',   label: 'Pantalón',   pos: { top: 155, left: 10  } },
  { category: 'zapatillas', label: 'Zapatillas', pos: { top: 215, left: 76  } },
  { category: 'accesorio',  label: 'Accesorio',  pos: { top: 148, left: 142 } },
];

export default function FittingRoomPanel() {
  const { items, isPanelOpen, setIsPanelOpen, removeFromFittingRoom } = useFittingRoom();
  const { addItem, setIsOpen: openCart } = useCart();
  const { data: session } = useSession();

  const [bodyPhotoUrl,    setBodyPhotoUrl]    = useState(null);
  const [bodyPhotoPreview, setBodyPhotoPreview] = useState(null);
  const [uploadingPhoto,  setUploadingPhoto]  = useState(false);
  const [generating,      setGenerating]      = useState(false);
  const [result,          setResult]          = useState(null);
  const [addedAll,        setAddedAll]        = useState(false);
  const [error,           setError]           = useState('');
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/profile/body-photo')
      .then(r => r.json())
      .then(d => { if (d.body_photo_url) setBodyPhotoUrl(d.body_photo_url); })
      .catch(() => {});
  }, [session]);

  const handlePhotoSelect = async (file) => {
    if (!file) return;
    setBodyPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('body_photo', file);
      const res  = await fetch('/api/profile/body-photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) setBodyPhotoUrl(data.body_photo_url);
    } catch {}
    setUploadingPhoto(false);
  };

  const buildCollage = async (urls) => {
    // Trae cada URL como blob local para evitar problemas de CORS en Canvas
    const blobs = await Promise.all(urls.map(url => fetch(url).then(r => r.blob())));

    if (blobs.length === 1) return blobs[0];

    const images = await Promise.all(
      blobs.map(blob => {
        const objUrl = URL.createObjectURL(blob);
        return new Promise((res, rej) => {
          const img = new Image();
          img.onload  = () => { URL.revokeObjectURL(objUrl); res(img); };
          img.onerror = rej;
          img.src = objUrl;
        });
      })
    );

    const CELL = 300;
    const cols = Math.ceil(Math.sqrt(images.length));
    const rows = Math.ceil(images.length / cols);
    const canvas = document.createElement('canvas');
    canvas.width  = cols * CELL;
    canvas.height = rows * CELL;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    images.forEach((img, i) => {
      const col   = i % cols;
      const row   = Math.floor(i / cols);
      const scale = Math.min(CELL / img.width, CELL / img.height) * 0.85;
      const w = img.width  * scale;
      const h = img.height * scale;
      ctx.drawImage(img, col * CELL + (CELL - w) / 2, row * CELL + (CELL - h) / 2, w, h);
    });
    return new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.88));
  };

  const handleTryOn = async () => {
    if (!bodyPhotoUrl || items.length === 0) return;
    setGenerating(true);
    setResult(null);
    setError('');
    try {
      // Fetch person photo as file
      const personBlob = await fetch(bodyPhotoUrl).then(r => r.blob());
      const personFile = new File([personBlob], 'person.jpg', { type: personBlob.type || 'image/jpeg' });

      // Build collage of clothing items (same logic as /probador)
      const collageBlob = await buildCollage(items.map(i => i.image_url));

      const fd = new FormData();
      fd.append('person',  personFile);
      fd.append('garment', collageBlob, 'collage.jpg');

      const res  = await fetch('/api/tryon', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) setResult(data.image);
      else setError(data.error || 'Error al generar');
    } catch (e) {
      setError('Error: ' + e.message);
    }
    setGenerating(false);
  };

  const handleAddAllToCart = async () => {
    for (const item of items) {
      await addItem(item.id);
    }
    setAddedAll(true);
    openCart(true);
    setTimeout(() => setAddedAll(false), 2000);
  };

  const canTryOn    = !!bodyPhotoUrl && !uploadingPhoto && items.length > 0 && !generating;
  const displayPhoto = bodyPhotoPreview || bodyPhotoUrl;

  return (
    <>
      {isPanelOpen && (
        <div
          onClick={() => setIsPanelOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 999, backdropFilter: 'blur(2px)' }}
        />
      )}

      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh',
        width: isPanelOpen ? '420px' : '0', maxWidth: '100vw',
        background: 'var(--store-panel-bg, #fafaf8)', zIndex: 1000,
        transition: 'width 0.3s ease', overflow: 'hidden',
        borderLeft: '0.5px solid rgba(128,128,128,0.2)',
        color: 'var(--store-panel-text, #0f0f0f)',
      }}>
        <div style={{
          width: '420px', maxWidth: '100vw', height: '100%',
          display: 'flex', flexDirection: 'column',
          padding: '24px', boxSizing: 'border-box',
          overflowY: 'auto',
        }}>

          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '20px', paddingBottom: '16px',
            borderBottom: '0.5px solid rgba(128,128,128,0.2)', flexShrink: 0,
          }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.4rem', margin: 0, letterSpacing: '0.04em', color: 'var(--store-panel-text, #0f0f0f)' }}>
              Tu vestidor
            </h2>
            <button
              onClick={() => setIsPanelOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--store-panel-text, #6b6560)', padding: '4px', lineHeight: 1, opacity: 0.6 }}
            >
              ✕
            </button>
          </div>

          {/* Tu outfit */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 14px', fontFamily: 'var(--font-sans)', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--store-panel-text, #6b6560)', opacity: 0.7 }}>
              Tu outfit
            </p>

            {/* Silueta + thumbnails */}
            <div style={{ position: 'relative', width: '200px', height: '270px', margin: '0 auto' }}>

              {/* Silueta SVG */}
              <div style={{ position: 'absolute', top: 50, left: 70 }}>
                <svg viewBox="0 0 60 140" width="60" height="140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="30" cy="12" r="10" stroke="#d4cfc8" strokeWidth="1.5"/>
                  <rect x="15" y="26" width="30" height="44" rx="4" stroke="#d4cfc8" strokeWidth="1.5"/>
                  <line x1="15" y1="32" x2="4"  y2="66" stroke="#d4cfc8" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="45" y1="32" x2="56" y2="66" stroke="#d4cfc8" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="22" y1="70" x2="18" y2="110" stroke="#d4cfc8" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="38" y1="70" x2="42" y2="110" stroke="#d4cfc8" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="18" y1="110" x2="10" y2="118" stroke="#d4cfc8" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="42" y1="110" x2="50" y2="118" stroke="#d4cfc8" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>

              {/* Thumbnails por zona */}
              {ZONE_CONFIG.map(zone => {
                const item = items.find(i => i.category === zone.category);
                return (
                  <div key={zone.category} style={{ position: 'absolute', top: zone.pos.top, left: zone.pos.left, width: 48, height: 48 }}>
                    {item ? (
                      <div style={{ position: 'relative', width: 48, height: 48 }}>
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #e0dbd4' }}
                        />
                        <button
                          onClick={() => removeFromFittingRoom(item.id)}
                          title="Quitar"
                          style={{
                            position: 'absolute', top: -6, right: -6,
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#0f0f0f', color: '#fff',
                            border: 'none', fontSize: 9, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0, lineHeight: 1,
                          }}
                        >✕</button>
                      </div>
                    ) : (
                      <div style={{
                        width: 48, height: 48, borderRadius: 6,
                        border: '1px dashed #d4cfc8',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 2,
                      }}>
                        <span style={{ fontSize: 13, color: '#d4cfc8', lineHeight: 1 }}>+</span>
                        <span style={{ fontSize: 7, color: '#c8c4bc', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
                          {zone.label}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {items.length > 0 && (
              <p style={{ textAlign: 'center', marginTop: 10, fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#6b6560' }}>
                {items.length} prenda{items.length !== 1 ? 's' : ''} seleccionada{items.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Probarte este outfit */}
          <div style={{ borderTop: '0.5px solid rgba(128,128,128,0.2)', paddingTop: '20px' }}>

            {/* Paso 1: Foto */}
            <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-sans)', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--store-panel-text, #6b6560)', opacity: 0.7 }}>
              Paso 1 — Tu foto de cuerpo
            </p>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={e => handlePhotoSelect(e.target.files?.[0])}
              style={{ display: 'none' }}
            />

            {displayPhoto ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '10px', background: '#f5f3f0', borderRadius: 6, border: '0.5px solid #e0dbd4' }}>
                <img
                  src={displayPhoto}
                  alt="Tu foto"
                  style={{ width: 52, height: 68, objectFit: 'cover', borderRadius: 4, border: '0.5px solid #e0dbd4', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: '#0f0f0f' }}>
                    {uploadingPhoto ? 'Subiendo...' : '✓ Foto lista'}
                  </p>
                  <p style={{ margin: '0 0 8px', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: '#888' }}>
                    Guardada en tu perfil
                  </p>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    style={{ border: '0.5px solid #e0dbd4', background: '#fff', cursor: 'pointer', padding: '5px 10px', fontSize: '0.66rem', borderRadius: '2px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => photoInputRef.current?.click()}
                style={{ border: '1px dashed #d4cfc8', borderRadius: 6, padding: '20px', textAlign: 'center', cursor: 'pointer', marginBottom: '16px', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#888'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#d4cfc8'}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>👤</div>
                <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: '#6b6560' }}>
                  Subí una foto de cuerpo entero
                </p>
                <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: '#aaa' }}>
                  Se guarda en tu perfil para reutilizar
                </p>
              </div>
            )}

            {/* Paso 2: Botón */}
            <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-sans)', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--store-panel-text, #6b6560)', opacity: 0.7 }}>
              Paso 2 — Generá tu look
            </p>

            <button
              onClick={handleTryOn}
              disabled={!canTryOn}
              style={{
                width: '100%', padding: '13px',
                background: canTryOn ? '#0f0f0f' : '#f0ede8',
                color: canTryOn ? '#fafaf8' : '#aaa',
                border: '0.5px solid',
                borderColor: canTryOn ? '#0f0f0f' : '#e0dbd4',
                fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                cursor: canTryOn ? 'pointer' : 'not-allowed',
                borderRadius: '2px', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {generating && (
                <span style={{
                  display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
                  border: '1.5px solid #888', borderTopColor: '#fafaf8',
                  animation: 'frSpin 0.8s linear infinite', flexShrink: 0,
                }}/>
              )}
              {generating ? 'Generando tu look...' : 'Probarme este outfit →'}
            </button>

            {!bodyPhotoUrl && !uploadingPhoto && (
              <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: '#aaa', textAlign: 'center' }}>
                Primero subí tu foto de cuerpo
              </p>
            )}
            {items.length === 0 && (
              <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: '#aaa', textAlign: 'center' }}>
                Agregá prendas al vestidor desde los productos
              </p>
            )}

            {error && (
              <p style={{ margin: '10px 0 0', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#c0392b' }}>
                ⚠ {error}
              </p>
            )}
          </div>

          {/* Resultado */}
          {result && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '0.5px solid rgba(128,128,128,0.2)' }}>
              <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-sans)', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--store-panel-text, #6b6560)', opacity: 0.7 }}>
                Tu look
              </p>
              <div style={{ border: '0.5px solid #e0dbd4', borderRadius: 6, overflow: 'hidden', marginBottom: '12px' }}>
                <img src={result} alt="Look generado" style={{ width: '100%', display: 'block' }} />
              </div>
              {items.length > 0 && (
                <button
                  onClick={handleAddAllToCart}
                  style={{
                    width: '100%', padding: '12px',
                    background: addedAll ? '#2e7d32' : '#0f0f0f',
                    color: '#fafaf8', border: 'none',
                    fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    cursor: 'pointer', borderRadius: '2px', transition: 'background 0.3s',
                  }}
                >
                  {addedAll ? '✓ Agregado al carrito' : 'Agregar todo al carrito'}
                </button>
              )}
            </div>
          )}

          <style>{`@keyframes frSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </>
  );
}
