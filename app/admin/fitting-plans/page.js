'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PLANS_LIST as PLANS, PLAN_COLORS } from '@/lib/fitting-plans';

const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function formatDateEs(date) {
  const d = new Date(date);
  return `${d.getDate()} de ${MONTHS_ES[d.getMonth()]} de ${d.getFullYear()}`;
}

function progressColor(pct) {
  if (pct < 60) return '#10b981';
  if (pct <= 85) return '#f59e0b';
  return '#ef4444';
}

function CheckIcon({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function FittingPlansPage() {
  const [config,  setConfig]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [saving, setSaving] = useState(false);

  const [storeId, setStoreId] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState({ mp_enabled: false, transfer_enabled: false });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalView, setModalView] = useState('select');
  const [transferData, setTransferData] = useState(null);
  const [mpData, setMpData] = useState(null);
  const [uploadingComprobante, setUploadingComprobante] = useState(false);
  const [comprobanteSent, setComprobanteSent] = useState(false);

  useEffect(() => {
    fetch('/api/admin/fitting-config')
      .then(r => r.json())
      .then(d => {
        if (d.error) return;
        setConfig(d);
        setDailyLimit(d.daily_limit_per_user);
        setStoreId(d.store_id);
      })
      .finally(() => setLoading(false));

    fetch('/api/superadmin/payment-config')
      .then(r => r.json())
      .then(d => {
        if (d.error) return;
        setPaymentConfig({ mp_enabled: d.mp_enabled ?? false, transfer_enabled: d.transfer_enabled ?? false });
      })
      .catch(() => {});
  }, []);

  function closePaymentModal() {
    setSelectedPlan(null);
    setModalView('select');
    setTransferData(null);
    setMpData(null);
  }

  function reloadConfig() {
    fetch('/api/admin/fitting-config')
      .then(r => r.json())
      .then(d => {
        if (d.error) return;
        setConfig(d);
        setDailyLimit(d.daily_limit_per_user);
      });
  }

  async function handleChooseTransfer() {
    try {
      const res = await fetch('/api/plan-checkout/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey: selectedPlan.id, storeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTransferData(data);
      setModalView('transfer');
    } catch (e) {
      toast.error(e.message || 'Error al iniciar el pago');
    }
  }

  async function handleChooseMp() {
    try {
      const res = await fetch('/api/plan-checkout/mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey: selectedPlan.id, storeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMpData(data);
      setModalView('mp');
    } catch (e) {
      toast.error(e.message || 'Error al iniciar el pago');
    }
  }

  async function handleUploadComprobante(e) {
    const file = e.target.files?.[0];
    if (!file || !transferData) return;
    setUploadingComprobante(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('payment_id', transferData.payment_id);
      const res = await fetch('/api/plan-checkout/upload-comprobante', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Comprobante enviado. Activaremos tu plan en breve.');
      setComprobanteSent(true);
      closePaymentModal();
    } catch (err) {
      toast.error(err.message || 'Error al subir el comprobante');
    } finally {
      setUploadingComprobante(false);
    }
  }

  async function handleVerifyMpPayment() {
    if (!mpData) return;
    try {
      const res = await fetch(`/api/plan-checkout/status?payment_id=${mpData.payment_id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.payment_status === 'paid') {
        toast.success('Pago confirmado. Tu plan fue activado.');
        closePaymentModal();
        reloadConfig();
      } else if (data.payment_status === 'failed') {
        toast.error('El pago no fue aprobado. Intenta nuevamente.');
      } else {
        toast('Aun no recibimos confirmación. Puede tardar unos minutos.');
      }
    } catch (e) {
      toast.error(e.message || 'Error al verificar el pago');
    }
  }

  function copyToClipboard(value) {
    navigator.clipboard.writeText(value);
    toast.success('Copiado');
  }

  async function handleSaveDailyLimit() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/fitting-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_limit_per_user: Number(dailyLimit) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConfig(prev => ({ ...prev, daily_limit_per_user: data.daily_limit_per_user }));
      toast.success('Guardado correctamente');
    } catch (e) {
      toast.error(e.message || 'Error al guardar');
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

  const pct = config ? Math.min(100, Math.round((config.used_this_month / config.monthly_limit) * 100)) : 0;
  const remaining = config ? Math.max(0, config.monthly_limit - config.used_this_month) : 0;
  const renewalDate = config ? formatDateEs(new Date(config.reset_at).getTime() + 30 * 24 * 60 * 60 * 1000) : '';
  const accent = PLAN_COLORS[config?.plan] || PLAN_COLORS.starter;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'var(--font-sans)', padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', margin: '0 0 8px' }}>
          Probador virtual — Plan
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', margin: '0 0 32px' }}>
          Gestioná el plan de tu tienda y los límites de uso del probador con IA.
        </p>

        {/* Seccion A - Estado del plan */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: 'clamp(1.5rem, 3vw, 2.2rem)',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '6px 16px', borderRadius: '999px',
              background: `${accent}22`, border: `1px solid ${accent}55`,
              color: accent, fontSize: '0.95rem', fontWeight: 600,
              textTransform: 'capitalize', letterSpacing: '0.02em',
            }}>
              {config?.plan || 'starter'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
              Renueva el {renewalDate}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) auto', gap: '24px', alignItems: 'end', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                <span>Probadas usadas este mes</span>
                <span>{config?.used_this_month} / {config?.monthly_limit}</span>
              </div>
              <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: progressColor(pct),
                  borderRadius: '999px',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, lineHeight: 1 }}>
                {remaining}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px' }}>
                probadas restantes
              </div>
            </div>
          </div>

          <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: '20px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                Límite diario por usuario
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={dailyLimit}
                onChange={e => setDailyLimit(e.target.value)}
                style={{
                  width: '120px', padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px', color: '#fff', fontSize: '0.9rem', outline: 'none',
                }}
              />
            </div>
            <button
              onClick={handleSaveDailyLimit}
              disabled={saving}
              style={{
                padding: '11px 24px', borderRadius: '6px', border: 'none',
                background: saving ? 'rgba(255,255,255,0.1)' : '#fff',
                color: saving ? 'rgba(255,255,255,0.5)' : '#0a0a0a',
                fontSize: '0.78rem', letterSpacing: '0.08em', fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* Seccion B - Cards de planes */}
        <div className="fitting-plans-grid">
          {PLANS.map(plan => {
            const isActive = plan.id === config?.plan;
            return (
              <div
                key={plan.id}
                className={plan.badge === 'MAS POPULAR' ? 'fitting-plan-card fitting-plan-popular' : 'fitting-plan-card'}
                style={{
                  position: 'relative',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? plan.accent : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '14px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: isActive ? `0 0 0 1px ${plan.accent}55` : 'none',
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: '-12px', left: '20px',
                    background: plan.id === 'growth' ? 'linear-gradient(90deg, #7c3aed, #2563eb)' : plan.accent,
                    color: '#fff', fontSize: '0.6rem', fontWeight: 700,
                    letterSpacing: '0.12em', padding: '4px 12px', borderRadius: '999px',
                    textTransform: 'uppercase',
                  }}>
                    {plan.badge}
                  </div>
                )}

                <div style={{ marginTop: plan.badge ? '14px' : 0, marginBottom: '6px', fontSize: '1.1rem', fontWeight: 600 }}>
                  {plan.name}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 700 }}>${plan.price_usd}</span>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>USD/mes</span>
                </div>

                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 18px', lineHeight: 1.5 }}>
                  {plan.description}
                </p>

                <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.08)', margin: '0 0 18px' }} />

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
                      <CheckIcon color={plan.accent} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {isActive ? (
                  <button
                    disabled
                    style={{
                      width: '100%', padding: '12px', borderRadius: '6px',
                      border: `1px solid ${plan.accent}`, background: `${plan.accent}1a`,
                      color: plan.accent, fontSize: '0.78rem', fontWeight: 600,
                      letterSpacing: '0.06em', cursor: 'not-allowed',
                    }}
                  >
                    Plan actual
                  </button>
                ) : (
                  <button
                    onClick={() => { setSelectedPlan(plan); setModalView('select'); }}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)',
                      color: '#fff', fontSize: '0.78rem', fontWeight: 600,
                      letterSpacing: '0.06em', cursor: 'pointer',
                    }}
                  >
                    Elegir plan
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {comprobanteSent && (
          <div style={{
            marginTop: '20px', background: 'rgba(34,197,94,0.1)', border: '0.5px solid rgba(34,197,94,0.3)',
            borderRadius: '8px', padding: '14px 18px', fontSize: '0.82rem', color: '#22c55e',
          }}>
            Comprobante recibido. Tu plan sera activado en las proximas horas.
          </div>
        )}
      </div>

      {selectedPlan && (
        <div
          onClick={closePaymentModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '32px', maxWidth: '480px', width: '100%', position: 'relative' }}
          >
            <button
              onClick={closePaymentModal}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1,
              }}
            >
              ×
            </button>

            {modalView === 'select' && (
              <>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 600 }}>
                  Contratar plan {selectedPlan.name}
                </h3>
                <p style={{ margin: '0 0 24px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)' }}>
                  Monto: USD {selectedPlan.price_usd}
                </p>

                {!paymentConfig.transfer_enabled && !paymentConfig.mp_enabled && (
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
                    Medios de pago no configurados. Contacta al administrador.
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {paymentConfig.transfer_enabled && (
                    <button
                      onClick={handleChooseTransfer}
                      style={{
                        padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.85rem',
                        fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Pagar por transferencia
                    </button>
                  )}
                  {paymentConfig.mp_enabled && (
                    <button
                      onClick={handleChooseMp}
                      style={{
                        padding: '12px', borderRadius: '6px', border: 'none',
                        background: '#22c55e', color: '#0a0a0a', fontSize: '0.85rem',
                        fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Pagar con Mercado Pago
                    </button>
                  )}
                </div>
              </>
            )}

            {modalView === 'transfer' && transferData && (
              <>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 600 }}>
                  Transferencia bancaria
                </h3>
                <p style={{ margin: '0 0 18px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)' }}>
                  Monto: USD {transferData.amount_usd}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {[
                    { label: 'CBU', value: transferData.transfer_cbu },
                    { label: 'Alias', value: transferData.transfer_alias },
                    { label: 'Banco', value: transferData.transfer_bank },
                    { label: 'Titular', value: transferData.transfer_holder },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '10px 14px',
                    }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>{label}</div>
                        <div style={{ fontSize: '0.85rem' }}>{value || '—'}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(value || '')}
                        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', background: 'none', color: '#fff', fontSize: '0.7rem', cursor: 'pointer' }}
                      >
                        Copiar
                      </button>
                    </div>
                  ))}
                </div>

                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                  Subir comprobante de pago
                </label>
                <input
                  type="file"
                  onChange={handleUploadComprobante}
                  disabled={uploadingComprobante}
                  style={{ width: '100%', fontSize: '0.8rem', color: '#fff', marginBottom: '20px' }}
                />

                <button
                  onClick={() => setModalView('select')}
                  style={{ padding: '10px 18px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'none', color: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Volver
                </button>
              </>
            )}

            {modalView === 'mp' && mpData && (
              <>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 600 }}>
                  Mercado Pago
                </h3>
                <p style={{ margin: '0 0 24px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                  Hace clic en el boton para completar el pago en Mercado Pago
                </p>

                <button
                  onClick={() => window.open(mpData.init_point, '_blank')}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '6px', border: 'none',
                    background: '#22c55e', color: '#0a0a0a', fontSize: '0.85rem', fontWeight: 600,
                    cursor: 'pointer', marginBottom: '10px',
                  }}
                >
                  Ir a Mercado Pago
                </button>

                <button
                  onClick={handleVerifyMpPayment}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.85rem', fontWeight: 600,
                    cursor: 'pointer', marginBottom: '16px',
                  }}
                >
                  Ya pague, verificar
                </button>

                <button
                  onClick={() => setModalView('select')}
                  style={{ padding: '10px 18px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'none', color: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Volver
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .fitting-plans-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .fitting-plans-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .fitting-plans-grid { grid-template-columns: 1fr; }
        }
        .fitting-plan-popular {
          position: relative;
        }
        .fitting-plan-popular::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 14px;
          background: linear-gradient(120deg, #7c3aed, #2563eb, #7c3aed);
          background-size: 200% 200%;
          z-index: -1;
          animation: fittingGradientBorder 4s ease infinite;
        }
        @keyframes fittingGradientBorder {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
