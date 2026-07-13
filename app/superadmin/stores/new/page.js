'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import StoreHeaderFooterPreview from '@/components/StoreHeaderFooterPreview';

const FONTS = ['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Poppins', 'Raleway', 'Open Sans', 'Lato', 'Nunito', 'Oswald'];
const BUTTON_STYLES = [
  { value: 'sharp',   label: 'Sharp (cuadrado)' },
  { value: 'rounded', label: 'Rounded (redondeado)' },
  { value: 'pill',    label: 'Pill (cápsula)' },
];

const DAY_NAMES_SA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DEFAULT_HOURS_SA = Array.from({ length: 7 }, (_, i) => ({
  day_of_week: i,
  is_open: i !== 0,
  open_time: '09:00',
  close_time: '18:00',
}));

const EMPTY = {
  name: '', slug: '', tagline: '', about_text: '', active: true,
  primary_color: '#009aae', secondary_color: '#ffffff', accent_color: '#0f0f0f',
  header_color: '', footer_color: '',
  panel_bg_color: '', panel_text_color: '',
  header_font: '', header_font_size: '', header_text_color: '',
  footer_font: '', footer_font_size: '', footer_text_color: '',
  font_family: 'Inter', button_style: 'rounded',
  hero_title: '', hero_subtitle: '', hero_button_text: 'Ver colección', hero_season: '',
  social_instagram: '', social_whatsapp: '', social_facebook: '',
  contact_email: '', contact_phone: '',
};

const lbl = { display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' };
const inp = { width: '100%', padding: '9px 11px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none', borderRadius: '2px', boxSizing: 'border-box', color: '#0f0f0f' };
const card = { background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '24px', marginBottom: '20px' };
const h2s = { fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.1rem', margin: '0 0 18px' };

function ColorField({ label, value, placeholder, onChange }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input type="color" value={value || '#fafaf8'} onChange={e => onChange(e.target.value)} style={{ width: '40px', height: '36px', padding: '2px', border: '0.5px solid #e0dbd4', borderRadius: '2px', cursor: 'pointer' }} />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} style={{ ...inp, fontFamily: 'monospace' }} placeholder={placeholder || ''} />
      </div>
    </div>
  );
}

function slugify(name) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

