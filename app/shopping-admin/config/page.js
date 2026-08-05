'use client';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const cardStyle = { background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '24px', marginBottom: '20px' };
const lbl = { display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' };
const inp = { width: '100%', padding: '9px 11px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none', borderRadius: '2px', boxSizing: 'border-box', color: '#0f0f0f', marginBottom: '4px' };
const descStyle = { margin: '4px 0 16px', color: '#6b6560', fontSize: '0.78rem', lineHeight: 1.4 };
const buttonStyle = {
  background: '#1a0a2e',
  color: '#fff',
  border: 'none',
  padding: '12px 24px',
  cursor: 'pointer',
  borderRadius: '2px',
  fontSize: '0.75rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 600,
};
const FONTS = ['Inter', 'Outfit', 'Playfair Display', 'Lora', 'Montserrat', 'Work Sans'];

function ColorField({ label, value, explanation, onChange }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={lbl}>{label}</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} style={{ width: '40px', height: '40px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', padding: 0, background: 'none' }} />
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...inp, width: '120px', marginBottom: 0 }} placeholder="#ffffff" />
      </div>
      <p style={{ ...descStyle, margin: '4px 0 0' }}>{explanation}</p>
    </div>
  );
}

export default function ShoppingConfigPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', tagline: '', description: '',
    primary_color: '#009aae', secondary_color: '#ffffff', font_family: 'Inter',
    hero_title: '', hero_subtitle: '', active: true, logo_url: null
  });
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carousel images state
  const [images,        setImages]        = useState([]);
  const [imgFile,       setImgFile]       = useState(null);
  const [imgCaption,    setImgCaption]    = useState('');
  const [uploadingImg,  setUploadingImg]  = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchImages();
  }, []);

  async function fetchImages() {
    try {
      const res = await fetch('/api/shopping-admin/config/images');
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function fetchConfig() {
    setLoading(true);
    try {
      const res = await fetch('/api/shopping-admin/config');
      const data = await res.json();
      if (data && !data.onboarding) {
        setForm({
          name: data.name || '',
          tagline: data.tagline || '',
          description: data.description || '',
          primary_color: data.primary_color || '#009aae',
          secondary_color: data.secondary_color || '#ffffff',
          font_family: data.font_family || 'Inter',
          hero_title: data.hero_title || '',
          hero_subtitle: data.hero_subtitle || '',
          active: data.active !== undefined ? data.active : true,
          logo_url: data.logo_url || null,
        });
      }
    } catch {
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    setSaving(true);
    try {
      const res = await fetch('/api/shopping-admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success('¡Configuración guardada correctamente!');
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadImage(e) {
    e.preventDefault();
    if (!imgFile) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('file', imgFile);
      fd.append('caption', imgCaption);
      const res = await fetch('/api/shopping-admin/config/images', {
        method: 'POST',
        body: fd,
      });
      const newImg = await res.json();
      if (!res.ok) throw new Error(newImg.error);
      setImages(prev => [...prev, newImg]);
      setImgFile(null);
      setImgCaption('');
      toast.success('Foto de portada añadida');
    } catch (err) {
      toast.error(err.message || 'Error al subir foto');
    } finally {
      setUploadingImg(false);
    }
  }

  async function handleDeleteImage(imgId) {
    try {
      const res = await fetch(`/api/shopping-admin/config/images/${imgId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImages(prev => prev.filter(x => x.id !== imgId));
      toast.success('Foto eliminada');
    } catch (err) {
      toast.error(err.message || 'Error al eliminar foto');
    }
  }

  async function handleUploadLogo(e) {
    e.preventDefault();
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('logo', logoFile);
      const res = await fetch('/api/shopping-admin/config/logo', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(f => ({ ...f, logo_url: data.logo_url }));
      setLogoFile(null);
      toast.success('Logotipo subido correctamente');
    } catch (err) {
      toast.error(err.message || 'Error al subir logotipo');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleDeleteLogo() {
    try {
      const res = await fetch('/api/shopping-admin/config/logo', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(f => ({ ...f, logo_url: null }));
      toast.success('Logotipo eliminado');
    } catch (err) {
      toast.error(err.message || 'Error al eliminar logotipo');
    }
  }

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center', color: '#6b6560' }}>Cargando configuración...</div>;
  }

  return (
    <div style={{ padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)', maxWidth: '900px' }}>
      <Toaster />
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 4px', letterSpacing: '0.02em' }}>
          Personalizar Shopping
        </h1>
        <p style={{ margin: 0, color: '#6b6560', fontSize: '0.8rem' }}>
          Editá el diseño visual, logotipo y contenido de bienvenida de la portada colectiva.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e0dbd4', marginBottom: '24px', overflowX: 'auto' }}>
        {[
          { step: 1, label: '1. Identidad' },
          { step: 2, label: '2. Colores y Estilo' },
          { step: 3, label: '3. Portada' },
          { step: 4, label: '4. Logotipo' },
        ].map(t => (
          <button
            key={t.step}
            onClick={() => setCurrentStep(t.step)}
            style={{
              padding: '10px 18px', border: 'none', background: 'none',
              cursor: 'pointer', fontSize: '0.75rem', letterSpacing: '0.1em',
              textTransform: 'uppercase', fontWeight: currentStep === t.step ? 600 : 400,
              color: currentStep === t.step ? '#1a0a2e' : '#6b6560',
              borderBottom: currentStep === t.step ? '2px solid #1a0a2e' : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* STEP 1: Identidad */}
      {currentStep === 1 && (
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.25rem', marginBottom: '16px' }}>1. Datos de Identidad</h2>
          
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Nombre de tu Shopping *</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} placeholder="Ej: Galería Florida" />
            <p style={descStyle}>El título destacado de tu shopping. Aparece en el Menú y Pie de página.</p>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Lema / Tagline comercial</label>
            <input type="text" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} style={inp} placeholder="Ej: Moda, calzado y accesorios exclusivos" />
            <p style={descStyle}>Una frase corta de presentación que describe tu shopping colectivo.</p>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Descripción institucional (Sobre nosotros)</label>
            <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inp, resize: 'vertical' }} placeholder="Escribí una breve reseña sobre el centro de marcas..." />
            <p style={descStyle}>Sección informativa para dar a conocer los valores e historia de tu shopping.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <input type="checkbox" id="shop-active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
            <label htmlFor="shop-active" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>Shopping visible al público</label>
          </div>
        </div>
      )}

      {/* STEP 2: Colores */}
      {currentStep === 2 && (
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.25rem', marginBottom: '16px' }}>2. Colores y Estilo</h2>
          
          <ColorField label="Color de Fondo Principal" value={form.primary_color} explanation="Se usará para los botones principales y enlaces destacados de la portada." onChange={v => setForm({ ...form, primary_color: v })} />
          <ColorField label="Color de Contraste" value={form.secondary_color} explanation="Se usará en fondos neutros y barras de menú del shopping." onChange={v => setForm({ ...form, secondary_color: v })} />

          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Estilo de Letra Principal (Tipografía)</label>
            <select value={form.font_family} onChange={e => setForm({ ...form, font_family: e.target.value })} style={inp}>
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <p style={descStyle}>El estilo tipográfico para los títulos del shopping propio.</p>
          </div>
        </div>
      )}

      {/* STEP 3: Hero Banner */}
      {currentStep === 3 && (
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.25rem', marginBottom: '16px' }}>3. Portada de Bienvenida</h2>
          
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Título del Banner de Portada</label>
            <input type="text" value={form.hero_title} onChange={e => setForm({ ...form, hero_title: e.target.value })} style={inp} placeholder="Ej: Explorá las mejores marcas en un solo lugar" />
            <p style={descStyle}>El encabezado gigante que verán tus visitantes al entrar.</p>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Subtítulo del Banner</label>
            <input type="text" value={form.hero_subtitle} onChange={e => setForm({ ...form, hero_subtitle: e.target.value })} style={inp} placeholder="Ej: Moda interactiva con probador virtual inteligente" />
            <p style={descStyle}>Descripción corta del banner de bienvenida.</p>
          </div>

          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '20px', marginTop: '20px' }}>
            <h3 style={{ ...lbl, color: '#1a0a2e', marginBottom: '12px' }}>Fotos de Portada (Carrusel)</h3>
            <p style={descStyle}>Subí una o varias imágenes para mostrar en el banner interactivo de tu shopping.</p>

            {images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                {images.map(img => (
                  <div key={img.id} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', background: '#fafaf8' }}>
                    <img src={img.image_url} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                    <div style={{ padding: '6px', fontSize: '0.68rem', color: '#6b6560' }}>{img.caption || '—'}</div>
                    <div style={{ padding: '6px', borderTop: '1px solid #e2e8f0' }}>
                      <button type="button" onClick={() => handleDeleteImage(img.id)} style={{ width: '100%', border: '1px solid #fee2e2', background: 'none', cursor: 'pointer', padding: '3px', fontSize: '0.65rem', borderRadius: '4px', color: '#dc2626' }}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleUploadImage} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={lbl}>Nueva foto</label>
                <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])} style={{ fontSize: '0.8rem', color: '#6b6560', cursor: 'pointer' }} />
              </div>
              <div style={{ flex: '1 1 180px' }}>
                <label style={lbl}>Texto sobre la foto (Opcional)</label>
                <input type="text" value={imgCaption} onChange={e => setImgCaption(e.target.value)} style={{ ...inp, padding: '7px 10px', fontSize: '0.8rem', marginBottom: 0 }} placeholder="Ej: Nueva Colección" />
              </div>
              <button type="submit" disabled={uploadingImg || !imgFile} style={{ ...buttonStyle, padding: '9px 18px' }}>
                {uploadingImg ? 'Subiendo...' : 'Agregar foto'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STEP 4: Logo */}
      {currentStep === 4 && (
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.25rem', marginBottom: '16px' }}>4. Logotipo del Shopping</h2>
          <p style={descStyle}>Subí la imagen representativa de tu shopping. Se recomienda un archivo PNG con fondo transparente.</p>

          {form.logo_url ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '16px', background: '#fafaf8', borderRadius: '4px', border: '0.5px solid #e0dbd4' }}>
              <img src={form.logo_url} alt="Logo" style={{ height: '60px', maxWidth: '200px', objectFit: 'contain', background: '#fff', padding: '6px', border: '1px solid #cbd5e1' }} />
              <button onClick={handleDeleteLogo} style={{ border: '1px solid #fee2e2', background: 'none', color: '#dc2626', cursor: 'pointer', padding: '6px 12px', fontSize: '0.72rem', borderRadius: '2px', fontWeight: 600 }}>Eliminar logotipo</button>
            </div>
          ) : (
            <p style={{ color: '#6b6560', fontSize: '0.8rem', marginBottom: '20px' }}>Sin logotipo oficial asignado (se mostrará el nombre en texto).</p>
          )}

          <form onSubmit={handleUploadLogo} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} style={{ fontSize: '0.8rem', color: '#6b6560', cursor: 'pointer' }} />
            <button type="submit" disabled={uploadingLogo || !logoFile} style={{ ...buttonStyle, padding: '9px 18px' }}>
              {uploadingLogo ? 'Subiendo...' : 'Subir logotipo'}
            </button>
          </form>
        </div>
      )}

      {/* Save Button */}
      {currentStep !== 4 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button onClick={saveChanges} disabled={saving} style={buttonStyle}>
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      )}
    </div>
  );
}
