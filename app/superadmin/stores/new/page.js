'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const FONTS = ['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Poppins', 'Raleway', 'Open Sans', 'Lato', 'Nunito', 'Oswald'];

const EMPTY = {
  name: '', tagline: '', primary_color: '#009aae', secondary_color: '#ffffff',
  font_family: 'Inter', hero_title: '', hero_subtitle: '', about_text: '',
};

const labelStyle = { display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' };
const inputStyle = { width: '100%', padding: '9px 11px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none', borderRadius: '2px', boxSizing: 'border-box', color: '#0f0f0f' };

export default function NewStorePage() {
  const router = useRouter();
  const [form,   setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  function slugPreview(name) {
    return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res  = await fetch('/api/superadmin/stores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 28px', letterSpacing: '0.02em' }}>
        Nueva tienda
      </h1>

      {error && (
        <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', color: '#c0392b', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '28px' }}>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Nombre *</label>
          <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Ej: Nike" />
          {form.name && <p style={{ fontSize: '0.7rem', color: '#6b6560', marginTop: '4px' }}>Slug: <strong>{slugPreview(form.name)}</strong></p>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Tagline / Lema</label>
          <input type="text" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} style={inputStyle} placeholder="Moda para todos" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Color primario</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} style={{ width: '40px', height: '36px', padding: '2px', border: '0.5px solid #e0dbd4', borderRadius: '2px', cursor: 'pointer' }} />
              <input type="text" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Color secundario</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="color" value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} style={{ width: '40px', height: '36px', padding: '2px', border: '0.5px solid #e0dbd4', borderRadius: '2px', cursor: 'pointer' }} />
              <input type="text" value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Tipografía</label>
            <select value={form.font_family} onChange={e => setForm({ ...form, font_family: e.target.value })} style={{ ...inputStyle, fontFamily: form.font_family }}>
              {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Live preview */}
        <div style={{ marginBottom: '20px', padding: '20px', background: form.primary_color, borderRadius: '4px', textAlign: 'center' }}>
          <p style={{ fontFamily: form.font_family, fontSize: '1.5rem', color: form.secondary_color, margin: 0 }}>
            {form.name || 'Nombre de tienda'}
          </p>
          <p style={{ fontFamily: form.font_family, fontSize: '0.8rem', color: form.secondary_color, opacity: 0.7, margin: '4px 0 0' }}>
            {form.tagline || 'Tagline aquí'}
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Hero title</label>
          <input type="text" value={form.hero_title} onChange={e => setForm({ ...form, hero_title: e.target.value })} style={inputStyle} placeholder="Título grande del hero" />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Hero subtitle</label>
          <input type="text" value={form.hero_subtitle} onChange={e => setForm({ ...form, hero_subtitle: e.target.value })} style={inputStyle} placeholder="Subtítulo del hero" />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Sobre nosotros</label>
          <textarea value={form.about_text} onChange={e => setForm({ ...form, about_text: e.target.value })} rows={4} placeholder="Texto sobre la tienda..." style={{ ...inputStyle, resize: 'vertical' }} />
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
