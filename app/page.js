'use client';
import { useState, useRef } from 'react';

export default function Home() {
  const [personPreview, setPersonPreview] = useState(null);
  const [garmentPreview, setGarmentPreview] = useState(null);
  const [personFile, setPersonFile] = useState(null);
  const [garmentFile, setGarmentFile] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const personRef = useRef();
  const garmentRef = useRef();

  const handleFile = (type, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'person') { setPersonPreview(url); setPersonFile(file); }
    else { setGarmentPreview(url); setGarmentFile(file); }
    setResult(null);
    setError('');
  };

  const generate = async () => {
    if (!personFile || !garmentFile) return;
    setLoading(true);
    setError('');
    setResult(null);
    setStatus('Enviando imágenes a Gemini Flash...');

    const fd = new FormData();
    fd.append('person', personFile);
    fd.append('garment', garmentFile);

    try {
      setStatus('Generando... puede tardar ~15 segundos');
      const res = await fetch('/api/tryon', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error desconocido'); }
      else { setResult(data.image); setStatus(''); }
    } catch (e) {
      setError('Error de conexión: ' + e.message);
    }
    setLoading(false);
  };

  const s = {
    page: { maxWidth: 480, margin: '0 auto', padding: '2rem 1rem' },
    header: { textAlign: 'center', marginBottom: '2rem' },
    subtitle: { fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', margin: '0 0 6px' },
    title: { fontSize: 32, fontWeight: 400, letterSpacing: '0.05em', color: '#1a1a1a', margin: 0 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
    zone: (hasImg) => ({
      border: `0.5px solid ${hasImg ? '#bbb' : '#ddd'}`,
      borderRadius: 12,
      minHeight: 180,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', background: '#fff', overflow: 'hidden', position: 'relative',
      transition: 'border-color 0.2s',
    }),
    previewImg: { width: '100%', height: 180, objectFit: 'cover' },
    zoneLabel: { fontSize: 12, color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 8 },
    zoneHint: { fontSize: 11, color: '#bbb', marginTop: 2 },
    icon: { fontSize: 28, marginBottom: 4 },
    btn: (disabled) => ({
      width: '100%', padding: '13px', fontSize: 13, letterSpacing: '0.12em',
      textTransform: 'uppercase', background: disabled ? '#ccc' : '#1a1a1a',
      color: '#fff', border: 'none', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background 0.2s', marginBottom: 10,
    }),
    status: { fontSize: 12, color: '#888', textAlign: 'center', minHeight: 18, letterSpacing: '0.04em' },
    error: { fontSize: 12, color: '#c0392b', textAlign: 'center', marginTop: 8 },
    resultWrap: { marginTop: 20, border: '0.5px solid #e0e0e0', borderRadius: 12, overflow: 'hidden', background: '#fff' },
    resultImg: { width: '100%', display: 'block' },
    resultLabel: { padding: '10px 14px', fontSize: 11, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' },
    disclaimer: { fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 10, lineHeight: 1.6 },
    envNote: { background: '#fff8e1', border: '0.5px solid #ffe082', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#7a6000', marginBottom: 16, lineHeight: 1.6 },
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <p style={s.subtitle}>Powered by Gemini Flash</p>
        <h1 style={s.title}>Probador Virtual</h1>
      </div>

      <div style={s.envNote}>
        📋 Configurá tu API key en <code>.env.local</code>:<br />
        <code>GEMINI_API_KEY=tu_key_aqui</code><br />
        Obtené la key gratis en <strong>aistudio.google.com/apikey</strong>
      </div>

      <div style={s.grid}>
        <div style={s.zone(!!personPreview)} onClick={() => personRef.current.click()}>
          <input ref={personRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => handleFile('person', e.target.files[0])} />
          {personPreview
            ? <img src={personPreview} style={s.previewImg} alt="Tu foto" />
            : <>
                <div style={s.icon}>👤</div>
                <div style={s.zoneLabel}>Tu foto</div>
                <div style={s.zoneHint}>Cuerpo entero</div>
              </>
          }
        </div>

        <div style={s.zone(!!garmentPreview)} onClick={() => garmentRef.current.click()}>
          <input ref={garmentRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => handleFile('garment', e.target.files[0])} />
          {garmentPreview
            ? <img src={garmentPreview} style={s.previewImg} alt="La prenda" />
            : <>
                <div style={s.icon}>👕</div>
                <div style={s.zoneLabel}>La prenda</div>
                <div style={s.zoneHint}>Foto del producto</div>
              </>
          }
        </div>
      </div>

      <button style={s.btn(!personFile || !garmentFile || loading)} onClick={generate}
        disabled={!personFile || !garmentFile || loading}>
        {loading ? '⏳ Generando...' : 'Probarme esta prenda'}
      </button>

      {status && <div style={s.status}>{status}</div>}
      {error && <div style={s.error}>⚠ {error}</div>}

      {result && (
        <div style={s.resultWrap}>
          <img src={result} style={s.resultImg} alt="Resultado del probador virtual" />
          <div style={s.resultLabel}>Resultado generado por IA · Gemini Flash</div>
        </div>
      )}

      {result && (
        <div style={s.disclaimer}>
          Los resultados son aproximados y pueden no reflejar con exactitud<br />
          el ajuste real de la prenda.
        </div>
      )}
    </div>
  );
}
