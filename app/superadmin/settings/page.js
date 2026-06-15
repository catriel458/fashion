'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const lbl = { display: 'block', marginBottom: '6px', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' };
const inp = { width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };
const section = { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: '24px' };
const h2s = { fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.2rem', margin: '0 0 6px' };

export default function SuperadminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  const [mpEnabled, setMpEnabled]             = useState(false);
  const [hasMpToken, setHasMpToken]           = useState(false);
  const [mpAccessToken, setMpAccessToken]     = useState('');
  const [transferEnabled, setTransferEnabled] = useState(false);
  const [transferCbu, setTransferCbu]         = useState('');
  const [transferAlias, setTransferAlias]     = useState('');
  const [transferBank, setTransferBank]       = useState('');
  const [transferHolder, setTransferHolder]   = useState('');

  useEffect(() => {
    fetch('/api/superadmin/payment-config')
      .then(r => r.json())
      .then(d => {
        if (d.error) return;
        setMpEnabled(d.mp_enabled ?? false);
        setHasMpToken(d.has_mp_token ?? false);
        setTransferEnabled(d.transfer_enabled ?? false);
        setTransferCbu(d.transfer_cbu || '');
        setTransferAlias(d.transfer_alias || '');
        setTransferBank(d.transfer_bank || '');
        setTransferHolder(d.transfer_holder || '');
      })
      .catch(() => toast.error('Error al cargar configuración'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        mp_enabled: mpEnabled,
        transfer_enabled: transferEnabled,
        transfer_cbu: transferCbu.trim(),
        transfer_alias: transferAlias.trim(),
        transfer_bank: transferBank.trim(),
        transfer_holder: transferHolder.trim(),
      };
      if (mpAccessToken.trim()) body.mp_access_token = mpAccessToken.trim();

      const res = await fetch('/api/superadmin/payment-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (mpAccessToken.trim()) setHasMpToken(true);
      setMpAccessToken('');
      toast.success('Configuración guardada');
    } catch (err) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: 'clamp(2rem, 4vw, 3rem)' }}>
        Cargando...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'var(--font-sans)', padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', margin: '0 0 8px' }}>
          Medios de cobro para planes
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', margin: '0 0 32px' }}>
          Estas credenciales se usan cuando las tiendas compran un plan del probador virtual.
        </p>

        {/* Mercado Pago */}
        <div style={section}>
          <h2 style={h2s}>Mercado Pago</h2>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px', marginTop: '14px' }}>
            <input
              type="checkbox"
              checked={mpEnabled}
              onChange={e => setMpEnabled(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Habilitar Mercado Pago</span>
          </label>

          {mpEnabled && (
            <div>
              <label style={lbl}>Access Token</label>
              <input
                type="password"
                value={mpAccessToken}
                onChange={e => setMpAccessToken(e.target.value)}
                style={inp}
                placeholder={hasMpToken ? '••••••••••••••••••••' : 'APP_USR-...'}
              />
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: '8px 0 0', lineHeight: 1.5 }}>
                Solo necesitas el Access Token. Lo encontras en mercadopago.com.ar &gt; Tu negocio &gt; Credenciales
              </p>
            </div>
          )}
        </div>

        {/* Transferencia */}
        <div style={section}>
          <h2 style={h2s}>Transferencia bancaria</h2>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px', marginTop: '14px' }}>
            <input
              type="checkbox"
              checked={transferEnabled}
              onChange={e => setTransferEnabled(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Habilitar transferencia</span>
          </label>

          {transferEnabled && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={lbl}>CBU / CVU</label>
                <input type="text" value={transferCbu} onChange={e => setTransferCbu(e.target.value)} style={inp} placeholder="0000000000000000000000" />
              </div>
              <div>
                <label style={lbl}>Alias</label>
                <input type="text" value={transferAlias} onChange={e => setTransferAlias(e.target.value)} style={inp} placeholder="MI.ALIAS.MP" />
              </div>
              <div>
                <label style={lbl}>Banco</label>
                <input type="text" value={transferBank} onChange={e => setTransferBank(e.target.value)} style={inp} placeholder="Banco Galicia" />
              </div>
              <div>
                <label style={lbl}>Titular</label>
                <input type="text" value={transferHolder} onChange={e => setTransferHolder(e.target.value)} style={inp} placeholder="Juan Perez" />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 28px', borderRadius: '6px', border: 'none',
            background: saving ? 'rgba(255,255,255,0.1)' : '#fff',
            color: saving ? 'rgba(255,255,255,0.5)' : '#0a0a0a',
            fontSize: '0.78rem', letterSpacing: '0.08em', fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  );
}
