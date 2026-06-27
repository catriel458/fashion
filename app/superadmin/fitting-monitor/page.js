'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const PLAN_BADGE_COLORS = { free: '#374151', starter: '#64748b', growth: '#7c3aed', pro: '#d97706', scale: '#059669' };
const PAYMENT_STATUS_STYLE = {
  pending: { background: '#fef3c7', color: '#92400e', label: 'Pendiente' },
  paid:    { background: '#d1fae5', color: '#065f46', label: 'Pagado' },
  failed:  { background: '#fee2e2', color: '#991b1b', label: 'Fallido' },
};

function fmtDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

function pctColor(pct) {
  if (pct < 60) return '#22c55e';
  if (pct < 85) return '#f59e0b';
  return '#ef4444';
}

function Card({ label, value, sub, color }) {
  return (
    <div style={{ background: '#111', border: '0.5px solid #1a1a1a', borderRadius: '8px', padding: '18px 20px' }}>
      <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 300, color: color || '#fff', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>{sub}</div>}
    </div>
  );
}

function Badge({ children, background, color }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, background, color }}>
      {children}
    </span>
  );
}

export default function FittingMonitorPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentConfig, setPaymentConfig] = useState({ mp_enabled: false, transfer_enabled: false, transfer_cbu: '', transfer_alias: '', transfer_bank: '', transfer_holder: '' });

  const [billingStore, setBillingStore] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingAmount, setBillingAmount] = useState('');
  const [billingNotes, setBillingNotes] = useState('');
  const [billingResult, setBillingResult] = useState(null);

  const [upgradeStore, setUpgradeStore] = useState(null);

  const loadData = useCallback(() => {
    setLoading(true);
    fetch('/api/superadmin/fitting-monitor')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => toast.error('Error al cargar el monitor'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
    fetch('/api/superadmin/payment-config')
      .then(r => r.json())
      .then(d => { if (!d.error) setPaymentConfig(d); })
      .catch(() => {});
  }, [loadData]);

  async function loadBillingHistory(storeId) {
    setBillingLoading(true);
    try {
      const res = await fetch(`/api/superadmin/fitting-billing?store_id=${storeId}`);
      const data = await res.json();
      setBillingHistory(Array.isArray(data) ? data : []);
    } catch {
      setBillingHistory([]);
    } finally {
      setBillingLoading(false);
    }
  }

  function openBillingModal(store) {
    setBillingStore(store);
    setBillingAmount(String(store.precio_plan_usd));
    setBillingNotes('');
    setBillingResult(null);
    loadBillingHistory(store.id);
  }

  function closeBillingModal() {
    setBillingStore(null);
    setBillingHistory([]);
    setBillingResult(null);
  }

  async function togglePlanStatus(store) {
    const next = store.plan_status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/superadmin/fitting-monitor/${store.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (next === 'suspended') toast.error('Tienda suspendida');
      else toast.success('Tienda activada');
      loadData();
    } catch (e) {
      toast.error(e.message || 'Error al actualizar');
    }
  }

  async function handleSendTransfer() {
    try {
      const res = await fetch('/api/superadmin/fitting-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: billingStore.id,
          plan: billingStore.fitting_plan,
          amount_usd: Number(billingAmount),
          payment_method: 'transferencia',
          notes: billingNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      toast.success('Email enviado con datos de pago');
      setBillingResult({ type: 'transfer' });
      loadBillingHistory(billingStore.id);
    } catch (e) {
      toast.error(e.message || 'Error al enviar');
    }
  }

  async function handleGenerateMpLink() {
    try {
      const res = await fetch('/api/superadmin/fitting-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: billingStore.id,
          plan: billingStore.fitting_plan,
          amount_usd: Number(billingAmount),
          payment_method: 'mercadopago',
          notes: billingNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      setBillingResult({ type: 'mp', payment_url: data.payment_url });
      loadBillingHistory(billingStore.id);
    } catch (e) {
      toast.error(e.message || 'Error al generar el link');
    }
  }

  async function handleActivatePlan(paymentId) {
    try {
      const res = await fetch('/api/superadmin/activate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Plan activado');
      loadBillingHistory(billingStore.id);
      loadData();
    } catch (e) {
      toast.error(e.message || 'Error al activar el plan');
    }
  }

  async function handleMarkPaid(paymentId) {
    try {
      const res = await fetch(`/api/superadmin/fitting-billing/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'paid' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Marcado como pagado');
      loadBillingHistory(billingStore.id);
    } catch (e) {
      toast.error(e.message || 'Error al actualizar');
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: 'clamp(2rem, 4vw, 3rem)' }}>
        Cargando...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: 'clamp(2rem, 4vw, 3rem)' }}>
        Error al cargar datos
      </div>
    );
  }

  const { tiendas, totales } = data;
  const tiendasActivas = tiendas.length;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'var(--font-sans)', padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', margin: '0 0 8px' }}>
        Monitor del probador virtual
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', margin: '0 0 28px' }}>
        Consumo, costos e ingresos del probador con IA por tienda.
      </p>

      {/* Cards superiores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '16px' }} className="fm-grid-4">
        <Card label="Probadas usadas" value={totales.total_used} sub="este mes en todas las tiendas" />
        <Card label="Costo estimado" value={`$${totales.total_costo_usd}`} sub="a USD 0.039 por probada" color="#ef4444" />
        <Card label="Ingresos estimados" value={`$${totales.total_ingresos_usd}`} sub="suma de planes activos" color="#22c55e" />
        <Card label="Margen del mes" value={`${totales.total_margen_usd >= 0 ? '' : '-'}$${Math.abs(totales.total_margen_usd)}`} sub="ingresos menos costos" color={totales.total_margen_usd >= 0 ? '#22c55e' : '#ef4444'} />
      </div>

      {/* Cards secundarias */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px' }} className="fm-grid-3">
        <div style={{ background: '#111', border: '0.5px solid #1a1a1a', borderRadius: '8px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Tiendas FREE</span>
          <Badge background="#374151" color="#fff">{totales.tiendas_free}</Badge>
        </div>
        <div style={{ background: '#111', border: '0.5px solid #1a1a1a', borderRadius: '8px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Oportunidades de upgrade</span>
          <Badge background="#f59e0b" color="#0a0a0a">{totales.oportunidades_upgrade}</Badge>
        </div>
        <div style={{ background: '#111', border: '0.5px solid #1a1a1a', borderRadius: '8px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Total tiendas</span>
          <Badge background="#22c55e" color="#0a0a0a">{tiendasActivas}</Badge>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto', border: '0.5px solid #1a1a1a', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: '#111' }}>
              {['Tienda', 'Plan', 'Uso', '%', 'Costo', 'Ingreso', 'Margen', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tiendas.map(store => (
              <tr key={store.id} style={{ background: '#0d0d0d', borderTop: '0.5px solid #1a1a1a' }}>
                <td style={{ padding: '11px 14px' }}>{store.name}</td>
                <td style={{ padding: '11px 14px' }}>
                  <Badge background={PLAN_BADGE_COLORS[store.fitting_plan] || '#374151'} color="#fff">{store.fitting_plan}</Badge>
                </td>
                <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>{store.fitting_used_this_month} / {store.fitting_monthly_limit}</td>
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '60px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, store.porcentaje)}%`, background: pctColor(store.porcentaje) }} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>{store.porcentaje}%</span>
                  </div>
                </td>
                <td style={{ padding: '11px 14px', color: '#ef4444' }}>${store.costo_usd}</td>
                <td style={{ padding: '11px 14px', color: store.precio_plan_usd > 0 ? '#22c55e' : '#6b7280' }}>${store.precio_plan_usd}</td>
                <td style={{ padding: '11px 14px', color: store.margen_usd >= 0 ? '#22c55e' : '#ef4444' }}>
                  {store.margen_usd >= 0 ? '' : '-'}${Math.abs(store.margen_usd)}
                </td>
                <td style={{ padding: '11px 14px' }}>
                  {store.plan_status === 'active' ? (
                    <Badge background="#052e16" color="#22c55e">Activo</Badge>
                  ) : (
                    <Badge background="#450a0a" color="#ef4444">Suspendido</Badge>
                  )}
                </td>
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => openBillingModal(store)}
                      style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', fontSize: '0.68rem', cursor: 'pointer' }}
                    >
                      Cobrar
                    </button>
                    {store.plan_status === 'active' ? (
                      <button
                        onClick={() => togglePlanStatus(store)}
                        style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', background: '#450a0a', color: '#ef4444', fontSize: '0.68rem', cursor: 'pointer' }}
                      >
                        Suspender
                      </button>
                    ) : (
                      <button
                        onClick={() => togglePlanStatus(store)}
                        style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', background: '#052e16', color: '#22c55e', fontSize: '0.68rem', cursor: 'pointer' }}
                      >
                        Activar
                      </button>
                    )}
                    {store.is_upgrade_opportunity && (
                      <button
                        onClick={() => setUpgradeStore(store)}
                        style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', background: '#1c1917', color: '#f59e0b', fontSize: '0.68rem', cursor: 'pointer' }}
                      >
                        Ofrecer upgrade
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de cobro */}
      {billingStore && (
        <div
          onClick={closeBillingModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '32px', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
          >
            <button
              onClick={closeBillingModal}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}
            >
              ×
            </button>

            <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 600 }}>
              Cobrar a {billingStore.name}
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)' }}>
              Plan actual: <Badge background={PLAN_BADGE_COLORS[billingStore.fitting_plan] || '#374151'} color="#fff">{billingStore.fitting_plan}</Badge>
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>Monto USD</label>
              <input
                type="number"
                step="0.01"
                value={billingAmount}
                onChange={e => setBillingAmount(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>Notas</label>
              <textarea
                value={billingNotes}
                onChange={e => setBillingNotes(e.target.value)}
                rows={2}
                placeholder="Ej: Julio 2026"
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
              {paymentConfig.transfer_enabled && (
                <button
                  onClick={handleSendTransfer}
                  style={{ padding: '10px 18px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Enviar datos de transferencia
                </button>
              )}
              {paymentConfig.mp_enabled && (
                <button
                  onClick={handleGenerateMpLink}
                  style={{ padding: '10px 18px', borderRadius: '6px', border: 'none', background: '#22c55e', color: '#0a0a0a', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Generar link de Mercado Pago
                </button>
              )}
            </div>

            {billingResult?.type === 'transfer' && (
              <div style={{ marginBottom: '18px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '14px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>CBU: {paymentConfig.transfer_cbu || '—'}</div>
                <div>Alias: {paymentConfig.transfer_alias || '—'}</div>
                <div>Banco: {paymentConfig.transfer_bank || '—'}</div>
                <div>Titular: {paymentConfig.transfer_holder || '—'}</div>
              </div>
            )}

            {billingResult?.type === 'mp' && (
              <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  readOnly
                  value={billingResult.payment_url}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { navigator.clipboard.writeText(billingResult.payment_url); toast.success('Copiado'); }}
                    style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'none', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Copiar link
                  </button>
                  <button
                    onClick={() => window.open(billingResult.payment_url, '_blank')}
                    style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'none', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Abrir en MP
                  </button>
                </div>
              </div>
            )}

            {/* Historial */}
            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>Historial</div>

              {billingLoading ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Cargando...</p>
              ) : billingHistory.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Sin pagos registrados.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        {['Fecha', 'Plan', 'Monto', 'Metodo', 'Estado', 'Acciones'].map(h => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {billingHistory.map(p => {
                        const statusStyle = PAYMENT_STATUS_STYLE[p.payment_status] || PAYMENT_STATUS_STYLE.pending;
                        return (
                          <tr key={p.id} style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                            <td style={{ padding: '6px 8px' }}>{fmtDate(p.created_at)}</td>
                            <td style={{ padding: '6px 8px' }}>{p.plan}</td>
                            <td style={{ padding: '6px 8px' }}>${p.amount_usd}</td>
                            <td style={{ padding: '6px 8px' }}>{p.payment_method}</td>
                            <td style={{ padding: '6px 8px' }}>
                              <Badge background={statusStyle.background} color={statusStyle.color}>{statusStyle.label}</Badge>
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              {p.payment_status === 'pending' && (
                                p.comprobante_url ? (
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                      onClick={() => window.open(p.comprobante_url, '_blank')}
                                      style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', fontSize: '0.65rem', cursor: 'pointer' }}
                                    >
                                      Ver comprobante
                                    </button>
                                    <button
                                      onClick={() => handleActivatePlan(p.id)}
                                      style={{ padding: '3px 8px', borderRadius: '4px', border: 'none', background: '#052e16', color: '#22c55e', fontSize: '0.65rem', cursor: 'pointer' }}
                                    >
                                      Activar plan
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleMarkPaid(p.id)}
                                    style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', fontSize: '0.65rem', cursor: 'pointer' }}
                                  >
                                    Marcar pagado
                                  </button>
                                )
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de upgrade */}
      {upgradeStore && (
        <div
          onClick={() => setUpgradeStore(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '32px', maxWidth: '420px', width: '100%', position: 'relative' }}
          >
            <button
              onClick={() => setUpgradeStore(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}
            >
              ×
            </button>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 600 }}>Ofrecer upgrade</h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {`Hola ${upgradeStore.name}! Agotaste tus 20 probadas gratuitas este mes en TnB. Con el plan Starter por USD 9/mes tenes 100 probadas mensuales. Te lo activo hoy si queres.`}
            </p>
            <button
              onClick={() => {
                const msg = `Hola ${upgradeStore.name}! Agotaste tus 20 probadas gratuitas este mes en TnB. Con el plan Starter por USD 9/mes tenes 100 probadas mensuales. Te lo activo hoy si queres.`;
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
              }}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: 'none', background: '#22c55e', color: '#0a0a0a', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Abrir WhatsApp
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .fm-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 700px) {
          .fm-grid-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
