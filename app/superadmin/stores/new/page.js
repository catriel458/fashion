'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const FONTS = ['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Poppins', 'Raleway', 'Open Sans', 'Lato', 'Nunito', 'Oswald'];
const BUTTON_STYLES = [
  { value: 'sharp',   label: 'Sharp (cuadrado)' },
  { value: 'rounded', label: 'Rounded (redondeado)' },
  { value: 'pill',    label: 'Pill (cápsula)' },
];

const EMPTY = {
  name: '', tagline: '',
  primary_color: '#009aae', secondary_color: '#ffffff', accent_color: '#0f0f0f',
  header_color: '', footer_color: '',
  panel_bg_color: '', panel_text_color: '',
  header_font: '', header_font_size: '', header_text_color: '',
  footer_font: '', footer_font_size: '', footer_text_color: '',
  font_family: 'Inter', button_style: 'rounded',
  hero_title: '', hero_subtitle: '', hero_button_text: 'Ver colección', hero_season: '',
  about_text: '',
  social_instagram: '', social_whatsapp: '', social_facebook: '',
  contact_email: '', contact_phone: '',
};

const labelStyle = { display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' };
const inputStyle = { width: '100%', padding: '9px 11px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none', borderRadius: '2px', boxSizing: 'border-box', color: '#0f0f0f' };
const cardStyle = { background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '24px', marginBottom: '20px' };
const h2Style = { fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.1rem', margin: '0 0 18px' };

function ColorField({ label, value, placeholder, onChange }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input type="color" value={value || '#fafaf8'} onChange={e => onChange(e.target.value)} style={{ width: '40px', height: '36px', padding: '2px', border: '0.5px solid #e0dbd4', borderRadius: '2px', cursor: 'pointer' }} />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder={placeholder || ''} />
      </div>
    </div>
  );
}

export default function NewStorePage() {
  const router = useRouter();
  const [form,        setForm]        = useState(EMPTY);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [categories,  setCategories]  = useState([]);
  const [catInput,    setCatInput]    = useState('');

  function slugPreview(name) {
    return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  }

  function set(key) { return e => setForm({ ...form, [key]: e.target.value }); }

  function addCategory(e) {
    e.preventDefault();
    const name = catInput.trim();
    if (!name || categories.includes(name)) return;
    setCategories(prev => [...prev, name]);
    setCatInput('');
  }

  function removeCategory(name) {
    setCategories(prev => prev.filter(c => c !== name));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res  = await fetch('/api/superadmin/stores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, initial_categories: categories }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/superadmin/stores/${data.id}/edit`);
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

        {/* Identidad */}
        <div style={cardStyle}>
          <h2 style={h2Style}>Identidad</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input type="text" required value={form.name} onChange={set('name')} style={inputStyle} placeholder="Ej: Nike" />
              {form.name && <p style={{ fontSize: '0.7rem', color: '#6b6560', marginTop: '4px' }}>Slug: <strong>{slugPreview(form.name)}</strong></p>}
            </div>
            <div>
              <label style={labelStyle}>Tagline / Lema</label>
              <input type="text" value={form.tagline} onChange={set('tagline')} style={inputStyle} placeholder="Moda para todos" />
            </div>
          </div>
        </div>

        {/* Colores */}
        <div style={cardStyle}>
          <h2 style={h2Style}>Colores</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <ColorField label="Color primario" value={form.primary_color} onChange={v => setForm({ ...form, primary_color: v })} />
            <ColorField label="Color secundario" value={form.secondary_color} onChange={v => setForm({ ...form, secondary_color: v })} />
            <ColorField label="Color de botones" value={form.accent_color} onChange={v => setForm({ ...form, accent_color: v })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <ColorField label="Color del header (navbar)" value={form.header_color} placeholder="Vacío = blanco claro por defecto" onChange={v => setForm({ ...form, header_color: v })} />
            <ColorField label="Color del footer" value={form.footer_color} placeholder="Vacío = #fafaf8 por defecto" onChange={v => setForm({ ...form, footer_color: v })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', marginTop: '8px' }}>
            <ColorField label="Fondo del carrito y vestidor" value={form.panel_bg_color} placeholder="Vacío = #fafaf8 (claro)" onChange={v => setForm({ ...form, panel_bg_color: v })} />
            <ColorField label="Texto del carrito y vestidor" value={form.panel_text_color} placeholder="Vacío = #0f0f0f (oscuro)" onChange={v => setForm({ ...form, panel_text_color: v })} />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ ...labelStyle, color: '#1a0a2e' }}>Tipografía del Header</label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px', paddingLeft: '12px', borderLeft: '2px solid #e0dbd4' }}>
            <div>
              <label style={labelStyle}>Tipo de letra</label>
              <select value={form.header_font} onChange={set('header_font')} style={inputStyle}>
                <option value="">Igual a la tienda</option>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tamaño (ej: 0.75rem)</label>
              <input type="text" value={form.header_font_size} onChange={set('header_font_size')} style={inputStyle} placeholder="0.75rem, 14px..." />
            </div>
            <div>
              <label style={labelStyle}>Color del texto</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="color" value={form.header_text_color || '#0f0f0f'} onChange={e => setForm({ ...form, header_text_color: e.target.value })} style={{ width: '40px', height: '36px', padding: '2px', border: '0.5px solid #e0dbd4', borderRadius: '2px', cursor: 'pointer' }} />
                <input type="text" value={form.header_text_color} onChange={set('header_text_color')} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="Vacío = color primario" />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ ...labelStyle, color: '#1a0a2e' }}>Tipografía del Footer</label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingLeft: '12px', borderLeft: '2px solid #e0dbd4' }}>
            <div>
              <label style={labelStyle}>Tipo de letra</label>
              <select value={form.footer_font} onChange={set('footer_font')} style={inputStyle}>
                <option value="">Serif por defecto</option>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tamaño (ej: 1.2rem)</label>
              <input type="text" value={form.footer_font_size} onChange={set('footer_font_size')} style={inputStyle} placeholder="1rem, 1.2rem, 16px..." />
            </div>
            <div>
              <label style={labelStyle}>Color del texto</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="color" value={form.footer_text_color || '#1a1a1a'} onChange={e => setForm({ ...form, footer_text_color: e.target.value })} style={{ width: '40px', height: '36px', padding: '2px', border: '0.5px solid #e0dbd4', borderRadius: '2px', cursor: 'pointer' }} />
                <input type="text" value={form.footer_text_color} onChange={set('footer_text_color')} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="Vacío = oscuro por defecto" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div style={{ padding: '20px', background: form.primary_color, borderRadius: '4px', textAlign: 'center' }}>
            <p style={{ fontFamily: form.font_family, fontSize: '1.5rem', color: form.secondary_color, margin: 0 }}>
              {form.name || 'Nombre de tienda'}
            </p>
            <p style={{ fontFamily: form.font_family, fontSize: '0.8rem', color: form.secondary_color, opacity: 0.7, margin: '4px 0 12px' }}>
              {form.tagline || 'Tagline aquí'}
            </p>
            <button type="button" style={{ padding: '8px 20px', background: form.accent_color, color: '#fff', border: 'none', borderRadius: btnRadius, fontFamily: form.font_family, fontSize: '0.72rem', letterSpacing: '0.08em', cursor: 'default' }}>
              {form.hero_button_text || 'Ver colección'}
            </button>
          </div>
        </div>

        {/* Tipografía y botones */}
        <div style={cardStyle}>
          <h2 style={h2Style}>Tipografía y botones</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Tipografía</label>
              <select value={form.font_family} onChange={set('font_family')} style={{ ...inputStyle, fontFamily: form.font_family }}>
                {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Estilo de botones</label>
              <select value={form.button_style} onChange={set('button_style')} style={inputStyle}>
                {BUTTON_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div style={cardStyle}>
          <h2 style={h2Style}>Hero (portada)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Título principal</label>
              <input type="text" value={form.hero_title} onChange={set('hero_title')} style={inputStyle} placeholder="Título grande del hero" />
            </div>
            <div>
              <label style={labelStyle}>Subtítulo</label>
              <input type="text" value={form.hero_subtitle} onChange={set('hero_subtitle')} style={inputStyle} placeholder="Subtítulo del hero" />
            </div>
            <div>
              <label style={labelStyle}>Texto del botón CTA</label>
              <input type="text" value={form.hero_button_text} onChange={set('hero_button_text')} style={inputStyle} placeholder="Ver colección" />
            </div>
            <div>
              <label style={labelStyle}>Texto de temporada</label>
              <input type="text" value={form.hero_season} onChange={set('hero_season')} style={inputStyle} placeholder="Nueva temporada · 2025" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Sobre nosotros</label>
            <textarea value={form.about_text} onChange={set('about_text')} rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Texto sobre la tienda..." />
          </div>
        </div>

        {/* Redes y contacto */}
        <div style={cardStyle}>
          <h2 style={h2Style}>Redes sociales y contacto</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Instagram (usuario o URL)</label>
              <input type="text" value={form.social_instagram} onChange={set('social_instagram')} style={inputStyle} placeholder="@mitienda o https://instagram.com/..." />
            </div>
            <div>
              <label style={labelStyle}>WhatsApp (número con código de país)</label>
              <input type="text" value={form.social_whatsapp} onChange={set('social_whatsapp')} style={inputStyle} placeholder="+54911xxxxxxxx" />
            </div>
            <div>
              <label style={labelStyle}>Facebook (URL)</label>
              <input type="text" value={form.social_facebook} onChange={set('social_facebook')} style={inputStyle} placeholder="https://facebook.com/mitienda" />
            </div>
            <div>
              <label style={labelStyle}>Email de contacto</label>
              <input type="email" value={form.contact_email} onChange={set('contact_email')} style={inputStyle} placeholder="contacto@mitienda.com" />
            </div>
            <div>
              <label style={labelStyle}>Teléfono de contacto</label>
              <input type="text" value={form.contact_phone} onChange={set('contact_phone')} style={inputStyle} placeholder="+54 11 xxxx-xxxx" />
            </div>
          </div>
        </div>

        {/* Categorías iniciales */}
        <div style={cardStyle}>
          <h2 style={h2Style}>Categorías iniciales</h2>
          <p style={{ margin: '-10px 0 16px', color: '#6b6560', fontSize: '0.78rem' }}>
            Creá las categorías de la tienda. Las imágenes se agregan después desde el panel de edición.
          </p>

          {/* Chips de categorías */}
          {categories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {categories.map(cat => (
                <span key={cat} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0ede8', border: '0.5px solid #e0dbd4', padding: '5px 12px', borderRadius: '999px', fontSize: '0.78rem', fontFamily: 'var(--font-sans)', color: '#0f0f0f' }}>
                  {cat}
                  <button type="button" onClick={() => removeCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6560', padding: 0, lineHeight: 1, fontSize: '0.85rem' }}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input para agregar */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={catInput}
              onChange={e => setCatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(e); } }}
              placeholder="Ej: Remeras, Pantalones, Zapatillas..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button type="button" onClick={addCategory} disabled={!catInput.trim()}
              style={{ padding: '9px 16px', background: catInput.trim() ? '#1a0a2e' : '#ccc', color: '#fff', border: 'none', cursor: catInput.trim() ? 'pointer' : 'not-allowed', borderRadius: '2px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              + Agregar
            </button>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '0.68rem', color: '#aaa' }}>También podés presionar Enter para agregar.</p>
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
