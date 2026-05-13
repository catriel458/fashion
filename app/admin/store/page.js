'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import StoreHeaderFooterPreview from '@/components/StoreHeaderFooterPreview';

const FONTS = ['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Poppins', 'Raleway', 'Open Sans', 'Lato', 'Nunito', 'Oswald'];
const BUTTON_STYLES = [
  { value: 'sharp',   label: 'Sharp (cuadrado)' },
  { value: 'rounded', label: 'Rounded (redondeado)' },
  { value: 'pill',    label: 'Pill (cápsula)' },
];

const lbl = { display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' };
const inp = { width: '100%', padding: '9px 11px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none', borderRadius: '2px', boxSizing: 'border-box', color: '#0f0f0f' };
const section = { background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '28px', marginBottom: '24px' };
const h2style = { fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.2rem', margin: '0 0 20px' };

const EMPTY_FORM = {
  name: '', tagline: '', primary_color: '#009aae', secondary_color: '#ffffff',
  accent_color: '#0f0f0f', font_family: 'Inter', button_style: 'rounded',
  hero_title: '', hero_subtitle: '', hero_button_text: 'Ver colección',
  hero_season: '', about_text: '',
  social_instagram: '', social_whatsapp: '', social_facebook: '',
  contact_email: '', contact_phone: '',
  header_color: '', footer_color: '',
  panel_bg_color: '', panel_text_color: '',
  header_font: '', header_font_size: '', header_text_color: '',
  footer_font: '', footer_font_size: '', footer_text_color: '',
};

export default function AdminStorePage() {
  const { data: session }      = useSession();
  const isSuperadmin           = session?.user?.role === 'superadmin';

  const [allStores,      setAllStores]      = useState([]);
  const [selectedId,     setSelectedId]     = useState('');
  const [store,          setStore]          = useState(null);
  const [images,         setImages]         = useState([]);
  const [form,           setForm]           = useState(null);
  const [loading,        setLoading]        = useState(!isSuperadmin);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState('');
  const [logoFile,       setLogoFile]       = useState(null);
  const [uploadingLogo,  setUploadingLogo]  = useState(false);
  const [categories,     setCategories]     = useState([]);
  const [newCatName,     setNewCatName]     = useState('');
  const [addingCat,      setAddingCat]      = useState(false);
  const [deleteCatId,    setDeleteCatId]    = useState(null);
  const [uploadingCatId, setUploadingCatId] = useState(null);
  const [imgFile,        setImgFile]        = useState(null);
  const [imgCaption,     setImgCaption]     = useState('');
  const [uploadingImg,   setUploadingImg]   = useState(false);

  // Para superadmin: cargar lista de tiendas
  useEffect(() => {
    if (!isSuperadmin) return;
    fetch('/api/superadmin/stores')
      .then(r => r.json())
      .then(data => setAllStores(Array.isArray(data) ? data : []));
  }, [isSuperadmin]);

  // Cargar datos de la tienda seleccionada
  useEffect(() => {
    if (isSuperadmin && !selectedId) return;
    const url = isSuperadmin ? `/api/superadmin/stores/${selectedId}` : '/api/admin/store';
    setLoading(true);
    setError('');
    setStore(null);
    setForm(null);
    fetch(url, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setStore(data);
        setImages(data.images || []);
        setForm({
          name:             data.name            || '',
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
      .then(() => {
        if (!isSuperadmin) {
          fetch('/api/admin/categories').then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : [])).catch(() => {});
        }
      })
      .catch(() => setError('Error al cargar datos de la tienda'))
      .finally(() => setLoading(false));
  }, [isSuperadmin, selectedId]);

  const apiBase = isSuperadmin ? `/api/superadmin/stores/${selectedId}` : '/api/admin/store';

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const res  = await fetch(apiBase, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStore(data);
      setSuccess('Cambios guardados correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { setError(e.message); }
    finally    { setSaving(false); }
  }

  async function handleUploadLogo(e) {
    e.preventDefault();
    if (!logoFile) return;
    setUploadingLogo(true); setError('');
    try {
      const fd = new FormData();
      fd.append('logo', logoFile);
      const res  = await fetch(`${apiBase}/logo`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStore(prev => ({ ...prev, logo_url: data.logo_url }));
      setLogoFile(null);
      setSuccess('Logo actualizado');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { setError(e.message); }
    finally    { setUploadingLogo(false); }
  }

  async function handleDeleteLogo() {
    try {
      await fetch(`${apiBase}/logo`, { method: 'DELETE' });
      setStore(prev => ({ ...prev, logo_url: null }));
    } catch { setError('Error al eliminar logo'); }
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
      const res  = await fetch(`${apiBase}/images`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImages(prev => [...prev, data]);
      setImgFile(null); setImgCaption('');
    } catch (e) { setError(e.message); }
    finally    { setUploadingImg(false); }
  }

  async function handleDeleteImage(imgId) {
    try {
      await fetch(`${apiBase}/images/${imgId}`, { method: 'DELETE' });
      setImages(prev => prev.filter(i => i.id !== imgId));
    } catch { setError('Error al eliminar imagen'); }
  }

  async function moveImage(index, direction) {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
    await Promise.all(next.map((img, i) =>
      fetch(`${apiBase}/images/${img.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: i, caption: img.caption }),
      })
    ));
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const res  = await fetch('/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCatName.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCatName('');
    } catch (err) { setError(err.message); }
    finally { setAddingCat(false); }
  }

  async function handleDeleteCategory(catId) {
    try {
      await fetch(`/api/admin/categories/${catId}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== catId));
      setDeleteCatId(null);
    } catch { setError('Error al eliminar categoría'); }
  }

  async function handleCategoryImageUpload(catId, file) {
    if (!file) return;
    setUploadingCatId(catId);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res  = await fetch(`/api/admin/categories/${catId}`, { method: 'PUT', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCategories(prev => prev.map(c => c.id === catId ? data : c));
    } catch (err) { setError(err.message); }
    finally { setUploadingCatId(null); }
  }

  const btnRadius = form?.button_style === 'pill' ? '999px' : form?.button_style === 'sharp' ? '0' : '4px';

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 8px', letterSpacing: '0.02em' }}>
        Mi tienda
      </h1>
      <p style={{ color: '#6b6560', fontSize: '0.8rem', margin: '0 0 28px' }}>
        {store ? `Editando: ${store.name}` : 'Editá el contenido y apariencia de tu tienda'}
      </p>

      {/* ── Selector de tienda para superadmin ── */}
      {isSuperadmin && (
        <div style={{ background: '#1a0a2e', borderRadius: '6px', padding: '16px 20px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Superadmin — Tienda:
          </span>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            style={{ ...inp, flex: 1, minWidth: '180px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '0.5px solid rgba(255,255,255,0.2)' }}
          >
            <option value="">Seleccioná una tienda...</option>
            {allStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* ── Estados de carga ── */}
      {isSuperadmin && !selectedId && (
        <div style={{ textAlign: 'center', padding: '64px', color: '#6b6560', fontSize: '0.875rem' }}>
          Seleccioná una tienda del menú de arriba para editarla.
        </div>
      )}

      {loading && (isSuperadmin ? !!selectedId : true) && (
        <div style={{ padding: '3rem', color: '#6b6560', fontFamily: 'var(--font-sans)' }}>Cargando...</div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', color: '#c0392b', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#e8f5e9', border: '0.5px solid #a5d6a7', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', color: '#2e7d32', fontSize: '0.8rem' }}>
          {success}
        </div>
      )}

      {form && !loading && (<>

        {/* ── Datos generales ── */}
        <form onSubmit={handleSave} style={section}>
          <h2 style={h2style}>Datos generales</h2>

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

          {/* Colores */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            {[
              { key: 'primary_color',   label: 'Color primario' },
              { key: 'secondary_color', label: 'Color secundario' },
              { key: 'accent_color',    label: 'Color de botones' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={lbl}>{label}</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="color" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ width: '40px', height: '36px', padding: '2px', border: '0.5px solid #e0dbd4', borderRadius: '2px', cursor: 'pointer' }} />
                  <input type="text" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ ...inp, fontFamily: 'monospace' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Colores header y footer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              { key: 'header_color', label: 'Color del header (navbar)', placeholder: 'Dejar vacío = blanco claro por defecto' },
              { key: 'footer_color', label: 'Color del footer', placeholder: 'Dejar vacío = #fafaf8 por defecto' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={lbl}>{label}</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="color" value={form[key] || '#fafaf8'} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ width: '40px', height: '36px', padding: '2px', border: '0.5px solid #e0dbd4', borderRadius: '2px', cursor: 'pointer' }} />
                  <input type="text" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ ...inp, fontFamily: 'monospace' }} placeholder={placeholder} />
                </div>
              </div>
            ))}
          </div>

          {/* Colores del carrito y vestidor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              { key: 'panel_bg_color',   label: 'Fondo del carrito y vestidor', placeholder: 'Vacío = #fafaf8 (claro)' },
              { key: 'panel_text_color', label: 'Texto del carrito y vestidor',  placeholder: 'Vacío = #0f0f0f (oscuro)' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={lbl}>{label}</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="color" value={form[key] || '#fafaf8'} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ width: '40px', height: '36px', padding: '2px', border: '0.5px solid #e0dbd4', borderRadius: '2px', cursor: 'pointer' }} />
                  <input type="text" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ ...inp, fontFamily: 'monospace' }} placeholder={placeholder} />
                </div>
              </div>
            ))}
          </div>

          {/* Tipografía del header */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ ...lbl, color: '#009aae' }}>Tipografía del Header (navbar)</label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px', paddingLeft: '12px', borderLeft: '2px solid #e0dbd4' }}>
            <div>
              <label style={lbl}>Tipo de letra</label>
              <select value={form.header_font} onChange={e => setForm({ ...form, header_font: e.target.value })} style={inp}>
                <option value="">Igual a la tienda ({form.font_family || 'Inter'})</option>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Tamaño (CSS: 0.7rem, 1rem...)</label>
              <input type="text" value={form.header_font_size} onChange={e => setForm({ ...form, header_font_size: e.target.value })} style={inp} placeholder="Ej: 0.75rem, 14px" />
            </div>
            <div>
              <label style={lbl}>Color del texto</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="color" value={form.header_text_color || '#0f0f0f'} onChange={e => setForm({ ...form, header_text_color: e.target.value })} style={{ width: '40px', height: '36px', padding: '2px', border: '0.5px solid #e0dbd4', borderRadius: '2px', cursor: 'pointer' }} />
                <input type="text" value={form.header_text_color} onChange={e => setForm({ ...form, header_text_color: e.target.value })} style={{ ...inp, fontFamily: 'monospace' }} placeholder="Vacío = color primario" />
              </div>
            </div>
          </div>

          {/* Tipografía del footer */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ ...lbl, color: '#009aae' }}>Tipografía del Footer</label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px', paddingLeft: '12px', borderLeft: '2px solid #e0dbd4' }}>
            <div>
              <label style={lbl}>Tipo de letra</label>
              <select value={form.footer_font} onChange={e => setForm({ ...form, footer_font: e.target.value })} style={inp}>
                <option value="">Serif por defecto</option>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Tamaño (CSS: 1rem, 1.2rem...)</label>
              <input type="text" value={form.footer_font_size} onChange={e => setForm({ ...form, footer_font_size: e.target.value })} style={inp} placeholder="Ej: 1rem, 1.2rem, 16px" />
            </div>
            <div>
              <label style={lbl}>Color del texto</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="color" value={form.footer_text_color || '#1a1a1a'} onChange={e => setForm({ ...form, footer_text_color: e.target.value })} style={{ width: '40px', height: '36px', padding: '2px', border: '0.5px solid #e0dbd4', borderRadius: '2px', cursor: 'pointer' }} />
                <input type="text" value={form.footer_text_color} onChange={e => setForm({ ...form, footer_text_color: e.target.value })} style={{ ...inp, fontFamily: 'monospace' }} placeholder="Vacío = oscuro por defecto" />
              </div>
            </div>
          </div>

          {/* Tipografía y estilo botones */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={lbl}>Tipografía general (hero y productos)</label>
              <select value={form.font_family} onChange={e => setForm({ ...form, font_family: e.target.value })} style={inp}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Estilo de botones</label>
              <select value={form.button_style} onChange={e => setForm({ ...form, button_style: e.target.value })} style={inp}>
                {BUTTON_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div style={{ marginBottom: '16px', padding: '24px', background: form.primary_color, borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <p style={{ fontFamily: form.font_family, fontSize: '1.6rem', color: form.secondary_color, margin: 0, letterSpacing: '0.04em' }}>{form.name || 'Nombre'}</p>
            {form.tagline && <p style={{ fontFamily: form.font_family, fontSize: '0.8rem', color: form.secondary_color, opacity: 0.75, margin: 0 }}>{form.tagline}</p>}
            <button type="button" style={{ padding: '10px 24px', background: form.accent_color, color: '#fff', border: 'none', borderRadius: btnRadius, fontFamily: form.font_family, fontSize: '0.75rem', letterSpacing: '0.1em', cursor: 'default' }}>
              {form.hero_button_text || 'Ver colección'}
            </button>
          </div>

          {/* Hero */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={lbl}>Título del hero</label>
              <input type="text" value={form.hero_title} onChange={e => setForm({ ...form, hero_title: e.target.value })} style={inp} placeholder="Título grande" />
            </div>
            <div>
              <label style={lbl}>Subtítulo del hero</label>
              <input type="text" value={form.hero_subtitle} onChange={e => setForm({ ...form, hero_subtitle: e.target.value })} style={inp} placeholder="Subtítulo" />
            </div>
            <div>
              <label style={lbl}>Texto botón CTA</label>
              <input type="text" value={form.hero_button_text} onChange={e => setForm({ ...form, hero_button_text: e.target.value })} style={inp} placeholder="Ver colección" />
            </div>
            <div>
              <label style={lbl}>Texto de temporada</label>
              <input type="text" value={form.hero_season} onChange={e => setForm({ ...form, hero_season: e.target.value })} style={inp} placeholder="Nueva temporada · 2025" />
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

        {/* ── Vista previa Header / Footer / Paneles ── */}
        <div style={section}>
          <h2 style={h2style}>Vista previa — Header, Footer y Paneles</h2>
          <p style={{ margin: '-12px 0 20px', color: '#6b6560', fontSize: '0.78rem' }}>
            Así se ve en tiempo real con los colores y fuentes configurados arriba.
          </p>
          <StoreHeaderFooterPreview form={form} />
        </div>

        {/* ── Categorías ── */}
        {!isSuperadmin && (
          <div style={section}>
            <h2 style={h2style}>Categorías de la tienda</h2>
            <p style={{ margin: '-12px 0 20px', color: '#6b6560', fontSize: '0.78rem' }}>
              Las imágenes aparecen en el grid editorial de la tienda. Sin imagen se usa el color primario de fondo.
            </p>

            {categories.length === 0 ? (
              <p style={{ color: '#6b6560', fontSize: '0.875rem', marginBottom: '20px' }}>Sin categorías creadas aún.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {categories.map(cat => (
                  <div key={cat.id} style={{ border: '0.5px solid #e0dbd4', borderRadius: '6px', overflow: 'hidden', background: '#fff' }}>
                    <div style={{ height: '120px', background: cat.image_url ? 'transparent' : (form?.primary_color || '#009aae'), position: 'relative', overflow: 'hidden' }}>
                      {cat.image_url && <img src={cat.image_url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                          {cat.name}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <label style={{ display: 'block', width: '100%', textAlign: 'center', padding: '6px 10px', border: '0.5px solid #009aae', color: '#009aae', borderRadius: '3px', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: '6px' }}>
                        {uploadingCatId === cat.id ? 'Subiendo...' : '↑ Subir imagen'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingCatId === cat.id}
                          onChange={e => handleCategoryImageUpload(cat.id, e.target.files[0])} />
                      </label>
                      <button onClick={() => setDeleteCatId(cat.id)}
                        style={{ width: '100%', border: '0.5px solid #fecaca', background: 'none', cursor: 'pointer', padding: '5px', fontSize: '0.62rem', borderRadius: '3px', color: '#c0392b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: '0.5px solid #e0dbd4', paddingTop: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', margin: '0 0 12px' }}>
                + Nueva categoría
              </h3>
              <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} required placeholder="Ej: Vestidos, Accesorios..." style={{ ...inp, flex: 1 }} />
                <button type="submit" disabled={addingCat || !newCatName.trim()}
                  style={{ padding: '9px 16px', background: addingCat ? '#ccc' : '#0f0f0f', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                  {addingCat ? 'Creando...' : 'Crear'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Confirm delete categoría */}
        {deleteCatId && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#fff', padding: '28px', borderRadius: '6px', maxWidth: '340px', width: '100%', border: '0.5px solid #e0dbd4' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, margin: '0 0 10px', fontSize: '1.2rem' }}>¿Eliminar categoría?</h3>
              <p style={{ color: '#6b6560', fontSize: '0.8rem', margin: '0 0 20px', lineHeight: 1.5 }}>Los productos de esta categoría quedarán sin categoría asignada.</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setDeleteCatId(null)} style={{ padding: '8px 16px', border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', fontSize: '0.75rem', borderRadius: '2px' }}>Cancelar</button>
                <button onClick={() => handleDeleteCategory(deleteCatId)} style={{ padding: '8px 16px', background: '#c0392b', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', borderRadius: '2px' }}>Eliminar</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Redes sociales y contacto ── */}
        <form onSubmit={handleSave} style={section}>
          <h2 style={h2style}>Redes sociales y contacto</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={lbl}>Instagram (usuario o URL)</label>
              <input type="text" value={form.social_instagram} onChange={e => setForm({ ...form, social_instagram: e.target.value })} style={inp} placeholder="@mitienda o https://instagram.com/..." />
            </div>
            <div>
              <label style={lbl}>WhatsApp (número con código de país)</label>
              <input type="text" value={form.social_whatsapp} onChange={e => setForm({ ...form, social_whatsapp: e.target.value })} style={inp} placeholder="+54911xxxxxxxx" />
            </div>
            <div>
              <label style={lbl}>Facebook (URL)</label>
              <input type="text" value={form.social_facebook} onChange={e => setForm({ ...form, social_facebook: e.target.value })} style={inp} placeholder="https://facebook.com/mitienda" />
            </div>
            <div>
              <label style={lbl}>Email de contacto</label>
              <input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} style={inp} placeholder="contacto@mitienda.com" />
            </div>
            <div>
              <label style={lbl}>Teléfono de contacto</label>
              <input type="text" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} style={inp} placeholder="+54 11 xxxx-xxxx" />
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ padding: '10px 24px', background: saving ? '#ccc' : '#0f0f0f', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.78rem', borderRadius: '2px', letterSpacing: '0.08em' }}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>

        {/* ── Logo ── */}
        <div style={section}>
          <h2 style={h2style}>Logo</h2>
          {store?.logo_url ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '16px', background: '#f0ede8', borderRadius: '4px' }}>
              <img src={store.logo_url} alt="Logo actual" style={{ height: '56px', maxWidth: '180px', objectFit: 'contain', background: '#fff', padding: '8px', borderRadius: '4px', border: '0.5px solid #e0dbd4' }} />
              <div>
                <p style={{ fontSize: '0.8rem', color: '#6b6560', margin: '0 0 8px' }}>Logo actual</p>
                <button onClick={handleDeleteLogo} style={{ border: '0.5px solid #fecaca', background: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.65rem', borderRadius: '2px', color: '#c0392b' }}>Eliminar</button>
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
        <div style={section}>
          <h2 style={h2style}>Carrusel del hero</h2>
          <p style={{ color: '#6b6560', fontSize: '0.8rem', margin: '-12px 0 20px' }}>Estas imágenes aparecen como fondo de la página principal de la tienda.</p>

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

      </>)}
    </div>
  );
}
