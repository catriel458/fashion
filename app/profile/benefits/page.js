'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const LEVELS = {
  explorador:  { min: 0,    max: 99,   label: 'Explorador',  color: '#64748b', emoji: '🌱' },
  fashionista: { min: 100,  max: 299,  label: 'Fashionista', color: '#7c3aed', emoji: '✨' },
  vip:         { min: 300,  max: 699,  label: 'VIP',         color: '#d97706', emoji: '⭐' },
  icono:       { min: 700,  max: 99999, label: 'Ícono',      color: '#059669', emoji: '👑' },
};

const LEVEL_THEMES = {
  explorador:  { bg: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', border: '#cbd5e1', text: '#334155', color: '#64748b' },
  fashionista: { bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '#ddd6fe', text: '#5b21b6', color: '#7c3aed' },
  vip:         { bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '#fde68a', text: '#92400e', color: '#d97706' },
  icono:       { bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#bbf7d0', text: '#065f46', color: '#059669' },
};

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', marginBottom: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #e0dbd4', background: '#f5f3f0' }}>
        <span style={{ fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6b6560' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '22px 20px' }}>{children}</div>
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000,
      background: type === 'error' ? '#c0392b' : '#2e7d32', color: '#fff',
      padding: '12px 18px', borderRadius: '4px', fontSize: '0.82rem',
      fontFamily: 'var(--font-sans)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      {message}
    </div>
  );
}

