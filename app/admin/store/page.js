'use client';
import { useState, useEffect } from 'react';

const FONTS = ['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Poppins', 'Raleway', 'Open Sans', 'Lato', 'Nunito', 'Oswald'];

const lbl = { display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' };
const inp = { width: '100%', padding: '9px 11px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none', borderRadius: '2px', boxSizing: 'border-box', color: '#0f0f0f' };

export default function AdminStorePage() {
  const [store,        setStore]        = useState(null);
  const [images,       setImages]       = useState([]);
  const [form,         setForm]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [logoFile,     setLogoFile]     = useState(null);
  const [uploadingLogo,setUploadingLogo]= useState(false);
  const [imgFile,      setImgFile]      = useState(null);
  const [imgCaption,   setImgCaption]   = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => {
    fetch('/api/admin/store', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return; }
        setStore(data);
        setImages(data.images || []);
        setForm({
          name:            data.name,
          tagline:         data.tagline || '',
          primary_color:   data.primary_color || '#009aae',
          secondary_color: data.secondary_color || '#ffffff',
          font_family:     data.font_family || 'Inter',
          hero_title:      data.hero_title || '',
          hero_subtitle:   data.hero_subtitle || '',
          about_text:      data.about_text || '',
        });
      })
      .catch(() => setError('Error al cargar datos de la tienda'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const res  = await fetch('/api/admin/store', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStore(data);
      setSuccess('Cambios guardados correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadLogo(e) {
    e.preventDefault();
    if (!logoFile) return;
    setUploadingLogo(true); setError('');
    try {
      const fd = new FormData();
      fd.append('logo', logoFile);
      const res  = await fetch('/api/admin/store/logo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStore(prev => ({ ...prev, logo_url: data.logo_url }));
      setLogoFile(null);
      setSuccess('Logo actualizado');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleDeleteLogo() {
    try {
      await fetch('/api/admin/store/logo', { method: 'DELETE' });
      setStore(prev => ({ ...prev, logo_url: null }));
    } catch {
      setError('Error al eliminar logo');
    }
  }

  async function handleUploadImage(e) {
    e.preventDefault();
    if (!imgFile) return;
    setUploadingImg(true); setError('');
    try {
      const fd = new FormData();
      fd.append('image',      imgFile);
      fd.append('caption',    imgCaption);
      fd.append('sort_order', String(images.length));
      const res  = await fetch('/api/admin/store/images', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImages(prev => [...prev, data]);
      setImgFile(null); setImgCaption('');
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingImg(false);
    }
  }

  async function handleDeleteImage(imgId) {
    try {
      await fetch(`/api/admin/store/images/${imgId}`, { method: 'DELETE' });
      setImages(prev => prev.filter(i => i.id !== imgId));
    } catch {
      setError('Error al eliminar imagen');
    }
  }

  async function moveImage(index, direction) {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
    await Promise.all(next.map((img, i) =>
      fetch(`/api/admin/store/images/${img.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: i, caption: img.caption }),
      })
    ));
  }

  if (loading) return <div style={{ padding: '3rem', color: '#6b6560', fontFamily: 'var(--font-sans)' }}>Cargando...</div>;

  if (!form) return (
    <div style={{ padding: '3rem', fontFamily: 'var(--font-sans)' }}>
      <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '16px', borderRadius: '4px', color: '#c0392b' }}>
        {error || 'No tenés una tienda asignada. Contactá al superadmin.'}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 8px', letterSpacing: '0.02em' }}>
        Mi tienda
      </h1>
      <p style={{ color: '#6b6560', fontSize: '0.8rem', margin: '0 0 28px' }}>
        Editá el contenido y apariencia de <strong>{store.name}</strong>
      </p>

      {error && <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', color: '#c0392b', fontSize: '0.8rem' }}>{error}</div>}
      {success && <div style={{ background: '#e8f5e9', border: '0.5px solid #a5d6a7', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', color: '#2e7d32', fontSize: '0.8rem' }}>{success}</div>}

      {/* ── Datos generales ── */}
      <form onSubmit={handleSave} style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '28px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.2rem', margin: '0 0 20px' }}>Datos generales</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Nombre</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
          </div>
          <div>
            <label style={lbl}>Tagline / Lema</label>
            <input type="text" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} style={inp} placeholder="Moda para todos" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Color primario</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} style={{ width: '40px', height: '36px', padding: '2px', border: '0.5px solid #e0dbd4', borderRadius: '2px', cursor: 'pointer' }} />
              <input type="text" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} style={{ ...inp, fontFamily: 'monospace' }} />
            </div>
          </div>
          <div>
            <label style={lbl}>Color secundario</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="color" value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} style={{ width: '40px', height: '36px', padding: '2px', border: '0.5px solid #e0dbd4', borderRadius: '2px', cursor: 'pointer' }} />
              <input type="text" value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} style={{ ...inp, fontFamily: 'monospace' }} />
            </div>
          </div>
          <div>
            <label style={lbl}>Tipografía</label>
            <select value={form.font_family} onChange={e => setForm({ ...form, font_family: e.target.value })} style={inp}>
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginBottom: '16px', padding: '20px', background: form.primary_color, borderRadius: '4px', textAlign: 'center' }}>
          <p style={{ fontFamily: form.font_family, fontSize: '1.5rem', color: form.secondary_color, margin: 0 }}>{form.name}</p>
          <p style={{ fontFamily: form.font_family, fontSize: '0.8rem', color: form.secondary_color, opacity: 0.7, margin: '4px 0 0' }}>{form.tagline}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Título del hero</label>
            <input type="text" value={form.hero_title} onChange={e => setForm({ ...form, hero_title: e.target.value })} style={inp} placeholder="Título grande" />
          </div>
          <div>
            <label style={lbl}>Subtítulo del hero</label>
            <input type="text" value={form.hero_subtitle} onChange={e => setForm({ ...form, hero_subtitle: e.target.value })} style={inp} placeholder="Subtítulo" />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={lbl}>Sobre nosotros</label>
          <textarea value={form.about_text} onChange={e => setForm({ ...form, about_text: e.target.value })} rows={4} style={{ ...inp, resize: 'vertical' }} placeholder="Texto sobre la tienda..." />
        </div>

        <button type="submit" disabled={saving} style={{ padding: '10px 24px', background: saving ? '#ccc' : '#0f0f0f', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.78rem', borderRadius: '2px', letterSpacing: '0.08em' }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {/* ── Logo ── */}
      <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '28px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.2rem', margin: '0 0 20px' }}>Logo</h2>

        {store.logo_url ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '16px', background: '#f0ede8', borderRadius: '4px' }}>
            <img src={store.logo_url} alt="Logo actual" style={{ height: '56px', maxWidth: '180px', objectFit: 'contain', background: '#fff', padding: '8px', borderRadius: '4px', border: '0.5px solid #e0dbd4' }} />
            <div>
              <p style={{ fontSize: '0.8rem', color: '#6b6560', margin: '0 0 8px' }}>Logo actual</p>
              <button onClick={handleDeleteLogo} style={{ border: '0.5px solid #fecaca', background: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.65rem', borderRadius: '2px', color: '#c0392b' }}>
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <p style={{ color: '#6b6560', fontSize: '0.875rem', marginBottom: '16px' }}>Sin logo — se muestra el nombre de la tienda.</p>
        )}

        <form onSubmit={handleUploadLogo} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label style={lbl}>Subir logo (PNG/SVG/JPG)</label>
            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} required style={{ fontSize: '0.8rem', color: '#6b6560', cursor: 'pointer' }} />
          </div>
          <button type="submit" disabled={uploadingLogo || !logoFile} style={{ padding: '9px 16px', background: uploadingLogo ? '#ccc' : '#0f0f0f', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
            {uploadingLogo ? 'Subiendo...' : 'Subir logo'}
          </button>
        </form>
        <p style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '8px' }}>Recomendado: fondo transparente, mínimo 200px de ancho.</p>
      </div>

      {/* ── Carrusel hero ── */}
      <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.2rem', margin: '0 0 6px' }}>Carrusel del hero</h2>
        <p style={{ color: '#6b6560', fontSize: '0.8rem', margin: '0 0 20px' }}>Estas imágenes aparecen como fondo de la página principal de tu tienda.</p>

        {images.length === 0 ? (
          <p style={{ color: '#6b6560', fontSize: '0.875rem', marginBottom: '20px' }}>No hay imágenes. Subí la primera abajo.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {images.map((img, i) => (
              <div key={img.id} style={{ border: '0.5px solid #e0dbd4', borderRadius: '4px', overflow: 'hidden' }}>
                <img src={img.image_url} alt={img.caption || ''} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                {img.caption && <div style={{ padding: '6px 8px', fontSize: '0.7rem', color: '#6b6560' }}>{img.caption}</div>}
                <div style={{ padding: '6px 8px 8px', display: 'flex', gap: '4px' }}>
                  <button onClick={() => moveImage(i, -1)} disabled={i === 0} style={{ flex: 1, border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', padding: '3px', fontSize: '0.7rem', borderRadius: '2px' }}>↑</button>
                  <button onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} style={{ flex: 1, border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', padding: '3px', fontSize: '0.7rem', borderRadius: '2px' }}>↓</button>
                  <button onClick={() => handleDeleteImage(img.id)} style={{ flex: 1, border: '0.5px solid #fecaca', background: 'none', cursor: 'pointer', padding: '3px', fontSize: '0.7rem', borderRadius: '2px', color: '#c0392b' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleUploadImage} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={lbl}>Nueva imagen</label>
            <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])} required style={{ fontSize: '0.8rem', color: '#6b6560', cursor: 'pointer' }} />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={lbl}>Caption (opcional)</label>
            <input type="text" value={imgCaption} onChange={e => setImgCaption(e.target.value)} style={inp} placeholder="Texto de la imagen..." />
          </div>
          <button type="submit" disabled={uploadingImg || !imgFile} style={{ padding: '9px 16px', background: uploadingImg ? '#ccc' : '#0f0f0f', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
            {uploadingImg ? 'Subiendo...' : 'Agregar imagen'}
          </button>
        </form>
      </div>
    </div>
  );
}
