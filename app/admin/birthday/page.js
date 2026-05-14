'use client';
import { useState, useEffect } from 'react';

const inp = { width: '100%', padding: '9px 11px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none', borderRadius: '2px', boxSizing: 'border-box', color: '#0f0f0f' };
const lbl = { display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' };

export default function BirthdayConfigPage() {
  const [config, setConfig]   = useState({ enabled: false, discount_percentage: 10, days_before: 0, days_after: 3 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState('');

  useEffect(() => {
    fetch('/api/admin/birthday-config')
      .then(r => r.json())
      .then(d => setConfig({ enabled: d.enabled || false, discount_percentage: d.discount_percentage || 10, days_before: d.days_before ?? 0, days_after: d.days_after ?? 3 }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/birthday-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setToast('Configuración guardada');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: '3rem', color: '#6b6560', fontFamily: 'var(--font-sans)' }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: 'clamp(2rem,4vw,3rem) clamp(1.2rem,4vw,2.5rem)' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.5rem,4vw,2rem)', margin: '0 0 8px' }}>
        Descuento de cumpleaños 🎂
      </h1>
      <p style={{ color: '#6b6560', fontSize: '0.8rem', margin: '0 0 28px' }}>
        Configurá el descuento automático para usuarios que cumplen años.
      </p>

      {toast && (
        <div style={{ background: toast.startsWith('Error') ? '#fef2f2' : '#e8f5e9', border: `0.5px solid ${toast.startsWith('Error') ? '#fecaca' : '#a5d6a7'}`, color: toast.startsWith('Error') ? '#c0392b' : '#2e7d32', padding: '10px 16px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.8rem' }}>
          {toast}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '24px', marginBottom: '16px' }}>

          {/* Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '16px', background: config.enabled ? '#f0fdf4' : '#fafaf8', borderRadius: '4px', border: `0.5px solid ${config.enabled ? '#bbf7d0' : '#e0dbd4'}` }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f0f0f', marginBottom: '2px' }}>
                {config.enabled ? '✓ Descuento activo' : 'Descuento inactivo'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6b6560' }}>Los usuarios recibirán un cupón automático en su cumpleaños</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
              <div style={{ position: 'relative', width: '44px', height: '24px' }}>
                <input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: '12px', background: config.enabled ? '#0f0f0f' : '#ccc', transition: 'background 0.2s', cursor: 'pointer' }} onClick={() => setConfig({ ...config, enabled: !config.enabled })} />
                <div style={{ position: 'absolute', top: '2px', left: config.enabled ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', pointerEvents: 'none' }} />
              </div>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={lbl}>% de descuento</label>
              <input type="number" min="1" max="100" required value={config.discount_percentage} onChange={e => setConfig({ ...config, discount_percentage: parseInt(e.target.value) })} style={inp} />
            </div>
            <div>
              <label style={lbl}>Días antes</label>
              <input type="number" min="0" max="7" required value={config.days_before} onChange={e => setConfig({ ...config, days_before: parseInt(e.target.value) })} style={inp} />
            </div>
            <div>
              <label style={lbl}>Días después</label>
              <input type="number" min="0" max="7" required value={config.days_after} onChange={e => setConfig({ ...config, days_after: parseInt(e.target.value) })} style={inp} />
            </div>
          </div>

          {/* Preview */}
          <div style={{ background: '#fef9c3', border: '0.5px solid #fde047', borderRadius: '4px', padding: '14px 16px', fontSize: '0.78rem', color: '#78350f', lineHeight: 1.6 }}>
            <strong>Ejemplo:</strong> Los usuarios recibirán un <strong>{config.discount_percentage}% de descuento</strong> desde <strong>{config.days_before} días antes</strong> hasta <strong>{config.days_after} días después</strong> de su cumpleaños.
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <button type="submit" disabled={saving} style={{ padding: '10px 22px', background: saving ? '#ccc' : '#1a0a2e', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.78rem', borderRadius: '2px', fontFamily: 'var(--font-sans)' }}>
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
