'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DAY_NAMES_SA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DEFAULT_HOURS_SA = Array.from({ length: 7 }, (_, i) => ({
  day_of_week: i,
  is_open: i !== 0,
  open_time: '09:00',
  close_time: '18:00',
}));

const FONTS = ['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Poppins', 'Raleway', 'Open Sans', 'Lato', 'Nunito', 'Oswald'];
const BUTTON_STYLES = [
  { value: 'sharp',   label: 'Sharp (Cuadrado)' },
  { value: 'rounded', label: 'Rounded (Bordes redondeados)' },
  { value: 'pill',    label: 'Pill (Cápsula redondeada)' },
];

const lbl = { display: 'block', marginBottom: '4px', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1e293b', fontWeight: 700 };
const inp = { width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', background: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', outline: 'none', borderRadius: '6px', boxSizing: 'border-box', color: '#0f0f0f' };
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
  { num: 8, title: 'Admin', desc: 'Administrador' },
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

export default function EditStorePage({ params }) {
  const { id } = params;
  const router  = useRouter();

  const [currentStep,   setCurrentStep]   = useState(1);
  const [store,        setStore]        = useState(null);
  const [images,       setImages]       = useState([]);
  const [admin,        setAdmin]        = useState(null);
  const [categories,   setCategories]   = useState([]);
  const [newCatName,   setNewCatName]   = useState('');
  const [addingCat,    setAddingCat]    = useState(false);
  const [deleteCatId,  setDeleteCatId]  = useState(null);
  const [uploadingCatId, setUploadingCatId] = useState(null);
  const [form,         setForm]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [imgFile,      setImgFile]      = useState(null);
  const [imgCaption,   setImgCaption]   = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [logoFile,     setLogoFile]     = useState(null);
  const [logoPreview,  setLogoPreview]  = useState(null);
  const [uploadingLogo,setUploadingLogo]= useState(false);
  const [adminForm,    setAdminForm]    = useState({ username: '', email: '', password: '', store_id: id });
  const [savingAdmin,  setSavingAdmin]  = useState(false);
  const [waNumber,     setWaNumber]     = useState('');
  const [waAddress,    setWaAddress]    = useState('');
  const [waPickup,     setWaPickup]     = useState('');
  const [storeHours,   setStoreHours]   = useState(DEFAULT_HOURS_SA);
  const [savingWa,     setSavingWa]     = useState(false);
  const [previewTab,     setPreviewTab]     = useState('store'); // 'store' o 'cart'

  useEffect(() => {
    fetch(`/api/superadmin/stores/${id}`)
      .then(r => r.json())
      .then(data => {
        setStore(data);
        setImages(data.images || []);
        setAdmin(data.admin || null);
        setWaNumber(data.whatsapp_number || '');
        setWaAddress(data.address || '');
        setWaPickup(data.pickup_info || '');
        if (data.hours?.length === 7) {
          setStoreHours(data.hours.map(h => ({
            day_of_week: h.day_of_week,
            is_open:    h.is_open,
            open_time:  h.open_time ? h.open_time.slice(0, 5) : '09:00',
            close_time: h.close_time ? h.close_time.slice(0, 5) : '18:00',
          })));
        }
        setForm({
          name:             data.name            || '',
          slug:             data.slug            || '',
          tagline:          data.tagline          || '',
          primary_color:    data.primary_color    || '#009aae',
          secondary_color:  data.secondary_color  || '#ffffff',
          accent_color:     data.accent_color     || '#0f0f0f',
          font_family:      data.font_family      || 'Inter',
          button_style:     data.button_style     || 'rounded',
          hero_title:       data.hero_title       || '',
          hero_subtitle:    data.hero_subtitle     || '',
          hero_button_text: data.hero_button_text  || 'Ver colección',
          hero_season:      data.hero_season       || '',
          about_text:       data.about_text        || '',
          social_instagram: data.social_instagram  || '',
          social_whatsapp:  data.social_whatsapp   || '',
          social_facebook:  data.social_facebook   || '',
          contact_email:    data.contact_email      || '',
          contact_phone:    data.contact_phone      || '',
          active:           data.active,
          is_independent:   data.is_independent  ?? false,
          header_color:      data.header_color      || '',
          footer_color:      data.footer_color      || '',
          panel_bg_color:    data.panel_bg_color    || '',
          panel_text_color:  data.panel_text_color  || '',
          header_font:       data.header_font       || '',
          header_font_size:  data.header_font_size  || '',
          header_text_color: data.header_text_color || '',
          footer_font:       data.footer_font       || '',
          footer_font_size:  data.footer_font_size  || '',
          footer_text_color: data.footer_text_color || '',
        });
      })
      .then(() => fetch(`/api/superadmin/stores/${id}/categories`).then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : [])).catch(() => {}))
      .catch(() => setError('Error al cargar tienda'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res  = await fetch(`/api/superadmin/stores/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStore(data);
      setSuccess('Cambios guardados con éxito');
      setTimeout(() => setSuccess(''), 3000);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadImage(e) {
    e.preventDefault();
    if (!imgFile) return;
    setUploadingImg(true); setError('');
    try {
      const fd = new FormData();
      fd.append('image', imgFile); fd.append('caption', imgCaption); fd.append('sort_order', String(images.length));
      const res  = await fetch(`/api/superadmin/stores/${id}/images`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImages(prev => [...prev, data]); setImgFile(null); setImgCaption('');
      setSuccess('Imagen del carrusel subida');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { setError(e.message); }
    finally    { setUploadingImg(false); }
  }

  async function handleDeleteImage(imgId) {
    try {
      await fetch(`/api/superadmin/stores/${id}/images/${imgId}`, { method: 'DELETE' });
      setImages(prev => prev.filter(i => i.id !== imgId));
      setSuccess('Imagen eliminada');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Error al eliminar imagen'); }
  }

  async function moveImage(index, direction) {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
    await Promise.all(next.map((img, i) =>
      fetch(`/api/superadmin/stores/${id}/images/${img.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: i, caption: img.caption }),
      })
    ));
  }

  async function handleUploadLogo(e) {
    e.preventDefault();
    if (!logoFile) return;
    setUploadingLogo(true); setError('');
    try {
      const fd = new FormData(); fd.append('logo', logoFile);
      const res  = await fetch(`/api/superadmin/stores/${id}/logo`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStore(prev => ({ ...prev, logo_url: data.logo_url }));
      setLogoFile(null); setLogoPreview(null);
      setSuccess('Logo subido correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { setError(e.message); }
    finally    { setUploadingLogo(false); }
  }

  async function handleDeleteLogo() {
    try {
      await fetch(`/api/superadmin/stores/${id}/logo`, { method: 'DELETE' });
      setStore(prev => ({ ...prev, logo_url: null }));
      setSuccess('Logo eliminado');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Error al eliminar logo'); }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const res  = await fetch(`/api/superadmin/stores/${id}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCatName.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCatName('');
      setSuccess('Categoría creada');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setAddingCat(false); }
  }

  async function handleDeleteCategory(catId) {
    try {
      await fetch(`/api/superadmin/stores/${id}/categories/${catId}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== catId));
      setDeleteCatId(null);
      setSuccess('Categoría eliminada');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Error al eliminar categoría'); }
  }

  async function handleCategoryImageUpload(catId, file) {
    if (!file) return;
    setUploadingCatId(catId);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res  = await fetch(`/api/superadmin/stores/${id}/categories/${catId}`, { method: 'PUT', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCategories(prev => prev.map(c => c.id === catId ? data : c));
      setSuccess('Imagen de categoría subida');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setUploadingCatId(null); }
  }

  async function handleSaveWa() {
    setSavingWa(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/superadmin/stores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          whatsapp_number:          waNumber.trim(),
          address:                  waAddress.trim(),
          pickup_info:              waPickup.trim(),
          hours:                    storeHours,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Configuración de horarios guardada');
      setTimeout(() => setSuccess(''), 3000);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setSavingWa(false);
    }
  }

  async function handleCreateAdmin(e) {
    e.preventDefault(); setSavingAdmin(true); setError('');
    try {
      const res  = await fetch('/api/superadmin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...adminForm, role: 'admin', store_id: parseInt(id) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdmin(data); setAdminForm({ username: '', email: '', password: '', store_id: id });
      setSuccess('Administrador creado y asignado con éxito');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { setError(e.message); }
    finally    { setSavingAdmin(false); }
  }

  if (loading) return <div style={{ padding: '3rem', color: '#6b6560', fontFamily: 'var(--font-sans)', textAlign: 'center' }}>Cargando...</div>;
  if (!form)   return <div style={{ padding: '3rem', color: '#c0392b', fontFamily: 'var(--font-sans)', textAlign: 'center' }}>{error || 'Tienda no encontrada'}</div>;

  const radius = form.button_style === 'pill' ? '999px' : form.button_style === 'sharp' ? '0px' : '6px';
  const logoSrc = logoPreview || store?.logo_url || null;

  async function handleNext() {
    if (currentStep === 1 || currentStep === 2 || currentStep === 3 || currentStep === 4) {
      const ok = await handleSave();
      if (!ok) return;
    }
    if (currentStep === 6) {
      const ok = await handleSaveWa();
      if (!ok) return;
    }

    if (currentStep < 8) {
      setCurrentStep(c => c + 1);
      window.scrollTo(0, 0);
    }
  }

  function handlePrev() {
    if (currentStep > 1) {
      setCurrentStep(c => c - 1);
      window.scrollTo(0, 0);
    }
  }

  const activeFonts = form ? Array.from(new Set([
    form.font_family,
    form.header_font,
    form.footer_font
  ].filter(Boolean))) : [];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {activeFonts.map(f => (
        <link key={f} rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`} />
      ))}

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/superadmin/stores')} style={{ background: 'none', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '8px 14px', borderRadius: '6px', fontSize: '0.75rem', color: '#475569', fontWeight: 500 }}>
          ← Volver a tiendas
        </button>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: '1.8rem', margin: 0, letterSpacing: '0.02em', color: '#0f172a', flex: 1 }}>
          Editar Tienda: {store.name}
        </h1>
        <Link href={(form ? form.is_independent : store.is_independent) ? `/store/${store.slug}` : '/stores'} target="_blank" style={{ fontSize: '0.75rem', color: '#009aae', textDecoration: 'none', border: '1px solid #009aae', padding: '7px 14px', borderRadius: '6px', fontWeight: 600 }}>
          Ver tienda pública →
        </Link>
      </div>

      {error   && <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '14px 18px', borderRadius: '8px', marginBottom: '24px', color: '#991b1b', fontSize: '0.8rem', fontWeight: 500 }}>⚠️ {error}</div>}
      {success && <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', padding: '14px 18px', borderRadius: '8px', marginBottom: '24px', color: '#2e7d32', fontSize: '0.8rem', fontWeight: 500 }}>✓ {success}</div>}

      {/* Contenedor del Formulario + Preview */}
      <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* COLUMNA IZQUIERDA */}
        <div style={{ flex: '1 1 540px', minWidth: '320px' }}>
          
          {/* Barra de progreso */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', gap: '12px' }}>
              {STEPS.map((s) => {
                const isActive = s.num === currentStep;
                const isCompleted = s.num < currentStep;
                return (
                  <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, minWidth: '60px', cursor: 'pointer' }} onClick={() => setCurrentStep(s.num)}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.78rem', fontWeight: 700,
                      background: isActive ? '#009aae' : isCompleted ? '#e0f2fe' : '#f1f5f9',
                      color: isActive ? '#fff' : isCompleted ? '#0369a1' : '#64748b',
                      transition: 'all 0.2s', marginBottom: '4px'
                    }}>
                      {isCompleted ? '✓' : s.num}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#0f172a' : '#64748b', whiteSpace: 'nowrap' }}>
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Paso 1: Identidad */}
          {currentStep === 1 && (
            <div style={card}>
              <h2 style={h2s}>1. Datos básicos de identidad</h2>
              <p style={descStyle}>Configura los campos de identidad y tipo de acceso para la tienda.</p>

              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Nombre de la tienda *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Dirección URL (Slug) *</label>
                <input type="text" required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} style={inp} />
                <p style={descStyle}>Dirección web única. Ej: /store/zara</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Lema / Tagline</label>
                <input type="text" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} style={inp} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                <div>
                  <label style={lbl}>Tipo de publicación</label>
                  <select value={form.is_independent ? 'independent' : 'shopping'} 
                    onChange={e => setForm({ ...form, is_independent: e.target.value === 'independent' })} 
                    style={inp}>
                    <option value="shopping">Shopping Virtual (Directorio central)</option>
                    <option value="independent">Página Independiente (URL propia sin catálogo general)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input type="checkbox" id="store-active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                  <label htmlFor="store-active" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', cursor: 'pointer', color: '#1e293b', fontWeight: 600 }}>Tienda activa</label>
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Colores */}
          {currentStep === 2 && (
            <div style={card}>
              <h2 style={h2s}>2. Colores y Estilos Visuales</h2>
              <p style={descStyle}>Elige la paleta de colores oficial. El mock de la derecha se refrescará en tiempo real.</p>

              <ColorField label="Color Primario (Fondo)" value={form.primary_color} explanation="Fondo principal del cuerpo de la tienda." onChange={v => setForm({ ...form, primary_color: v })} />
              <ColorField label="Color Secundario" value={form.secondary_color} explanation="Color de contraste para textos del banner." onChange={v => setForm({ ...form, secondary_color: v })} />
              <ColorField label="Color de Botones" value={form.accent_color} explanation="Color para los botones de comprar y probador." onChange={v => setForm({ ...form, accent_color: v })} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <ColorField label="Fondo del Header (Menú)" value={form.header_color} explanation="Color de fondo del menú superior." onChange={v => setForm({ ...form, header_color: v })} />
                <ColorField label="Fondo del Footer" value={form.footer_color} explanation="Color de fondo del pie de página." onChange={v => setForm({ ...form, footer_color: v })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <ColorField label="Fondo del Carrito y Probador" value={form.panel_bg_color} explanation="Fondo del panel lateral desplegable." onChange={v => setForm({ ...form, panel_bg_color: v })} />
                <ColorField label="Texto del Carrito y Probador" value={form.panel_text_color} explanation="Letras del panel lateral." onChange={v => setForm({ ...form, panel_text_color: v })} />
              </div>
            </div>
          )}

          {/* Paso 3: Fuentes */}
          {currentStep === 3 && (
            <div style={card}>
              <h2 style={h2s}>3. Tipografías de la Web</h2>
              <p style={descStyle}>Alinea el estilo de letras y bordes de botones.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={lbl}>Tipografía General</label>
                  <select value={form.font_family} onChange={e => setForm({ ...form, font_family: e.target.value })} style={inp}>
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Estilo de Botones</label>
                  <select value={form.button_style} onChange={e => setForm({ ...form, button_style: e.target.value })} style={inp}>
                    {BUTTON_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <h3 style={{ ...lbl, color: '#009aae', marginBottom: '12px' }}>Ajustes Tipográficos Detallados</h3>
                
                <div style={{ paddingLeft: '12px', borderLeft: '3px solid #cbd5e1', marginBottom: '16px' }}>
                  <p style={{ ...lbl, fontSize: '0.65rem', color: '#475569', marginBottom: '8px' }}>Navbar / Menú superior</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ ...lbl, fontSize: '0.62rem' }}>Familia</label>
                      <select value={form.header_font} onChange={e => setForm({ ...form, header_font: e.target.value })} style={{ ...inp, padding: '8px 10px' }}>
                        <option value="">Igual a la tienda</option>
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...lbl, fontSize: '0.62rem' }}>Tamaño</label>
                      <input type="text" value={form.header_font_size} onChange={e => setForm({ ...form, header_font_size: e.target.value })} style={{ ...inp, padding: '8px 10px' }} placeholder="Ej: 0.75rem" />
                    </div>
                    <div>
                      <label style={{ ...lbl, fontSize: '0.62rem' }}>Color</label>
                      <input type="color" value={form.header_text_color || '#000000'} onChange={e => setForm({ ...form, header_text_color: e.target.value })} style={{ width: '100%', height: '36px', padding: '2px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }} />
                    </div>
                  </div>
                </div>

                <div style={{ paddingLeft: '12px', borderLeft: '3px solid #cbd5e1' }}>
                  <p style={{ ...lbl, fontSize: '0.65rem', color: '#475569', marginBottom: '8px' }}>Footer / Pie de página</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ ...lbl, fontSize: '0.62rem' }}>Familia</label>
                      <select value={form.footer_font} onChange={e => setForm({ ...form, footer_font: e.target.value })} style={{ ...inp, padding: '8px 10px' }}>
                        <option value="">Serif por defecto</option>
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...lbl, fontSize: '0.62rem' }}>Tamaño</label>
                      <input type="text" value={form.footer_font_size} onChange={e => setForm({ ...form, footer_font_size: e.target.value })} style={{ ...inp, padding: '8px 10px' }} placeholder="Ej: 0.9rem" />
                    </div>
                    <div>
                      <label style={{ ...lbl, fontSize: '0.62rem' }}>Color</label>
                      <input type="color" value={form.footer_text_color || '#000000'} onChange={e => setForm({ ...form, footer_text_color: e.target.value })} style={{ width: '100%', height: '36px', padding: '2px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paso 4: Portada */}
          {currentStep === 4 && (
            <div style={card}>
              <h2 style={h2s}>4. Portada de la tienda (Hero)</h2>
              <p style={descStyle}>El banner de bienvenida y sección institucional.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div><label style={lbl}>Texto de temporada</label><input type="text" value={form.hero_season} onChange={e => setForm({ ...form, hero_season: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Título de bienvenida</label><input type="text" value={form.hero_title} onChange={e => setForm({ ...form, hero_title: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Subtítulo descriptivo</label><input type="text" value={form.hero_subtitle} onChange={e => setForm({ ...form, hero_subtitle: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Texto botón principal</label><input type="text" value={form.hero_button_text} onChange={e => setForm({ ...form, hero_button_text: e.target.value })} style={inp} /></div>
              </div>
              <div>
                <label style={lbl}>Sobre nosotros</label>
                <textarea value={form.about_text} onChange={e => setForm({ ...form, about_text: e.target.value })} rows={4} style={{ ...inp, resize: 'vertical' }} />
              </div>
            </div>
          )}

          {/* Paso 5: Multimedia */}
          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Logo */}
              <div style={card}>
                <h2 style={h2s}>Logotipo oficial</h2>
                {store?.logo_url ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <img src={store.logo_url} alt="Logo" style={{ height: '48px', maxWidth: '160px', objectFit: 'contain', background: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                    <button onClick={handleDeleteLogo} style={{ border: '1px solid #fee2e2', background: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: '0.7rem', borderRadius: '4px', color: '#dc2626', fontWeight: 600 }}>Eliminar logo</button>
                  </div>
                ) : <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '12px' }}>Sin logo asignado.</p>}
                <form onSubmit={handleUploadLogo} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input type="file" accept="image/*" onChange={e => {
                    setLogoFile(e.target.files[0]);
                    setLogoPreview(URL.createObjectURL(e.target.files[0]));
                  }} required style={{ fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }} />
                  <button type="submit" disabled={uploadingLogo || !logoFile} style={{ padding: '9px 14px', background: uploadingLogo ? '#cbd5e1' : '#0f172a', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {uploadingLogo ? 'Subiendo...' : 'Subir logo'}
                  </button>
                </form>
              </div>

              {/* Carrusel */}
              <div style={card}>
                <h2 style={h2s}>Imágenes del Carrusel Superior</h2>
                {images.length === 0 ? <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>Sin portadas cargadas.</p> : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    {images.map((img, i) => (
                      <div key={img.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', background: '#fff' }}>
                        <img src={img.image_url} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                        <div style={{ padding: '6px', fontSize: '0.68rem', color: '#475569', minHeight: '24px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.caption || '—'}</div>
                        <div style={{ padding: '0 6px 6px', display: 'flex', gap: '3px' }}>
                          <button onClick={() => moveImage(i, -1)} disabled={i === 0} style={{ flex: 1, border: '1px solid #e2e8f0', background: 'none', cursor: 'pointer', padding: '3px', fontSize: '0.65rem', borderRadius: '4px' }}>↑</button>
                          <button onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} style={{ flex: 1, border: '1px solid #e2e8f0', background: 'none', cursor: 'pointer', padding: '3px', fontSize: '0.65rem', borderRadius: '4px' }}>↓</button>
                          <button onClick={() => handleDeleteImage(img.id)} style={{ flex: 1, border: '1px solid #fee2e2', background: 'none', cursor: 'pointer', padding: '3px', fontSize: '0.65rem', borderRadius: '4px', color: '#dc2626' }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleUploadImage} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])} required style={{ fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }} />
                  </div>
                  <div style={{ flex: '1 1 120px' }}>
                    <input type="text" value={imgCaption} onChange={e => setImgCaption(e.target.value)} style={inp} placeholder="Leyenda..." />
                  </div>
                  <button type="submit" disabled={uploadingImg || !imgFile} style={{ padding: '9px 14px', background: uploadingImg ? '#cbd5e1' : '#0f172a', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {uploadingImg ? 'Subiendo...' : 'Añadir'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Paso 6: Horarios */}
          {currentStep === 6 && (
            <div style={card}>
              <h2 style={h2s}>6. Pedidos y Horarios</h2>
              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>WhatsApp de Pedidos *</label>
                <input type="text" value={waNumber} onChange={e => setWaNumber(e.target.value)} style={inp} placeholder="5491112345678" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div><label style={lbl}>Dirección física</label><textarea value={waAddress} onChange={e => setWaAddress(e.target.value)} rows={2} style={inp} /></div>
                <div><label style={lbl}>Pickup en tienda</label><textarea value={waPickup} onChange={e => setWaPickup(e.target.value)} rows={2} style={inp} /></div>
              </div>

              {/* Horarios */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ ...lbl, marginBottom: '8px' }}>Horarios comerciales</label>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Día', 'Abierto', 'Apertura', 'Cierre'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {storeHours.map((h, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', color: '#334155', fontWeight: 500 }}>{DAY_NAMES_SA[h.day_of_week]}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <input type="checkbox" checked={h.is_open} onChange={e => setStoreHours(prev => prev.map((x, j) => j === i ? { ...x, is_open: e.target.checked } : x))} style={{ cursor: 'pointer' }} />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input type="time" value={h.open_time} disabled={!h.is_open} onChange={e => setStoreHours(prev => prev.map((x, j) => j === i ? { ...x, open_time: e.target.value } : x))} style={{ ...inp, width: 'auto', padding: '4px 6px', fontSize: '0.75rem', opacity: h.is_open ? 1 : 0.4 }} />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input type="time" value={h.close_time} disabled={!h.is_open} onChange={e => setStoreHours(prev => prev.map((x, j) => j === i ? { ...x, close_time: e.target.value } : x))} style={{ ...inp, width: 'auto', padding: '4px 6px', fontSize: '0.75rem', opacity: h.is_open ? 1 : 0.4 }} />
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
              <h2 style={h2s}>Categorías del Catálogo</h2>
              {categories.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>Sin categorías creadas aún.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  {categories.map(cat => (
                    <div key={cat.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                      <div style={{ height: '90px', background: cat.image_url ? 'transparent' : (form?.primary_color || '#009aae'), position: 'relative', overflow: 'hidden' }}>
                        {cat.image_url && <img src={cat.image_url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontFamily: 'var(--font-serif)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            {cat.name}
                          </span>
                        </div>
                      </div>
                      <div style={{ padding: '8px' }}>
                        <label style={{ display: 'block', width: '100%', textAlign: 'center', padding: '5px', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '4px', fontSize: '0.62rem', cursor: 'pointer', marginBottom: '4px', fontWeight: 600 }}>
                          Foto
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => handleCategoryImageUpload(cat.id, e.target.files[0])} />
                        </label>
                        <button onClick={() => setDeleteCatId(cat.id)}
                          style={{ width: '100%', border: '1px solid #fee2e2', background: 'none', cursor: 'pointer', padding: '4px', fontSize: '0.62rem', borderRadius: '4px', color: '#dc2626', fontWeight: 600 }}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} required placeholder="Ej: Vestidos..." style={{ ...inp, flex: 1 }} />
                  <button type="submit" disabled={addingCat || !newCatName.trim()}
                    style={{ padding: '10px 18px', background: addingCat ? '#cbd5e1' : '#0f172a', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '6px', fontSize: '0.78rem', whiteSpace: 'nowrap', fontWeight: 600 }}>
                    {addingCat ? 'Creando...' : 'Crear'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Confirm delete categoría */}
          {deleteCatId && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', maxWidth: '320px', width: '100%', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, margin: '0 0 8px', fontSize: '1.2rem' }}>¿Eliminar categoría?</h3>
                <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '0 0 20px', lineHeight: 1.4 }}>Los productos de esta categoría quedarán sin categoría asignada.</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setDeleteCatId(null)} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', background: 'none', cursor: 'pointer', fontSize: '0.7rem', borderRadius: '6px', color: '#475569' }}>Cancelar</button>
                  <button onClick={() => handleDeleteCategory(deleteCatId)} style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.7rem', borderRadius: '6px' }}>Eliminar</button>
                </div>
              </div>
            </div>
          )}

          {/* Paso 8: Administrador */}
          {currentStep === 8 && (
            <div style={card}>
              <h2 style={h2s}>Administrador de la tienda</h2>
              {admin ? (
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>{admin.username}</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{admin.email}</div>
                </div>
              ) : <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>Sin administrador asignado.</p>}
              
              <h3 style={{ ...lbl, color: '#009aae', marginBottom: '10px' }}>Crear y asignar nuevo administrador</h3>
              <form onSubmit={handleCreateAdmin} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', alignItems: 'flex-end' }}>
                <div><label style={lbl}>Usuario *</label><input type="text" required value={adminForm.username} onChange={e => setAdminForm({ ...adminForm, username: e.target.value })} style={inp} placeholder="username" /></div>
                <div><label style={lbl}>Email *</label><input type="email" required value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} style={inp} placeholder="admin@tienda.com" /></div>
                <div><label style={lbl}>Contraseña *</label><input type="password" required minLength={6} value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} style={inp} placeholder="••••••••" /></div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="submit" disabled={savingAdmin} style={{ padding: '8px 14px', background: savingAdmin ? '#cbd5e1' : '#0f172a', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {savingAdmin ? 'Guardando...' : 'Crear y Asignar Admin'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Botones de navegación del Wizard */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '24px' }}>
            <div>
              {currentStep > 1 && (
                <button type="button" onClick={handlePrev} style={{ padding: '11px 24px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '0.8rem', borderRadius: '6px', color: '#334155', fontWeight: 600 }}>
                  Atrás
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {currentStep < 8 ? (
                <button type="button" onClick={handleNext} style={{ padding: '11px 26px', background: '#009aae', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', borderRadius: '6px', fontWeight: 600 }}>
                  Guardar y Siguiente
                </button>
              ) : (
                <button type="button" onClick={() => router.push('/superadmin/stores')} style={{ padding: '11px 26px', background: '#0f172a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', borderRadius: '6px', fontWeight: 600 }}>
                  Finalizar
                </button>
              )}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: Sticky Interactive Mock Store Preview */}
        <div style={{ flex: '1 1 360px', position: 'sticky', top: '24px', alignSelf: 'flex-start', minWidth: '320px' }}>
          
          <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', background: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
            <button type="button" onClick={() => setPreviewTab('store')} style={{ flex: 1, padding: '8px', border: 'none', background: previewTab === 'store' ? '#fff' : 'none', color: previewTab === 'store' ? '#0f172a' : '#475569', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
              📱 Ver Tienda
            </button>
            <button type="button" onClick={() => setPreviewTab('cart')} style={{ flex: 1, padding: '8px', border: 'none', background: previewTab === 'cart' ? '#fff' : 'none', color: previewTab === 'cart' ? '#0f172a' : '#475569', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
              🛒 Ver Carrito/Vestidor
            </button>
          </div>

          <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', background: '#fff', boxShadow: '0 10px 20px rgba(0,0,0,0.06)' }}>
            
            <div style={{ background: '#e2e8f0', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
              </div>
              <div style={{ background: '#fff', fontSize: '0.65rem', color: '#64748b', padding: '3px 12px', borderRadius: '4px', flex: 1, textAlign: 'center', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                tnb.com/store/{form.slug || 'slug'}
              </div>
            </div>

            <div style={{ height: '480px', overflowY: 'auto', background: form.primary_color, position: 'relative', transition: 'all 0.3s' }}>
              
              {previewTab === 'store' ? (
                <div>
                  {/* Mock Navbar */}
                  <div style={{
                    height: '42px',
                    background: form.header_color || '#fafaf8',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 12px', borderBottom: '1px solid rgba(0,0,0,0.08)',
                    position: 'sticky', top: 0, zIndex: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 400, fontFamily: 'serif', color: form.header_text_color || form.primary_color }}>TnB</span>
                      <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>/</span>
                      {logoSrc ? (
                        <img src={logoSrc} alt="" style={{ height: '18px', maxWidth: '60px', objectFit: 'contain' }} />
                      ) : (
                        <span style={{
                          fontFamily: form.header_font || form.font_family,
                          fontSize: form.header_font_size || '0.62rem',
                          color: form.header_text_color || form.accent_color,
                          fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase'
                        }}>
                          {form.name || 'MARCA'}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.58rem', fontFamily: form.header_font || form.font_family, color: form.header_text_color || '#475569', fontWeight: 500 }}>
                      <span>Catálogo</span>
                      <span style={{ fontWeight: 700 }}>🛒 (0)</span>
                    </div>
                  </div>

                  {/* Mock Hero */}
                  <div style={{
                    padding: '36px 16px',
                    background: 'rgba(0,0,0,0.03)',
                    textAlign: 'center',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    fontFamily: form.font_family
                  }}>
                    {form.hero_season && (
                      <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: form.accent_color, fontWeight: 700, display: 'inline-block', marginBottom: '4px' }}>
                        {form.hero_season}
                      </span>
                    )}
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 300, color: form.secondary_color, margin: '0 0 6px' }}>
                      {form.hero_title || 'Mensaje de Bienvenida'}
                    </h3>
                    <p style={{ fontSize: '0.7rem', color: form.secondary_color, opacity: 0.8, margin: '0 auto 12px', maxWidth: '240px' }}>
                      {form.hero_subtitle || 'Subtítulo o descripción de la portada.'}
                    </p>
                    <button type="button" style={{
                      padding: '8px 16px',
                      background: form.accent_color,
                      color: '#fff',
                      border: 'none',
                      borderRadius: radius,
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      cursor: 'default'
                    }}>
                      {form.hero_button_text || 'Ver colección'}
                    </button>
                  </div>

                  {/* Mock products */}
                  <div style={{ padding: '16px', fontFamily: form.font_family }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { name: 'Remera Algodón', price: '$12.000' },
                        { name: 'Pantalon Cargo', price: '$26.500' }
                      ].map((p, idx) => (
                        <div key={idx} style={{ background: '#fff', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                          <div style={{ height: '80px', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👕</div>
                          <div style={{ padding: '8px' }}>
                            <p style={{ fontSize: '0.68rem', fontWeight: 600, color: '#0f172a', margin: '0 0 2px' }}>{p.name}</p>
                            <p style={{ fontSize: '0.62rem', color: '#475569', margin: '0 0 6px' }}>{p.price}</p>
                            <button type="button" style={{ width: '100%', padding: '4px', background: form.accent_color, color: '#fff', border: 'none', borderRadius: radius, fontSize: '0.55rem', fontWeight: 700 }}>
                              Probarse
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mock Footer */}
                  <div style={{
                    background: form.footer_color || '#1a1a1a',
                    padding: '24px 16px',
                    color: form.footer_text_color || '#fafafa',
                    fontFamily: form.footer_font || form.font_family,
                    borderTop: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <h4 style={{ fontSize: '0.8rem', margin: '0 0 4px', textTransform: 'uppercase' }}>{form.name || 'Nueva Tienda'}</h4>
                    {form.tagline && <p style={{ fontSize: '0.62rem', opacity: 0.7, margin: '0 0 12px' }}>{form.tagline}</p>}
                    <div style={{ fontSize: '0.58rem', opacity: 0.6 }}>
                      <p>📧 {form.contact_email || 'contacto@marca.com'}</p>
                      <p>📞 {form.contact_phone || '+54 11 1234-5678'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mock Cart Panel */
                <div style={{
                  padding: '20px 16px',
                  background: form.panel_bg_color || '#fafaf8',
                  color: form.panel_text_color || '#0f0f0f',
                  height: '100%',
                  boxSizing: 'border-box',
                  fontFamily: form.font_family
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '10px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>PROBADOR VIRTUAL</span>
                    <span>✕</span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', height: '320px' }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: '6px', border: '1px dashed rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, opacity: 0.6, marginBottom: '6px' }}>CARRITO</span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', opacity: 0.5 }}>Vacío</div>
                      <button type="button" style={{ width: '100%', padding: '6px', background: form.accent_color, color: '#fff', border: 'none', borderRadius: radius, fontSize: '0.55rem', fontWeight: 700 }}>Comprar</button>
                    </div>
                    <div style={{ flex: 1.2, background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, opacity: 0.6, alignSelf: 'flex-start' }}>VESTIDOR</span>
                      <div style={{ fontSize: '2.5rem', margin: '12px 0' }}>🧍‍♂️</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
