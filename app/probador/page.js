'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

async function buildGarmentCollage(files) {
  if (files.length === 1) return files[0];
  const images = await Promise.all(
    files.map(f => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = URL.createObjectURL(f);
    }))
  );
  const CELL = 300;
  const cols = Math.ceil(Math.sqrt(images.length));
  const rows = Math.ceil(images.length / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * CELL;
  canvas.height = rows * CELL;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  images.forEach((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * CELL;
    const y = row * CELL;
    const scale = Math.min(CELL / img.width, CELL / img.height) * 0.85;
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, x + (CELL - w) / 2, y + (CELL - h) / 2, w, h);
  });
  return new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.88));
}

const GARMENT_TYPES = [
  { id: 'shirt',  label: 'Remera',   icon: '👕', hint: 'Foto frontal' },
  { id: 'pants',  label: 'Pantalón', icon: '👖', hint: 'Foto completa' },
  { id: 'jacket', label: 'Abrigo',   icon: '🧥', hint: 'Foto frontal' },
  { id: 'hat',    label: 'Gorro',    icon: '🧢', hint: 'Foto del producto' },
  { id: 'shoes',  label: 'Zapatos',  icon: '👟', hint: 'Par de frente' },
];

export default function Probador() {
  const [personPreview, setPersonPreview] = useState(null);
  const [personFile, setPersonFile]       = useState(null);
  const [garments, setGarments]           = useState({});
  const [result, setResult]               = useState(null);
  const [status, setStatus]               = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [isMobile, setIsMobile]           = useState(false);

  const personRef   = useRef();
  const garmentRefs = useRef({});

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handlePerson = f => {
    if (!f) return;
    setPersonPreview(URL.createObjectURL(f));
    setPersonFile(f);
    setResult(null);
  };

  const handleGarment = (id, f) => {
    if (!f) return;
    setGarments(prev => ({ ...prev, [id]: { file: f, preview: URL.createObjectURL(f) } }));
    setResult(null);
  };

  const removeGarment = id => setGarments(prev => { const n = { ...prev }; delete n[id]; return n; });

  const garmentFiles = Object.values(garments).map(g => g.file);
  const canGenerate  = personFile && garmentFiles.length > 0 && !loading;

  const generate = async () => {
    if (!canGenerate) return;
    setLoading(true); setError(''); setResult(null);
    try {
      setStatus(garmentFiles.length > 1 ? `Combinando ${garmentFiles.length} prendas…` : 'Preparando imágenes…');
      const collage = await buildGarmentCollage(garmentFiles);
      setStatus('Enviando a Gemini Flash…');
      const fd = new FormData();
      fd.append('person', personFile);
      fd.append('garment', collage, 'collage.jpg');
      setStatus('Generando prueba virtual · ~15 segundos');
      const res  = await fetch('/api/tryon', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Error desconocido');
      else { setResult(data.image); setStatus(''); }
    } catch (e) { setError('Error: ' + e.message); }
    setLoading(false);
  };

  const photoHeight = isMobile ? 240 : 380;

  return (
    <div style={{ minHeight: '100vh', background: '#0c0c0b', color: '#f0ede8', fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 1.2rem' : '0 2.5rem', height: isMobile ? 52 : 60,
        background: 'rgba(12,12,11,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
      }}>
        <Link href="/" style={{ textDecoration: 'none', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 17 : 20, fontWeight: 400, letterSpacing: '0.08em', color: '#f0ede8' }}>
          FASHION<span style={{ color: '#888' }}>MALL</span>
        </Link>
        <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#666' }}>
          Probador Virtual
        </div>
        {!isMobile && (
          <div style={{ fontSize: 11, letterSpacing: '0.1em', color: '#555' }}>
            IA · Gemini Flash
          </div>
        )}
        {isMobile && <div style={{ width: 40 }} />}
      </nav>

      {/* ── CONTENIDO ── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '72px 1rem 4rem' : '100px 2rem 6rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 56 }}>
          <div style={{
            display: 'inline-block', fontSize: 10, letterSpacing: '0.25em',
            textTransform: 'uppercase', color: '#888', border: '0.5px solid #333',
            padding: '5px 16px', borderRadius: 20, marginBottom: 16,
          }}>
            Powered by Gemini Flash
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: isMobile ? '2.4rem' : 'clamp(2.8rem, 6vw, 5rem)',
            fontWeight: 300, letterSpacing: '0.04em',
            margin: '0 0 12px', color: '#f0ede8', lineHeight: 1,
          }}>
            Probador Virtual
          </h1>
          <p style={{ fontSize: isMobile ? 13 : 14, color: '#666', maxWidth: 400, margin: '0 auto', lineHeight: 1.8 }}>
            Subí tu foto, elegí las prendas y la IA te muestra el conjunto completo
          </p>
        </div>

        {/* ── GRID PRINCIPAL ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1.1fr',
          gap: isMobile ? 20 : 24,
          marginBottom: 24,
        }}>

          {/* Columna: foto persona */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#555', marginBottom: 10 }}>
              01 — Tu foto
            </div>
            <div
              onClick={() => personRef.current.click()}
              style={{
                border: `0.5px solid ${personPreview ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 16, minHeight: photoHeight,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', background: personPreview ? 'transparent' : 'rgba(255,255,255,0.02)',
                overflow: 'hidden', transition: 'all 0.3s', position: 'relative',
              }}
              onMouseEnter={e => { if (!personPreview) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!personPreview) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
              <input ref={personRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => handlePerson(e.target.files[0])} />
              {personPreview ? (
                <>
                  <img src={personPreview} style={{ width: '100%', height: photoHeight, objectFit: 'cover' }} alt="Tu foto" />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    padding: '24px 16px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em' }}>Foto cargada ✓</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cambiar</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    border: '0.5px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, marginBottom: 14, background: 'rgba(255,255,255,0.04)',
                  }}>👤</div>
                  <div style={{ fontSize: 13, color: '#888', letterSpacing: '0.06em', marginBottom: 6 }}>Subí tu foto</div>
                  <div style={{ fontSize: 11, color: '#444', letterSpacing: '0.04em' }}>Cuerpo entero · buena iluminación</div>
                </>
              )}
            </div>

            {/* Tip */}
            <div style={{
              marginTop: 10, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)',
              fontSize: 11, color: '#555', lineHeight: 1.7,
            }}>
              💡 Mejor resultado con foto de cuerpo entero, fondo claro y buena iluminación
            </div>
          </div>

          {/* Columna: prendas */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#555', marginBottom: 10 }}>
              02 — Armá tu conjunto
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {GARMENT_TYPES.map((type, idx) => {
                const g = garments[type.id];
                return (
                  <div key={type.id} style={{
                    display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14,
                    border: `0.5px solid ${g ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 12, padding: isMobile ? '8px 10px' : '10px 14px',
                    background: g ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
                    transition: 'all 0.2s',
                  }}>
                    {/* Número */}
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: `0.5px solid ${g ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: g ? '#aaa' : '#444', flexShrink: 0,
                    }}>
                      {g ? '✓' : idx + 1}
                    </div>

                    {/* Preview o ícono */}
                    {g ? (
                      <img src={g.preview} style={{
                        width: isMobile ? 40 : 48, height: isMobile ? 40 : 48,
                        objectFit: 'cover', borderRadius: 8,
                        border: '0.5px solid rgba(255,255,255,0.1)', flexShrink: 0,
                      }} alt={type.label} />
                    ) : (
                      <div style={{
                        width: isMobile ? 40 : 48, height: isMobile ? 40 : 48,
                        borderRadius: 8, border: '0.5px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: isMobile ? 18 : 22, flexShrink: 0,
                        background: 'rgba(255,255,255,0.02)',
                      }}>
                        {type.icon}
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isMobile ? 12 : 13, color: g ? '#e0dbd4' : '#666', marginBottom: 2 }}>
                        {type.label}
                      </div>
                      <div style={{ fontSize: 10, color: g ? '#555' : '#3a3a38' }}>
                        {g ? 'Cargada ✓' : type.hint}
                      </div>
                    </div>

                    {/* Botones */}
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <button
                        onClick={() => {
                          if (!garmentRefs.current[type.id]) garmentRefs.current[type.id] = document.createElement('input');
                          const inp = garmentRefs.current[type.id];
                          inp.type = 'file'; inp.accept = 'image/*';
                          inp.onchange = e => handleGarment(type.id, e.target.files[0]);
                          inp.click();
                        }}
                        style={{
                          fontSize: 9, padding: isMobile ? '4px 8px' : '5px 12px', borderRadius: 6,
                          border: '0.5px solid rgba(255,255,255,0.12)',
                          background: 'rgba(255,255,255,0.05)',
                          cursor: 'pointer', letterSpacing: '0.1em',
                          textTransform: 'uppercase', color: '#888', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ccc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#888'; }}
                      >
                        {g ? 'Cambiar' : 'Subir'}
                      </button>
                      {g && (
                        <button
                          onClick={() => removeGarment(type.id)}
                          style={{
                            fontSize: 9, padding: '4px 7px', borderRadius: 6,
                            border: '0.5px solid rgba(255,80,80,0.2)',
                            background: 'rgba(255,80,80,0.05)',
                            cursor: 'pointer', color: '#c0392b', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.12)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.05)'; }}
                        >✕</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Badge costo */}
            {garmentFiles.length > 0 && (
              <div style={{
                marginTop: 10, padding: '8px 12px', borderRadius: 8,
                background: 'rgba(20,80,40,0.2)', border: '0.5px solid rgba(40,160,80,0.2)',
                fontSize: 11, color: '#4a9', lineHeight: 1.7,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>{garmentFiles.length} prenda{garmentFiles.length > 1 ? 's' : ''}{garmentFiles.length > 1 ? ' → 1 imagen' : ''}</span>
                <span style={{ fontWeight: 500 }}>Costo: $0.072</span>
              </div>
            )}
          </div>
        </div>

        {/* ── BOTÓN GENERAR ── */}
        <button
          onClick={generate}
          disabled={!canGenerate}
          style={{
            width: '100%', padding: isMobile ? '16px' : '18px',
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            background: canGenerate ? 'linear-gradient(135deg, #f0ede8 0%, #d4cfc8 100%)' : 'rgba(255,255,255,0.05)',
            color: canGenerate ? '#0c0c0b' : '#333',
            border: 'none', borderRadius: 10,
            cursor: canGenerate ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s', fontWeight: 500,
          }}
        >
          {loading
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={{
                  display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
                  border: '1.5px solid #555', borderTopColor: '#0c0c0b',
                  animation: 'spin 0.8s linear infinite',
                }}/>
                Generando conjunto virtual…
              </span>
            : !personFile ? 'Subí tu foto para comenzar'
            : garmentFiles.length === 0 ? 'Seleccioná al menos una prenda'
            : 'Probarme este conjunto →'
          }
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {status && <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#555', letterSpacing: '0.04em' }}>{status}</div>}
        {error  && <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#c0392b' }}>⚠ {error}</div>}

        {/* ── RESULTADO ── */}
        {result && (
          <div style={{ marginTop: 40 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#555', marginBottom: 14 }}>
              03 — Resultado
            </div>
            <div style={{ border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden', background: '#111' }}>
              <img src={result} style={{ width: '100%', display: 'block' }} alt="Resultado del probador" />
              <div style={{
                padding: isMobile ? '12px 14px' : '14px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '0.5px solid rgba(255,255,255,0.06)',
                flexWrap: 'wrap', gap: 6,
              }}>
                <span style={{ fontSize: 11, color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Generado por IA · Gemini Flash
                </span>
                <span style={{ fontSize: 11, color: '#333' }}>Resultado aproximado</span>
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <footer style={{
          marginTop: 60, paddingTop: 24,
          borderTop: '0.5px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center', justifyContent: 'space-between',
          gap: isMobile ? 12 : 0,
          textAlign: isMobile ? 'center' : 'left',
        }}>
          <Link href="/" style={{ textDecoration: 'none', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, color: '#f0ede8', letterSpacing: '0.08em' }}>
            FASHION<span style={{ color: '#555' }}>MALL</span>
          </Link>
          <div style={{ fontSize: 11, color: '#333', letterSpacing: '0.06em' }}>
            © {new Date().getFullYear()} FashionMall
          </div>
        </footer>

      </div>
    </div>
  );
}