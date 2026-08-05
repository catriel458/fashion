'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

const FONTS = ['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Poppins', 'Raleway', 'Open Sans', 'Lato', 'Nunito', 'Oswald'];
const BUTTON_STYLES = [
  { value: 'sharp',   label: 'Sharp (Cuadrado)' },
  { value: 'rounded', label: 'Rounded (Bordes redondeados)' },
  { value: 'pill',    label: 'Pill (Cápsula redondeada)' },
];

const DAY_NAMES_SA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DEFAULT_HOURS_SA = Array.from({ length: 7 }, (_, i) => ({
  day_of_week: i,
  is_open: i !== 0,
  open_time: '09:00',
  close_time: '18:00',
}));

const EMPTY = {
  name: '', slug: '', tagline: '', about_text: '', active: true, is_independent: false,
  primary_color: '#009aae', secondary_color: '#ffffff', accent_color: '#0f0f0f',
  header_color: '', footer_color: '',
  panel_bg_color: '', panel_text_color: '',
  header_font: '', header_font_size: '', header_text_color: '',
  footer_font: '', footer_font_size: '', footer_text_color: '',
  font_family: 'Inter', button_style: 'rounded',
  hero_title: '', hero_subtitle: '', hero_button_text: 'Ver catálogo', hero_season: '',
  social_instagram: '', social_whatsapp: '', social_facebook: '',
  contact_email: '', contact_phone: '',
};

const lbl = { display: 'block', marginBottom: '4px', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1e293b', fontWeight: 700 };
const inp = { width: '100%', padding: '12px 14px', border: '1px solid #e0dbd4', background: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', outline: 'none', borderRadius: '6px', boxSizing: 'border-box', color: '#0f0f0f', transition: 'border-color 0.2s' };
const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' };
const h2s = { fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.35rem', margin: '0 0 4px', color: '#0f172a' };
const descStyle = { fontSize: '0.75rem', color: '#475569', marginTop: '3px', marginBottom: '12px', lineHeight: '1.4' };

const STEPS = [
  { num: 1, title: 'Identidad', desc: 'Nombre y URL' },
  { num: 2, title: 'Colores', desc: 'Paleta visual' },
  { num: 3, title: 'Fuentes', desc: 'Tipografía de la web' },
  { num: 4, title: 'Portada', desc: 'Mensaje de bienvenida' },
  { num: 5, title: 'Multimedia', desc: 'Logo y carrusel' },
  { num: 6, title: 'Horarios', desc: 'WhatsApp y horas' },
  { num: 7, title: 'Categorías', desc: 'Catálogo' },
];

function ColorField({ label, value, explanation, onChange }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={lbl}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ position: 'relative', width: '48px', height: '42px', borderRadius: '6px', border: '1px solid #cbd5e1', overflow: 'hidden', flexShrink: 0 }}>
          <input type="color" value={value || '#fafaf8'} onChange={e => onChange(e.target.value)} style={{ position: 'absolute', top: '-10px', left: '-10px', width: '68px', height: '62px', border: 'none', cursor: 'pointer', background: 'none' }} />
        </div>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} style={{ ...inp, fontFamily: 'monospace' }} placeholder="#ffffff" />
      </div>
      {explanation && <p style={descStyle}>{explanation}</p>}
    </div>
  );
}