export default function BenefitsPage() {
  const { data: session } = useSession();
  const [toast, setToast] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [showHowToEarn, setShowHowToEarn] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    if (!session?.user) return;

    fetch('/api/profile')
      .then(r => r.json())
      .then(d => { if (!d.error) setProfileData(d); })
      .catch(() => {});

    fetch('/api/profile/points-history')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPointsHistory(d); })
      .catch(() => {});

    fetch('/api/profile/coupons')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCoupons(d); })
      .catch(() => {});
  }, [session]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast("Código copiado al portapapeles!");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (!session?.user) return null;
  const user = session.user;
  const initials = (user.username?.[0] || user.email?.[0] || '?').toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-light)', fontFamily: 'var(--font-sans)' }}>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <div style={{ background: '#0f0f0f', padding: '0 0 0 0' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px clamp(1.2rem, 4vw, 2.5rem)' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', letterSpacing: '0.08em', color: '#fff', marginBottom: '20px' }}>
              TnB<span style={{ color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.65rem', marginLeft: '4px', letterSpacing: '0.16em' }}>Try & Buy</span>
            </div>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: '#fff', fontSize: '1.4rem', fontFamily: 'var(--font-serif)' }}>{initials}</span>
              }
            </div>
            <div>
              <div style={{ color: '#fff', fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 300 }}>{user.username}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', marginTop: '2px' }}>{user.email}</div>
            </div>
          </div>

          {/* Tabs nav */}
          <div style={{
            display: 'flex', gap: '24px', marginTop: '20px',
            borderBottom: '0.5px solid rgba(255,255,255,0.1)', paddingBottom: '0',
            overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
          }}>
            {[
              { label: 'Mi perfil', href: '/profile' },
              ...(user.role === 'visitor' ? [{ label: 'Mis compras', href: '/profile/orders' }] : []),
              { label: 'Mis beneficios', href: '/profile/benefits' },
              { label: 'Notificaciones', href: '/profile/notifications' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} style={{
                fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: href === '/profile/benefits' ? '#fff' : 'rgba(255,255,255,0.45)',
                textDecoration: 'none', paddingBottom: '12px',
                borderBottom: href === '/profile/benefits' ? '1.5px solid #fff' : 'none',
                flexShrink: 0,
              }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '28px clamp(1.2rem, 4vw, 2.5rem) 48px' }}>

        {/* Tarjeta de estado del usuario (puntos y nivel) */}
        {profileData && (
          <div style={{
            background: (LEVEL_THEMES[profileData.level ?? 'explorador'] || LEVEL_THEMES.explorador).bg,
            border: `1px solid ${(LEVEL_THEMES[profileData.level ?? 'explorador'] || LEVEL_THEMES.explorador).border}`,
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '20px',
            color: (LEVEL_THEMES[profileData.level ?? 'explorador'] || LEVEL_THEMES.explorador).text,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.8rem' }}>{(LEVELS[profileData.level ?? 'explorador'] || LEVELS.explorador).emoji}</span>
                  <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 500, color: 'inherit' }}>
                    Nivel {(LEVELS[profileData.level ?? 'explorador'] || LEVELS.explorador).label}
                  </h2>
                </div>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                  {profileData.points ?? 0} puntos acumulados
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.45)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                {(() => {
                  const levelKeys = Object.keys(LEVELS);
                  const currentIndex = levelKeys.indexOf(profileData.level ?? 'explorador');
                  const nextLevelKey = currentIndex !== -1 && currentIndex < levelKeys.length - 1 ? levelKeys[currentIndex + 1] : null;
                  const nextLevel = nextLevelKey ? LEVELS[nextLevelKey] : null;
                  return nextLevel ? `Siguiente: ${nextLevel.label} ${nextLevel.emoji}` : 'Nivel máximo 🎉';
                })()}
              </div>
            </div>

            {/* Barra de progreso */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.4)', borderRadius: '4px', overflow: 'hidden' }}>
                {(() => {
                  const levelKeys = Object.keys(LEVELS);
                  const currentLevelKey = profileData.level ?? 'explorador';
                  const currentLevel = LEVELS[currentLevelKey] || LEVELS.explorador;
                  const currentIndex = levelKeys.indexOf(currentLevelKey);
                  const nextLevelKey = currentIndex !== -1 && currentIndex < levelKeys.length - 1 ? levelKeys[currentIndex + 1] : null;
                  const nextLevel = nextLevelKey ? LEVELS[nextLevelKey] : null;
                  const pts = profileData.points ?? 0;

                  let progressPercent = 100;
                  if (nextLevel) {
                    const range = nextLevel.min - currentLevel.min;
                    const gained = pts - currentLevel.min;
                    progressPercent = Math.min(100, Math.max(0, (gained / range) * 100));
                  }
                  return (
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: (LEVEL_THEMES[currentLevelKey] || LEVEL_THEMES.explorador).color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                  );
                })()}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.75rem', opacity: 0.85 }}>
                {(() => {
                  const levelKeys = Object.keys(LEVELS);
                  const currentLevelKey = profileData.level ?? 'explorador';
                  const currentLevel = LEVELS[currentLevelKey] || LEVELS.explorador;
                  const currentIndex = levelKeys.indexOf(currentLevelKey);
                  const nextLevelKey = currentIndex !== -1 && currentIndex < levelKeys.length - 1 ? levelKeys[currentIndex + 1] : null;
                  const nextLevel = nextLevelKey ? LEVELS[nextLevelKey] : null;
                  const pts = profileData.points ?? 0;
                  return nextLevel
                    ? `Te faltan ${nextLevel.min - pts} puntos para ser ${nextLevel.label} ${nextLevel.emoji}`
                    : '¡Alcanzaste el nivel máximo!';
                })()}
              </p>
            </div>

            {/* Como ganar puntos colapsable */}
            <div style={{ marginTop: '20px', borderTop: '0.5px solid rgba(0,0,0,0.08)', paddingTop: '12px' }}>
              <button
                type="button"
                onClick={() => setShowHowToEarn(!showHowToEarn)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: '0.75rem', fontWeight: 600, color: 'inherit',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <span>{showHowToEarn ? '▼' : '▶'} ¿Cómo ganar puntos?</span>
              </button>
              {showHowToEarn && (
                <ul style={{ margin: '10px 0 0', paddingLeft: '20px', fontSize: '0.75rem', lineHeight: 1.6, color: 'inherit' }}>
                  <li>🛍️ <strong>Compra realizada:</strong> +10 puntos</li>
                  <li>🧥 <strong>Probada virtual usada:</strong> +2 puntos</li>
                  <li>✨ <strong>Primera probada virtual:</strong> +15 puntos</li>
                  <li>🌱 <strong>Bienvenida a la tienda:</strong> +5 puntos</li>
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Mis cupones */}
        <Section title="Mis cupones de descuento">
          {coupons.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: '#6b6560', margin: 0 }}>
              Aún no tienes ningún cupón disponible.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
              {coupons.map(coupon => {
                const isExpired = new Date(coupon.expires_at) < new Date();
                const isUsed = coupon.used;
                const isInactive = isExpired || isUsed;

                return (
                  <div
                    key={coupon.id}
                    style={{
                      border: `1.5px dashed ${isInactive ? '#cbd5e1' : '#e0dbd4'}`,
                      borderRadius: '8px',
                      padding: '16px 20px',
                      background: isInactive ? '#f8fafc' : '#fff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: isInactive ? 0.65 : 1,
                      position: 'relative',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          background: isInactive ? '#cbd5e1' : '#fef3c7',
                          color: isInactive ? '#64748b' : '#d97706',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {isUsed ? 'Usado' : isExpired ? 'Expirado' : 'Disponible'}
                      </span>
                      <p style={{ margin: '8px 0 2px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {coupon.store_name}
                      </p>
                      <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 600, color: '#0f0f0f' }}>
                        {coupon.discount_percentage}% de descuento
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#888' }}>
                        Válido hasta: {new Date(coupon.expires_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          letterSpacing: '0.08em',
                          background: isInactive ? '#f1f5f9' : '#f5f3f0',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          border: `0.5px solid ${isInactive ? '#e2e8f0' : '#e0dbd4'}`,
                          color: isInactive ? '#94a3b8' : '#0f0f0f',
                        }}
                      >
                        {coupon.code}
                      </div>
                      {!isInactive && (
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0f0f0f',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            padding: '2px 4px',
                          }}
                        >
                          {copiedCode === coupon.code ? '✓ Copiado!' : 'Copiar código'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Historial de puntos */}
        <Section title="Historial de puntos">
          {pointsHistory.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: '#6b6560', margin: 0 }}>Aún no tenés historial de puntos.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
              {pointsHistory.map(h => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '0.5px solid #f0ede8', fontSize: '0.8rem' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, color: '#0f0f0f' }}>{h.description}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: '#888' }}>
                      {new Date(h.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span style={{ fontWeight: 600, color: h.points > 0 ? '#166534' : '#c0392b' }}>
                    {h.points > 0 ? `+${h.points}` : h.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

      </div>
    </div>
  );
}
