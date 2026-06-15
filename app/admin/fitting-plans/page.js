'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const WHATSAPP_NUMBER = '5491100000000';

const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 9,
    description: 'Para tiendas que recién arrancan con el probador virtual.',
    accent: '#64748b',
    badge: null,
    dailyLimit: 5,
    features: [
      '100 probadas por mes',
      'Hasta 5 por usuario por día (configurable)',
      'Soporte por email',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 25,
    description: 'Más probadas y soporte prioritario para tiendas activas.',
    accent: '#7c3aed',
    badge: 'MAS POPULAR',
    dailyLimit: 10,
    features: [
      '300 probadas por mes',
      'Hasta 10 por usuario por día (configurable)',
      'Soporte prioritario',
      'El más elegido por tiendas activas',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    description: 'Para tiendas en crecimiento que quieren ver sus métricas.',
    accent: '#d97706',
    badge: 'PARA CRECER',
    dailyLimit: 20,
    features: [
      '800 probadas por mes',
      'Hasta 20 por usuario por día (configurable)',
      'Panel de métricas de uso',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 139,
    description: 'Alto volumen, sin límites diarios y soporte dedicado.',
    accent: '#059669',
    badge: 'ALTO VOLUMEN',
    dailyLimit: 999,
    features: [
      '2000 probadas por mes',
      'Sin límite diario',
      'SLA + soporte dedicado',
    ],
  },
];

const PLAN_COLORS = { starter: '#64748b', growth: '#7c3aed', pro: '#d97706', scale: '#059669' };

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
  const [modalPlan, setModalPlan] = useState(null);

  useEffect(() => {
    fetch('/api/admin/fitting-config')
      .then(r => r.json())
      .then(d => {
        if (d.error) return;
        setConfig(d);
        setDailyLimit(d.daily_limit_per_user);
      })
      .finally(() => setLoading(false));
  }, []);

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
                  <span style={{ fontSize: '2.2rem', fontWeight: 700 }}>${plan.price}</span>
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
                    onClick={() => setModalPlan(plan)}
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
      </div>

      {modalPlan && (
        <div
          onClick={() => setModalPlan(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '28px', maxWidth: '360px', width: '100%' }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '1.15rem', fontWeight: 600 }}>
              Cambiar a plan {modalPlan.name}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
              Para cambiar de plan escribinos y te lo activamos en minutos.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', textAlign: 'center', padding: '12px',
                background: '#22c55e', color: '#0a0a0a', borderRadius: '6px',
                fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', letterSpacing: '0.04em',
              }}
            >
              Escribir por WhatsApp
            </a>
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