export default function EditStorePage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id;

  const [currentStep,   setCurrentStep]   = useState(1);
  const [form,          setForm]          = useState(EMPTY);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  
  // Categorías y multimedia
  const [categories,    setCategories]    = useState([]);
  const [catInput,      setCatInput]      = useState('');
  const [uploadingCatId, setUploadingCatId] = useState(null);
  
  const [logoFile,      setLogoFile]      = useState(null);
  const [logoPreview,   setLogoPreview]   = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [images,        setImages]        = useState([]);
  const [imgFile,       setImgFile]       = useState(null);
  const [imgCaption,    setImgCaption]    = useState('');
  const [uploadingImg,  setUploadingImg]  = useState(false);

  // Contacto y horarios
  const [waNumber,     setWaNumber]     = useState('');
  const [waAddress,    setWaAddress]    = useState('');
  const [waPickup,     setWaPickup]     = useState('');
  const [storeHours,   setStoreHours]   = useState(DEFAULT_HOURS_SA);

  useEffect(() => {
    if (storeId) loadStoreData();
  }, [storeId]);

  async function loadStoreData() {
    setLoading(true);
    try {
      const [storeRes, imagesRes, catsRes] = await Promise.all([
        fetch(`/api/shopping-admin/stores/${storeId}`),
        fetch(`/api/shopping-admin/stores/${storeId}/images`),
        fetch(`/api/shopping-admin/categories?store_id=${storeId}`),
      ]);

      if (!storeRes.ok) throw new Error('Error al cargar tienda');
      const store = await storeRes.json();
      setForm(store);
      setLogoPreview(store.logo_url);
      setWaNumber(store.whatsapp_number || '');
      setWaAddress(store.address || '');
      setWaPickup(store.pickup_info || '');

      if (store.hours && store.hours.length > 0) {
        setStoreHours(store.hours);
      }

      setImages(await imagesRes.json());
      setCategories(await catsRes.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function set(key) { return e => setForm({ ...form, [key]: e.target.value }); }

  async function saveStepChanges() {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/shopping-admin/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          whatsapp_number: waNumber.trim(),
          address: waAddress.trim(),
          pickup_info: waPickup.trim(),
          hours: storeHours,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Paso guardado correctamente');
    } catch {
      toast.error('Error al guardar datos');
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadLogo(e) {
    e.preventDefault();
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData(); fd.append('logo', logoFile);
      const res = await fetch(`/api/shopping-admin/stores/${storeId}/logo`, { method: 'POST', body: fd });
      const data = await res.json();
      setForm(f => ({ ...f, logo_url: data.logo_url }));
      setLogoFile(null);
      toast.success('Logotipo subido');
    } catch {
      toast.error('Error al subir logotipo');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleDeleteLogo() {
    try {
      await fetch(`/api/shopping-admin/stores/${storeId}/logo`, { method: 'DELETE' });
      setForm(f => ({ ...f, logo_url: null }));
      setLogoPreview(null);
      toast.success('Logotipo eliminado');
    } catch {
      toast.error('Error al eliminar logotipo');
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
      const res = await fetch(`/api/shopping-admin/stores/${storeId}/images`, { method: 'POST', body: fd });
      const newImg = await res.json();
      setImages(prev => [...prev, newImg]);
      setImgFile(null); setImgCaption('');
      toast.success('Foto añadida');
    } catch {
      toast.error('Error al subir foto');
    } finally {
      setUploadingImg(false);
    }
  }

  async function handleDeleteImage(imgId) {
    try {
      await fetch(`/api/shopping-admin/stores/${storeId}/images/${imgId}`, { method: 'DELETE' });
      setImages(prev => prev.filter(x => x.id !== imgId));
      toast.success('Foto eliminada');
    } catch {
      toast.error('Error al eliminar foto');
    }
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    if (!catInput.trim()) return;
    try {
      const res = await fetch(`/api/shopping-admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catInput.trim(), store_id: storeId }),
      });
      const cat = await res.json();
      setCategories(prev => [...prev, cat]);
      setCatInput('');
      toast.success('Categoría creada');
    } catch {
      toast.error('Error al crear categoría');
    }
  }

  async function handleUploadCategoryPhoto(catId, file) {
    if (!file) return;
    setUploadingCatId(catId);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`/api/shopping-admin/stores/${storeId}/categories/${catId}`, { method: 'PUT', body: fd });
      const data = await res.json();
      setCategories(prev => prev.map(c => c.id === catId ? { ...c, image_url: data.image_url } : c));
      toast.success('Foto de categoría subida');
    } catch {
      toast.error('Error al subir foto');
    } finally {
      setUploadingCatId(null);
    }
  }

  async function handleDeleteCategory(catId) {
    try {
      await fetch(`/api/shopping-admin/stores/${storeId}/categories/${catId}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== catId));
      toast.success('Categoría eliminada');
    } catch {
      toast.error('Error al eliminar categoría');
    }
  }

  function nextStep() {
    if (currentStep < 7) {
      setCurrentStep(c => c + 1);
      window.scrollTo(0, 0);
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setCurrentStep(c => c - 1);
      window.scrollTo(0, 0);
    }
  }

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center', color: '#6b6560' }}>Cargando tienda...</div>;
  }

  const radius = form.button_style === 'pill' ? '999px' : form.button_style === 'sharp' ? '0px' : '6px';
  const logoSrc = form.logo_url || logoPreview || null;
  const activeFonts = form ? Array.from(new Set([form.font_family].filter(Boolean))) : [];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {activeFonts.map(f => (
        <link key={f} rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`} />
      ))}
      <Toaster />
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: '1.8rem', margin: 0, letterSpacing: '0.02em', color: '#0f172a' }}>
            Diseño y Configuración de Marca: {form.name}
          </h1>
          <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '0.8rem' }}>
            Ajustá la portada, colores, probador virtual y catálogo de este local comercial.
          </p>
        </div>
        <a href={`/store/${form.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#009aae', textDecoration: 'none', border: '1px solid #009aae', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
          Ver tienda pública →
        </a>
      </div>

      {/* Indicador de pasos */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {STEPS.map(s => (
          <button key={s.num} onClick={() => setCurrentStep(s.num)} style={{
            flex: '1 1 110px', padding: '10px 14px', borderRadius: '8px',
            background: currentStep === s.num ? '#1a0a2e' : '#fff',
            color: currentStep === s.num ? '#fff' : '#475569',
            border: '1px solid #e2e8f0', transition: 'all 0.2s', fontSize: '0.72rem', cursor: 'pointer', textAlign: 'left'
          }}>
            <div style={{ fontWeight: 700, opacity: currentStep === s.num ? 1 : 0.5, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em' }}>Paso {s.num}</div>
            <div style={{ fontWeight: 600, marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{s.title}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
        
        {/* Formulario */}
        <div style={{ minWidth: 0 }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#c0392b', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.8rem', fontWeight: 500 }}>{error}</div>}

          {/* Paso 1: Identidad */}
          {currentStep === 1 && (
            <div style={card}>
              <h2 style={h2s}>1. Datos básicos de identidad</h2>
              <p style={descStyle}>Modificá el nombre y la dirección URL del local comercial.</p>

              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Nombre de tu local/marca *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} placeholder="Ej: Bloom Boutique" />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Dirección web única (enlace/slug) *</label>
                <input type="text" required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} style={inp} placeholder="ej-bloom-boutique" />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Lema o frase corta de tu local</label>
                <input type="text" value={form.tagline || ''} onChange={set('tagline')} style={inp} placeholder="Ej: Vestite con estilo y comodidad" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={lbl}>Tipo de publicación</label>
                  <select value={form.is_independent ? 'independent' : 'shopping'} 
                    onChange={e => setForm({ ...form, is_independent: e.target.value === 'independent' })} 
                    style={inp}>
                    <option value="shopping">Aparecer en el Shopping (Catálogo central)</option>
                    <option value="independent">Tienda Independiente (Página privada y exclusiva)</option>
                  </select>
                </div>

                {form.is_independent ? (
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <label style={lbl}>Dirección web (URL) de tu tienda</label>
                    <span style={{ fontSize: '0.78rem', color: '#009aae', fontWeight: 600, wordBreak: 'break-all', marginTop: '4px' }}>
                      <a href={`/store/${form.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#009aae', textDecoration: 'underline' }}>
                        {typeof window !== 'undefined' ? `${window.location.origin}/store/${form.slug}` : `/store/${form.slug}`}
                      </a>
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <label style={lbl}>Publicación en el Shopping</label>
                    <p style={{ ...descStyle, margin: '0', fontSize: '0.75rem' }}>Esta tienda está configurada como Shopping Virtual.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paso 2: Colores */}
          {currentStep === 2 && (
            <div style={card}>
              <h2 style={h2s}>2. Colores y Estilos Visuales</h2>
              <p style={descStyle}>Elegí la paleta de colores oficial de tu catálogo.</p>

              <ColorField label="Color de Fondo Principal (Primario)" value={form.primary_color} onChange={v => setForm({ ...form, primary_color: v })} />
              <ColorField label="Color de Contraste (Secundario)" value={form.secondary_color} onChange={v => setForm({ ...form, secondary_color: v })} />
              <ColorField label="Color de Botones de Acción" value={form.accent_color} onChange={v => setForm({ ...form, accent_color: v })} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <ColorField label="Fondo del Menú Superior (Header)" value={form.header_color} onChange={v => setForm({ ...form, header_color: v })} />
                <ColorField label="Fondo del Pie de Página (Footer)" value={form.footer_color} onChange={v => setForm({ ...form, footer_color: v })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <ColorField label="Fondo del Vestidor y Carrito" value={form.panel_bg_color} onChange={v => setForm({ ...form, panel_bg_color: v })} />
                <ColorField label="Texto del Vestidor y Carrito" value={form.panel_text_color} onChange={v => setForm({ ...form, panel_text_color: v })} />
              </div>
            </div>
          )}

          {/* Paso 3: Fuentes */}
          {currentStep === 3 && (
            <div style={card}>
              <h2 style={h2s}>3. Tipografías de la Web</h2>
              <p style={descStyle}>Elegí la tipografía general (el estilo de letra) y la forma que tendrán tus botones.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={lbl}>Estilo de Letra Principal (Tipografía)</label>
                  <select value={form.font_family} onChange={e => setForm({ ...form, font_family: e.target.value })} style={inp}>
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Silueta de los Botones</label>
                  <select value={form.button_style} onChange={e => setForm({ ...form, button_style: e.target.value })} style={inp}>
                    {BUTTON_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Paso 4: Portada */}
          {currentStep === 4 && (
            <div style={card}>
              <h2 style={h2s}>4. Portada de la tienda (Banner Principal)</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={lbl}>Título de la Portada</label>
                  <input type="text" value={form.hero_title || ''} onChange={set('hero_title')} style={inp} placeholder="Bienvenidos a mi local" />
                </div>
                <div>
                  <label style={lbl}>Subtítulo o Anuncio Promocional</label>
                  <input type="text" value={form.hero_subtitle || ''} onChange={set('hero_subtitle')} style={inp} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={lbl}>Texto del Botón Principal</label>
                  <input type="text" value={form.hero_button_text || ''} onChange={set('hero_button_text')} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Texto destacado (Etiqueta de temporada)</label>
                  <input type="text" value={form.hero_season || ''} onChange={set('hero_season')} style={inp} />
                </div>
              </div>

              <div>
                <label style={lbl}>Sobre tu marca (Historia o Quiénes Somos)</label>
                <textarea value={form.about_text || ''} onChange={set('about_text')} rows={4} style={{ ...inp, resize: 'vertical' }} />
              </div>
            </div>
          )}

          {/* Paso 5: Multimedia */}
          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={card}>
                <h2 style={h2s}>Logotipo oficial de tu marca</h2>
                {form.logo_url ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <img src={form.logo_url} alt="Logo" style={{ height: '48px', maxWidth: '160px', objectFit: 'contain', background: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                    <button type="button" onClick={handleDeleteLogo} style={{ border: '1px solid #fee2e2', background: 'none', cursor: 'pointer', padding: '5px 10px', fontSize: '0.7rem', borderRadius: '4px', color: '#dc2626', fontWeight: 600 }}>Eliminar logo</button>
                  </div>
                ) : <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '12px' }}>Sin logotipo asignado.</p>}
                
                <form onSubmit={handleUploadLogo} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} style={{ fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }} />
                  <button type="submit" disabled={uploadingLogo || !logoFile} style={{ ...buttonStyle, padding: '8px 14px' }}>{uploadingLogo ? 'Subiendo...' : 'Subir logo'}</button>
                </form>
              </div>

              <div style={card}>
                <h2 style={h2s}>Fotos de Portada (Carrusel de imágenes)</h2>
                {images.length === 0 ? <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '16px' }}>Sin imágenes cargadas.</p> : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    {images.map(img => (
                      <div key={img.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', background: '#fff' }}>
                        <img src={img.image_url} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                        <div style={{ padding: '6px', fontSize: '0.68rem', color: '#475569' }}>{img.caption || '—'}</div>
                        <div style={{ padding: '6px', borderTop: '1px solid #f1f5f9' }}>
                          <button type="button" onClick={() => handleDeleteImage(img.id)} style={{ width: '100%', border: '1px solid #fee2e2', background: 'none', cursor: 'pointer', padding: '3px', fontSize: '0.65rem', borderRadius: '4px', color: '#dc2626' }}>Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleUploadImage} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <label style={lbl}>Nueva imagen</label>
                    <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])} style={{ fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }} />
                  </div>
                  <div style={{ flex: '1 1 180px' }}>
                    <label style={lbl}>Lema o descripción (opcional)</label>
                    <input type="text" value={imgCaption} onChange={e => setImgCaption(e.target.value)} style={{ ...inp, padding: '7px 10px', fontSize: '0.8rem', marginBottom: 0 }} placeholder="Ej: Nueva Temporada" />
                  </div>
                  <button type="submit" disabled={uploadingImg || !imgFile} style={{ ...buttonStyle, padding: '9px 18px' }}>{uploadingImg ? 'Subiendo...' : 'Agregar'}</button>
                </form>
              </div>
            </div>
          )}

          {/* Paso 6: Horarios */}
          {currentStep === 6 && (
            <div style={card}>
              <h2 style={h2s}>6. Canales de Contacto y Horarios</h2>
              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>WhatsApp para recibir pedidos *</label>
                <input type="text" value={waNumber} onChange={e => setWaNumber(e.target.value)} style={inp} placeholder="Ej: 5491133334444" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={lbl}>Dirección de tu Local Físico o Showroom</label>
                  <textarea value={waAddress} onChange={e => setWaAddress(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={lbl}>Indicaciones para el retiro (Pickup)</label>
                  <textarea value={waPickup} onChange={e => setWaPickup(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
                </div>
              </div>

              {/* Redes sociales */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginBottom: '20px' }}>
                <h3 style={{ ...lbl, color: '#009aae', marginBottom: '12px' }}>Redes sociales y Soporte</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                  <div><label style={lbl}>Usuario de Instagram</label><input type="text" value={form.social_instagram || ''} onChange={e => setForm({ ...form, social_instagram: e.target.value })} style={inp} /></div>
                  <div><label style={lbl}>Enlace directo de WhatsApp</label><input type="text" value={form.social_whatsapp || ''} onChange={e => setForm({ ...form, social_whatsapp: e.target.value })} style={inp} /></div>
                  <div><label style={lbl}>Página de Facebook</label><input type="text" value={form.social_facebook || ''} onChange={e => setForm({ ...form, social_facebook: e.target.value })} style={inp} /></div>
                  <div><label style={lbl}>Email de Soporte</label><input type="email" value={form.contact_email || ''} onChange={e => setForm({ ...form, contact_email: e.target.value })} style={inp} /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Teléfono de línea o contacto</label><input type="text" value={form.contact_phone || ''} onChange={e => setForm({ ...form, contact_phone: e.target.value })} style={inp} /></div>
                </div>
              </div>

              {/* Horarios */}
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '20px' }}>
                <label style={lbl}>Días y Horarios de Atención al Público</label>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <tbody>
                    {storeHours.map((h, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', color: '#334155', fontWeight: 500 }}>{DAY_NAMES_SA[h.day_of_week]}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <input type="checkbox" checked={h.is_open} onChange={e => setStoreHours(prev => prev.map((x, j) => j === i ? { ...x, is_open: e.target.checked } : x))} />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input type="time" value={h.open_time} disabled={!h.is_open} onChange={e => setStoreHours(prev => prev.map((x, j) => j === i ? { ...x, open_time: e.target.value } : x))} style={{ ...inp, width: 'auto', padding: '4px 6px', fontSize: '0.75rem', marginBottom: 0, opacity: h.is_open ? 1 : 0.4 }} />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input type="time" value={h.close_time} disabled={!h.is_open} onChange={e => setStoreHours(prev => prev.map((x, j) => j === i ? { ...x, close_time: e.target.value } : x))} style={{ ...inp, width: 'auto', padding: '4px 6px', fontSize: '0.75rem', marginBottom: 0, opacity: h.is_open ? 1 : 0.4 }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Paso 7: Categorías */}
          {currentStep === 7 && (
            <div style={card}>
              <h2 style={h2s}>7. Categorías de Ropa (Secciones del catálogo)</h2>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <input type="text" value={catInput} onChange={e => setCatInput(e.target.value)} style={{ ...inp, marginBottom: 0 }} placeholder="Nueva categoría (ej: Jeans)" />
                <button type="button" onClick={handleCreateCategory} style={{ ...buttonStyle, padding: '10px 18px' }}>Crear categoría</button>
              </div>

              {categories.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Sin categorías creadas aún.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  {categories.map(cat => (
                    <div key={cat.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                      <div style={{ height: '90px', background: cat.image_url ? 'transparent' : (form?.primary_color || '#009aae'), position: 'relative', overflow: 'hidden' }}>
                        {cat.image_url && <img src={cat.image_url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', padding: '0 5px' }}>
                            {cat.name}
                          </span>
                        </div>
                      </div>
                      <div style={{ padding: '8px' }}>
                        <label style={{ display: 'block', width: '100%', textAlign: 'center', padding: '5px', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '4px', fontSize: '0.62rem', cursor: 'pointer', marginBottom: '4px', fontWeight: 600 }}>
                          {uploadingCatId === cat.id ? 'Subiendo...' : 'Foto'}
                          <input type="file" accept="image/*" disabled={uploadingCatId === cat.id} onChange={e => handleUploadCategoryPhoto(cat.id, e.target.files[0])} style={{ display: 'none' }} />
                        </label>
                        <button type="button" onClick={() => handleDeleteCategory(cat.id)} style={{ width: '100%', border: '1px solid #fee2e2', color: '#dc2626', background: '#fff', fontSize: '0.62rem', padding: '4px', cursor: 'pointer', borderRadius: '3px', fontWeight: 600 }}>Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Botones de navegación */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            <button type="button" onClick={prevStep} disabled={currentStep === 1} style={{ ...buttonStyle, background: '#fff', color: '#475569', border: '1px solid #cbd5e1', opacity: currentStep === 1 ? 0.5 : 1 }}>Atrás</button>
            {currentStep < 7 ? (
              <button type="button" onClick={() => { saveStepChanges(); nextStep(); }} disabled={saving} style={buttonStyle}>
                {saving ? 'Guardando...' : 'Guardar y Continuar'}
              </button>
            ) : (
              <button type="button" onClick={() => { saveStepChanges(); router.push('/shopping-admin/stores'); }} disabled={saving} style={{ ...buttonStyle, background: '#8b2635' }}>
                {saving ? 'Guardando...' : 'Finalizar Edición'}
              </button>
            )}
          </div>
        </div>

        {/* Simulador */}
        <aside style={{ position: 'sticky', top: '20px' }}>
          <h3 style={{ ...lbl, marginBottom: '8px' }}>Simulador en tiempo real</h3>
          <div style={{
            border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden',
            background: form.primary_color || '#fafaf8', color: '#000',
            boxShadow: '0 4px 6px rgba(0,0,0,0.02)', minHeight: '480px', display: 'flex', flexDirection: 'column'
          }}>
            {/* Header simulador */}
            <div style={{ background: form.header_color || form.primary_color || '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', alignItems: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: form.font_family }}>
                {logoSrc ? <img src={logoSrc} alt="" style={{ height: '20px', maxWidth: '80px', objectFit: 'contain' }} /> : (form.name || 'MI MARCA')}
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.65rem', fontWeight: 600 }}>
                <span>INICIO</span>
                <span>PRODUCTOS</span>
              </div>
            </div>

            {/* Hero simulador */}
            <div style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', background: '#f1f5f9', position: 'relative' }}>
              {images.length > 0 && <img src={images[0].image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }} />}
              <span style={{ fontSize: '0.55rem', fontWeight: 700, color: form.secondary_color || '#475569', letterSpacing: '0.1em' }}>{form.hero_season || 'NUEVA COLECCIÓN'}</span>
              <h4 style={{ margin: '6px 0 4px', fontSize: '1.2rem', fontFamily: form.font_family, fontWeight: 700, color: form.secondary_color || '#0f172a' }}>{form.hero_title || 'Colección Primavera'}</h4>
              <p style={{ margin: '0 0 12px', fontSize: '0.65rem', color: '#475569' }}>{form.hero_subtitle || '3 cuotas sin interés'}</p>
              <div>
                <button type="button" style={{ background: form.accent_color || '#0f172a', color: '#fff', border: 'none', padding: '6px 12px', fontSize: '0.65rem', borderRadius: radius }}>
                  {form.hero_button_text || 'Comprar'}
                </button>
              </div>
            </div>

            {/* Footer simulador */}
            <div style={{ background: form.footer_color || '#0f172a', color: '#94a3b8', padding: '12px 16px', fontSize: '0.55rem', textAlign: 'center' }}>
              <div>© 2026 {form.name || 'Mi Marca'}.</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

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
