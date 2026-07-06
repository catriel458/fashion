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

  // Hot Sale states
  const [hotsaleEnabled, setHotsaleEnabled]                 = useState(false);
  const [hotsaleCouponCode, setHotsaleCouponCode]           = useState('');
  const [hotsaleDiscountPercent, setHotsaleDiscountPercent] = useState(0);
  const [hotsaleCouponText, setHotsaleCouponText]           = useState('');

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
        setHotsaleEnabled(d.hotsale_enabled ?? false);
        setHotsaleCouponCode(d.hotsale_coupon_code || '');
        setHotsaleDiscountPercent(d.hotsale_discount_percent ?? 0);
        setHotsaleCouponText(d.hotsale_coupon_text || '');
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
        hotsale_enabled: hotsaleEnabled,
        hotsale_coupon_code: hotsaleCouponCode.trim(),
        hotsale_discount_percent: parseInt(hotsaleDiscountPercent, 10) || 0,
        hotsale_coupon_text: hotsaleCouponText.trim(),
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
          Configuración Global del Shopping
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', margin: '0 0 32px' }}>
          Gestiona los medios de cobro de planes y las campañas generales del shopping.
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

        {/* Hot Sale */}
        <div style={section}>
          <h2 style={h2s}>Configuración de Hot Sale</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', margin: '0 0 16px' }}>
            Habilita un descuento global y un banner/popup en la página principal para todas las tiendas.
          </p>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px', marginTop: '14px' }}>
            <input
              type="checkbox"
              checked={hotsaleEnabled}
              onChange={e => setHotsaleEnabled(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Activar Campaña Hot Sale</span>
          </label>

          {hotsaleEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={lbl}>Código de Cupón</label>
                  <input
                    type="text"
                    value={hotsaleCouponCode}
                    onChange={e => setHotsaleCouponCode(e.target.value)}
                    style={inp}
                    placeholder="Ej: HOTSALE2026"
                  />
                </div>
                <div>
                  <label style={lbl}>Porcentaje de Descuento (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={hotsaleDiscountPercent}
                    onChange={e => setHotsaleDiscountPercent(parseInt(e.target.value, 10) || 0)}
                    style={inp}
                    placeholder="25"
                  />
                </div>
              </div>
              <div>
                <label style={lbl}>Texto descriptivo del cupón</label>
                <textarea
                  value={hotsaleCouponText}
                  onChange={e => setHotsaleCouponText(e.target.value)}
                  style={{ ...inp, resize: 'vertical' }}
                  rows={3}
                  placeholder="Ej: ¡Disfrutá de un 25% OFF en todas nuestras tiendas con este cupón especial!"
                />
              </div>

              {/* Vista Previa */}
              <div style={{ marginTop: '16px', borderTop: '0.5px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                <label style={lbl}>Vista previa del popup (diseño /store)</label>
                <div style={{
                  background: '#fafaf8',
                  border: '1px solid #e8e4df',
                  borderRadius: '10px',
                  padding: '32px 24px',
                  textAlign: 'center',
                  color: '#1a1a1a',
                  maxWidth: '360px',
                  margin: '12px auto 0',
                  position: 'relative'
                }}>
                  <div style={{ background: '#ff3333', position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '10px 10px 0 0' }} />
                  <div style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '8px' }}>HOT SALE EXCLUSIVO</div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 400, margin: '0 0 4px 0' }}>HOT SALE</h3>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 300, marginBottom: '4px' }}>{hotsaleDiscountPercent || 0}% OFF</div>
                  <div style={{ width: '30px', height: '1px', background: '#e0dbd4', margin: '12px auto' }} />
                  <p style={{ fontSize: '12px', color: '#6b6560', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                    {hotsaleCouponText || 'Texto del cupón...'}
                  </p>
                  <button type="button" style={{ width: '100%', padding: '10px', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', background: '#ff3333', border: 'none', borderRadius: '4px', cursor: 'default' }}>
                    COPIAR CUPÓN: {hotsaleCouponCode || 'CUPÓN'}
                  </button>
                </div>
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