export default function NewStorePage() {
  const router = useRouter();
  const [form,          setForm]          = useState(EMPTY);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [categories,    setCategories]    = useState([]);
  const [catInput,      setCatInput]      = useState('');
  const [logoFile,      setLogoFile]      = useState(null);
  const [logoPreview,   setLogoPreview]   = useState(null);
  const [carouselFiles, setCarouselFiles] = useState([]);
  const [adminMode,     setAdminMode]     = useState('new');
  const [adminForm,     setAdminForm]     = useState({ username: '', email: '', password: '' });
  const [freeAdmins,    setFreeAdmins]    = useState([]);
  const [assignAdminId, setAssignAdminId] = useState('');
  const [slugManual,    setSlugManual]    = useState(false);
  const carouselRef = useRef(null);

  // Nuevos estados para contacto y horarios
  const [waNumber,     setWaNumber]     = useState('');
  const [waAddress,    setWaAddress]    = useState('');
  const [waPickup,     setWaPickup]     = useState('');
  const [storeHours,   setStoreHours]   = useState(DEFAULT_HOURS_SA);

  useEffect(() => {
    fetch('/api/superadmin/users?role=admin&no_store=1')
      .then(r => r.ok ? r.json() : [])
      .then(d => setFreeAdmins(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  function set(key) { return e => setForm({ ...form, [key]: e.target.value }); }

  function handleNameChange(e) {
    const name = e.target.value;
    setForm(prev => ({ ...prev, name, slug: slugManual ? prev.slug : slugify(name) }));
  }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleCarouselChange(e) {
    const files = Array.from(e.target.files);
    setCarouselFiles(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f), caption: '' }))]);
  }

  function handleCarouselCaptionChange(idx, val) {
    setCarouselFiles(prev => prev.map((item, i) => i === idx ? { ...item, caption: val } : item));
  }

  function removeCarouselFile(idx) {
    setCarouselFiles(prev => {
      const target = prev[idx];
      if (target && target.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, i) => i !== idx);
    });
  }

  function addCategory(e) {
    e.preventDefault();
    const name = catInput.trim();
    if (!name || categories.some(c => c.name.toLowerCase() === name.toLowerCase())) return;
    setCategories(prev => [...prev, { tempId: Math.random().toString(36).substr(2, 9), name, imageFile: null, imagePreview: null }]);
    setCatInput('');
  }

  function handleCategoryImageChange(tempId, file) {
    if (!file) return;
    setCategories(prev => prev.map(c => {
      if (c.tempId !== tempId) return c;
      if (c.imagePreview) URL.revokeObjectURL(c.imagePreview);
      return { ...c, imageFile: file, imagePreview: URL.createObjectURL(file) };
    }));
  }

  function removeCategory(tempId) {
    setCategories(prev => {
      const target = prev.find(c => c.tempId === tempId);
      if (target && target.imagePreview) {
        URL.revokeObjectURL(target.imagePreview);
      }
      return prev.filter(c => c.tempId !== tempId);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      // 1. Crear tienda
      const res = await fetch('/api/superadmin/stores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          whatsapp_number: waNumber.trim(),
          address: waAddress.trim(),
          pickup_info: waPickup.trim(),
          hours: storeHours,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const storeId = data.id;

      // 2. Subir logo
      if (logoFile) {
        const fd = new FormData(); fd.append('logo', logoFile);
        await fetch(`/api/superadmin/stores/${storeId}/logo`, { method: 'POST', body: fd });
      }

      // 3. Subir imágenes del carrusel con captions
      for (let i = 0; i < carouselFiles.length; i++) {
        const fd = new FormData();
        fd.append('image', carouselFiles[i].file);
        fd.append('sort_order', String(i));
        fd.append('caption', carouselFiles[i].caption || '');
        await fetch(`/api/superadmin/stores/${storeId}/images`, { method: 'POST', body: fd });
      }

      // 4. Crear categorías e imágenes
      for (const cat of categories) {
        const catRes = await fetch(`/api/superadmin/stores/${storeId}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cat.name }),
        });
        const catData = await catRes.json();
        if (catRes.ok && cat.imageFile) {
          const fd = new FormData();
          fd.append('image', cat.imageFile);
          await fetch(`/api/superadmin/stores/${storeId}/categories/${catData.id}`, {
            method: 'PUT',
            body: fd,
          });
        }
      }

      // 5. Admin
      if (adminMode === 'new' && adminForm.username && adminForm.email && adminForm.password) {
        await fetch('/api/superadmin/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...adminForm, role: 'admin', store_id: storeId }),
        });
      } else if (adminMode === 'assign' && assignAdminId) {
        await fetch(`/api/superadmin/users/${assignAdminId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ store_id: storeId }),
        });
      }

      router.push(`/superadmin/stores/${storeId}/edit`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const btnRadius = form.button_style === 'pill' ? '999px' : form.button_style === 'sharp' ? '0' : '4px';

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 28px', letterSpacing: '0.02em' }}>
        Nueva tienda
      </h1>

      {error && (
        <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', color: '#c0392b', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* 1. Información básica */}
        <div style={card}>
          <h2 style={h2s}>1. Información básica</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={lbl}>Nombre *</label>
              <input type="text" required value={form.name} onChange={handleNameChange} style={inp} placeholder="Ej: Nike" />
            </div>
            <div>
              <label style={lbl}>Slug (URL)</label>
              <input type="text" required value={form.slug}
                onChange={e => { setSlugManual(true); setForm({ ...form, slug: e.target.value }); }}
                style={{ ...inp, fontFamily: 'monospace' }} placeholder="ej: nike" />
              <p style={{ fontSize: '0.65rem', color: '#6b6560', margin: '3px 0 0' }}>
                URL: /store/<strong>{form.slug || 'slug'}</strong>
              </p>
            </div>
            <div>
              <label style={lbl}>Tagline / Lema</label>
              <input type="text" value={form.tagline} onChange={set('tagline')} style={inp} placeholder="Moda para todos" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '22px' }}>
              <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} style={{ cursor: 'pointer', width: '15px', height: '15px' }} />
              <label htmlFor="active" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', cursor: 'pointer' }}>Tienda activa (visible en el home)</label>
            </div>
          </div>
          <div>
            <label style={lbl}>Descripción "Sobre nosotros"</label>
            <textarea value={form.about_text} onChange={set('about_text')} rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Texto sobre la tienda..." />
          </div>
        </div>

        {/* 2. Hero */}
        <div style={card}>
          <h2 style={h2s}>2. Hero Section</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div><label style={lbl}>Título principal</label><input type="text" value={form.hero_title} onChange={set('hero_title')} style={inp} placeholder="Título grande del hero" /></div>
            <div><label style={lbl}>Subtítulo</label><input type="text" value={form.hero_subtitle} onChange={set('hero_subtitle')} style={inp} placeholder="Subtítulo del hero" /></div>
            <div><label style={lbl}>Texto del botón CTA</label><input type="text" value={form.hero_button_text} onChange={set('hero_button_text')} style={inp} placeholder="Ver colección" /></div>
            <div><label style={lbl}>Texto de temporada</label><input type="text" value={form.hero_season} onChange={set('hero_season')} style={inp} placeholder="Nueva temporada · 2025" /></div>
          </div>
          <div>
            <label style={lbl}>Logo de la tienda (PNG/SVG/JPG)</label>
            <input type="file" accept="image/*" onChange={handleLogoChange} style={{ fontSize: '0.8rem', color: '#6b6560', cursor: 'pointer', marginBottom: '8px', display: 'block' }} />
            {logoPreview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={logoPreview} alt="Logo preview" style={{ height: '48px', maxWidth: '160px', objectFit: 'contain', background: '#f0ede8', padding: '8px', borderRadius: '4px', border: '0.5px solid #e0dbd4' }} />
                <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); }} style={{ background: 'none', border: '0.5px solid #fecaca', color: '#c0392b', cursor: 'pointer', padding: '4px 8px', borderRadius: '2px', fontSize: '0.65rem' }}>Quitar</button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Personalización visual */}
        <div style={card}>
          <h2 style={h2s}>3. Personalización visual</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <ColorField label="Color primario" value={form.primary_color} onChange={v => setForm({ ...form, primary_color: v })} />
            <ColorField label="Color secundario" value={form.secondary_color} onChange={v => setForm({ ...form, secondary_color: v })} />
            <ColorField label="Color de botones" value={form.accent_color} onChange={v => setForm({ ...form, accent_color: v })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <ColorField label="Color del header" value={form.header_color} placeholder="Vacío = blanco claro" onChange={v => setForm({ ...form, header_color: v })} />
            <ColorField label="Color del footer" value={form.footer_color} placeholder="Vacío = #fafaf8" onChange={v => setForm({ ...form, footer_color: v })} />
            <ColorField label="Fondo carrito/vestidor" value={form.panel_bg_color} placeholder="Vacío = #fafaf8" onChange={v => setForm({ ...form, panel_bg_color: v })} />
            <ColorField label="Texto carrito/vestidor" value={form.panel_text_color} placeholder="Vacío = #0f0f0f" onChange={v => setForm({ ...form, panel_text_color: v })} />
          </div>

          {/* Tipografía del header */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ ...lbl, color: '#a78bfa' }}>Tipografía del Header (navbar)</label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px', paddingLeft: '12px', borderLeft: '2px solid rgba(167,139,250,0.3)' }}>
            <div>
              <label style={lbl}>Tipo de letra</label>
              <select value={form.header_font} onChange={e => setForm({ ...form, header_font: e.target.value })} style={inp}>
                <option value="">Igual a la tienda ({form.font_family || 'Inter'})</option>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Tamaño (0.7rem, 1rem...)</label>
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
            <label style={{ ...lbl, color: '#a78bfa' }}>Tipografía del Footer</label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px', paddingLeft: '12px', borderLeft: '2px solid rgba(167,139,250,0.3)' }}>
            <div>
              <label style={lbl}>Tipo de letra</label>
              <select value={form.footer_font} onChange={e => setForm({ ...form, footer_font: e.target.value })} style={inp}>
                <option value="">Serif por defecto</option>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Tamaño (1rem, 1.2rem...)</label>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={lbl}>Tipografía principal</label>
              <select value={form.font_family} onChange={set('font_family')} style={{ ...inp, fontFamily: form.font_family }}>
                {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Estilo de botones</label>
              <select value={form.button_style} onChange={set('button_style')} style={inp}>
                {BUTTON_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          {/* Preview */}
          <div style={{ padding: '20px', background: form.primary_color, borderRadius: '4px', textAlign: 'center', marginBottom: '16px' }}>
            <p style={{ fontFamily: form.font_family, fontSize: '1.5rem', color: form.secondary_color, margin: 0 }}>{form.name || 'Nombre de tienda'}</p>
            <p style={{ fontFamily: form.font_family, fontSize: '0.8rem', color: form.secondary_color, opacity: 0.7, margin: '4px 0 12px' }}>{form.tagline || 'Tagline aquí'}</p>
            <button type="button" style={{ padding: '8px 20px', background: form.accent_color, color: '#fff', border: 'none', borderRadius: btnRadius, fontFamily: form.font_family, fontSize: '0.72rem', letterSpacing: '0.08em', cursor: 'default' }}>
              {form.hero_button_text || 'Ver colección'}
            </button>
          </div>
        </div>

        {/* Vista previa Header / Footer / Paneles */}
        <div style={card}>
          <h2 style={h2s}>Vista previa — Header, Footer y Paneles</h2>
          <p style={{ margin: '-12px 0 20px', color: '#6b6560', fontSize: '0.78rem' }}>
            Así se ve en tiempo real con los colores y fuentes configurados arriba.
          </p>
          <StoreHeaderFooterPreview form={form} />
        </div>

        {/* 4. Carrusel de imágenes */}
        <div style={card}>
          <h2 style={h2s}>4. Carrusel de imágenes</h2>
          <p style={{ margin: '-10px 0 16px', color: '#6b6560', fontSize: '0.78rem' }}>
            Imágenes que se mostrarán en el hero/portada de la tienda.
          </p>
          <input
            ref={carouselRef} type="file" accept="image/*" multiple onChange={handleCarouselChange}
            style={{ display: 'none' }}
          />
          <button type="button" onClick={() => carouselRef.current?.click()} style={{ padding: '9px 16px', border: '0.5px solid #a78bfa', color: '#7c3aed', background: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '0.72rem', letterSpacing: '0.1em', marginBottom: '16px' }}>
            + Agregar imágenes
          </button>

          {carouselFiles.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {carouselFiles.map((f, i) => (
                <div key={i} style={{ position: 'relative', border: '0.5px solid #e0dbd4', borderRadius: '4px', overflow: 'hidden', background: '#fff' }}>
                  <img src={f.preview} alt="" style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                  <div style={{ padding: '8px' }}>
                    <label style={{ ...lbl, fontSize: '0.6rem', marginBottom: '4px' }}>Caption (opcional)</label>
                    <input
                      type="text"
                      value={f.caption}
                      onChange={e => handleCarouselCaptionChange(i, e.target.value)}
                      placeholder="Descripción..."
                      style={{ ...inp, padding: '4px 6px', fontSize: '0.75rem' }}
                    />
                  </div>
                  <button type="button" onClick={() => removeCarouselFile(i)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.7rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Contacto y horarios de atención */}
        <div style={card}>
          <h2 style={h2s}>5. Contacto y horarios de atención</h2>
          
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Número de WhatsApp de la tienda</label>
            <input type="text" value={waNumber} onChange={e => setWaNumber(e.target.value)} style={inp} placeholder="5491112345678" />
            <p style={{ fontSize: '0.65rem', color: '#6b6560', margin: '4px 0 0' }}>Sin espacios ni +. Ej: 5491112345678</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={lbl}>Dirección física</label>
              <textarea value={waAddress} onChange={e => setWaAddress(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="Av. Corrientes 1234, CABA" />
            </div>
            <div>
              <label style={lbl}>Info de retiro</label>
              <textarea value={waPickup} onChange={e => setWaPickup(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="Retiro de Lun a Vie. Coordinar por WA." />
            </div>
          </div>

          {/* Horarios */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ ...lbl, marginBottom: '10px' }}>Horarios de atención</label>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f5f3f0' }}>
                  {['Día', 'Abierto', 'Apertura', 'Cierre'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {storeHours.map((h, i) => (
                  <tr key={i} style={{ borderBottom: '0.5px solid #f0ede8' }}>
                    <td style={{ padding: '8px 10px' }}>{DAY_NAMES_SA[h.day_of_week]}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <input type="checkbox" checked={h.is_open} onChange={e => setStoreHours(prev => prev.map((x, j) => j === i ? { ...x, is_open: e.target.checked } : x))} style={{ cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <input type="time" value={h.open_time} disabled={!h.is_open} onChange={e => setStoreHours(prev => prev.map((x, j) => j === i ? { ...x, open_time: e.target.value } : x))} style={{ ...inp, width: 'auto', fontSize: '0.78rem', opacity: h.is_open ? 1 : 0.4 }} />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <input type="time" value={h.close_time} disabled={!h.is_open} onChange={e => setStoreHours(prev => prev.map((x, j) => j === i ? { ...x, close_time: e.target.value } : x))} style={{ ...inp, width: 'auto', fontSize: '0.78rem', opacity: h.is_open ? 1 : 0.4 }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Redes y contacto */}
        <div style={card}>
          <h2 style={h2s}>6. Redes sociales y enlaces</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={lbl}>Instagram</label><input type="text" value={form.social_instagram} onChange={set('social_instagram')} style={inp} placeholder="@mitienda o URL" /></div>
            <div><label style={lbl}>WhatsApp (Enlace social)</label><input type="text" value={form.social_whatsapp} onChange={set('social_whatsapp')} style={inp} placeholder="+54911xxxxxxxx" /></div>
            <div><label style={lbl}>Facebook</label><input type="text" value={form.social_facebook} onChange={set('social_facebook')} style={inp} placeholder="https://facebook.com/..." /></div>
            <div><label style={lbl}>Email público de contacto</label><input type="email" value={form.contact_email} onChange={set('contact_email')} style={inp} placeholder="contacto@tienda.com" /></div>
            <div><label style={lbl}>Teléfono público</label><input type="text" value={form.contact_phone} onChange={set('contact_phone')} style={inp} placeholder="+54 11 xxxx-xxxx" /></div>
          </div>
        </div>

        {/* 7. Categorías iniciales */}
        <div style={card}>
          <h2 style={h2s}>7. Categorías iniciales</h2>
          <p style={{ margin: '-10px 0 16px', color: '#6b6560', fontSize: '0.78rem' }}>
            Agregá las categorías iniciales para la tienda y asignale una imagen de portada si querés.
          </p>

          {categories.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {categories.map(cat => (
                <div key={cat.tempId} style={{ border: '0.5px solid #e0dbd4', borderRadius: '6px', overflow: 'hidden', background: '#fff' }}>
                  {/* Preview imagen */}
                  <div style={{ height: '100px', background: cat.imagePreview ? 'transparent' : (form.primary_color || '#009aae'), position: 'relative', overflow: 'hidden' }}>
                    {cat.imagePreview && (
                      <img src={cat.imagePreview} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', textAlign: 'center' }}>
                      <span style={{ color: '#fff', fontFamily: 'var(--font-serif)', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                        {cat.name}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{ padding: '8px' }}>
                    <label style={{ display: 'block', width: '100%', textAlign: 'center', padding: '6px', border: '0.5px solid #a78bfa', color: '#7c3aed', borderRadius: '3px', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: '6px' }}>
                      {cat.imageFile ? 'Cambiar imagen' : 'Seleccionar imagen'}
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => handleCategoryImageChange(cat.tempId, e.target.files[0])} />
                    </label>
                    <button type="button" onClick={() => removeCategory(cat.tempId)}
                      style={{ width: '100%', border: '0.5px solid #fecaca', background: 'none', cursor: 'pointer', padding: '5px', fontSize: '0.62rem', borderRadius: '3px', color: '#c0392b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" value={catInput} onChange={e => setCatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(e); } }} placeholder="Ej: Remeras, Pantalones..." style={{ ...inp, flex: 1 }} />
            <button type="button" onClick={addCategory} disabled={!catInput.trim()} style={{ padding: '9px 16px', background: catInput.trim() ? '#1a0a2e' : '#ccc', color: '#fff', border: 'none', cursor: catInput.trim() ? 'pointer' : 'not-allowed', borderRadius: '2px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              + Agregar
            </button>
          </div>
        </div>

        {/* 8. Admin de la tienda */}
        <div style={card}>
          <h2 style={h2s}>8. Admin de la tienda</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {['new', 'assign'].map(m => (
              <button key={m} type="button" onClick={() => setAdminMode(m)} style={{ padding: '8px 16px', border: '0.5px solid', borderColor: adminMode === m ? '#1a0a2e' : '#e0dbd4', background: adminMode === m ? '#1a0a2e' : 'none', color: adminMode === m ? '#fff' : '#6b6560', cursor: 'pointer', borderRadius: '2px', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {m === 'new' ? 'Crear nuevo admin' : 'Asignar admin existente'}
              </button>
            ))}
          </div>
          {adminMode === 'new' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={lbl}>Usuario</label><input type="text" value={adminForm.username} onChange={e => setAdminForm({ ...adminForm, username: e.target.value })} style={inp} placeholder="username" /></div>
              <div><label style={lbl}>Email</label><input type="email" value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} style={inp} placeholder="admin@tienda.com" /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Contraseña</label><input type="password" value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} style={{ ...inp, maxWidth: '320px' }} placeholder="••••••••" /></div>
              <p style={{ gridColumn: '1/-1', margin: 0, fontSize: '0.7rem', color: '#6b6560' }}>Opcional: podés asignar un admin después desde el panel de edición.</p>
            </div>
          ) : (
            <div>
              {freeAdmins.length === 0 ? (
                <p style={{ color: '#6b6560', fontSize: '0.8rem' }}>No hay admins disponibles sin tienda asignada.</p>
              ) : (
                <div>
                  <label style={lbl}>Seleccionar admin</label>
                  <select value={assignAdminId} onChange={e => setAssignAdminId(e.target.value)} style={{ ...inp, maxWidth: '320px' }}>
                    <option value="">-- Seleccionar --</option>
                    {freeAdmins.map(a => <option key={a.id} value={a.id}>{a.username} ({a.email})</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => window.history.back()} style={{ padding: '10px 20px', border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', fontSize: '0.78rem', borderRadius: '2px' }}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} style={{ padding: '10px 22px', background: saving ? '#ccc' : '#1a0a2e', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.78rem', borderRadius: '2px' }}>
            {saving ? 'Creando...' : 'Crear tienda'}
          </button>
        </div>
      </form>
    </div>
  );
}
