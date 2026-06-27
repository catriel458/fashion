'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const TYPE_ICON = {
  order_confirmed: '📦',
  low_stock: '⚠️',
  new_user: '👤',
  birthday_coupon: '🎂',
  welcome_coupon: '🎁',
  first_tryon_coupon: '🎫',
  general: '🔔',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

function triggerConfetti() {
  if (typeof window === 'undefined') return;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '99999';
  document.body.appendChild(container);

  const colors = ['#d97706', '#7c3aed', '#059669', '#e11d48', '#3b82f6', '#fde047'];
  
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 1.8;
    const duration = 2.5 + Math.random() * 2;
    const size = 6 + Math.random() * 8;
    
    p.style.position = 'absolute';
    p.style.top = '-20px';
    p.style.left = `${left}%`;
    p.style.width = `${size}px`;
    p.style.height = `${size * (0.6 + Math.random() * 0.7)}px`;
    p.style.background = color;
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    p.style.opacity = '0.9';
    p.style.animation = `tnbConfettiFall ${duration}s linear ${delay}s forwards`;
    
    container.appendChild(p);
  }

  const style = document.createElement('style');
  style.id = 'tnb-confetti-keyframes';
  style.innerHTML = `
    @keyframes tnbConfettiFall {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 0.9;
      }
      100% {
        transform: translateY(105vh) rotate(720deg);
        opacity: 0;
      }
    }
  `;
  if (!document.getElementById('tnb-confetti-keyframes')) {
    document.head.appendChild(style);
  }

  setTimeout(() => {
    container.remove();
  }, 6500);
}

export default function NotificationBell({ textColor = '#0f0f0f' }) {
  const { data: session } = useSession();
  const [open, setOpen]   = useState(false);
  const [data, setData]   = useState({ notifications: [], unread: 0 });
  const [celebration, setCelebration] = useState(null);
  const ref               = useRef(null);

  useEffect(() => {
    if (!session?.user) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleRefresh = () => loadNotifications();
    window.addEventListener('tnb-refresh-notifications', handleRefresh);
    return () => window.removeEventListener('tnb-refresh-notifications', handleRefresh);
  }, []);

  useEffect(() => {
    if (celebration) {
      triggerConfetti();
      const t = setTimeout(() => setCelebration(null), 8500);
      return () => clearTimeout(t);
    }
  }, [celebration]);

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications?page=1');
      if (res.ok) {
        const d = await res.json();
        setData(d);

        // Check for achievements to celebrate
        if (d.notifications && d.notifications.length > 0) {
          const celebratedIds = JSON.parse(localStorage.getItem('tnb_celebrated_notifs') || '[]');
          const toCelebrate = d.notifications.find(n => 
            !n.read && 
            ['level_up', 'welcome_coupon', 'first_tryon_coupon'].includes(n.type) &&
            !celebratedIds.includes(n.id)
          );

          if (toCelebrate) {
            setCelebration({
              id: toCelebrate.id,
              type: toCelebrate.type,
              title: toCelebrate.title,
              message: toCelebrate.message,
            });
            celebratedIds.push(toCelebrate.id);
            localStorage.setItem('tnb_celebrated_notifs', JSON.stringify(celebratedIds));
            // Mark as read in backend
            markRead(toCelebrate.id);
          }
        }
      }
    } catch {}
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' });
    setData(prev => ({
      ...prev,
      unread: 0,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
    }));
  }

  async function markRead(id) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    setData(prev => ({
      ...prev,
      unread: Math.max(0, prev.unread - 1),
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
  }

  if (!session?.user) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Celebration overlay */}
      {celebration && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,15,15,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '24px',
          animation: 'tnbFadeIn 0.3s ease-out'
        }}>
          <style>{`
            @keyframes tnbFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes tnbPopIn {
              0% { transform: scale(0.85); opacity: 0; }
              70% { transform: scale(1.05); }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes tnbFloat {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
              100% { transform: translateY(0px); }
            }
          `}</style>
          
          <div style={{
            background: 'linear-gradient(135deg, #ffffff, #fbfbf9)',
            border: '1px solid #e0dbd4',
            borderRadius: '16px',
            padding: '36px 24px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
            animation: 'tnbPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onClick={e => e.stopPropagation()}
          >
            <div style={{
              position: 'absolute', top: '-50%', left: '-50%', right: '-50%', bottom: '-50%',
              background: 'radial-gradient(circle, rgba(217,119,6,0.08) 0%, rgba(255,255,255,0) 70%)',
              pointerEvents: 'none', zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                fontSize: '3.5rem',
                marginBottom: '16px',
                animation: 'tnbFloat 3s ease-in-out infinite',
                display: 'inline-block'
              }}>
                {celebration.type === 'level_up' ? '👑' : celebration.type === 'welcome_coupon' ? '🎁' : '🎫'}
              </div>
              
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.4rem',
                fontWeight: 400,
                color: '#0f0f0f',
                margin: '0 0 10px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {celebration.title}
              </h3>
              
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.82rem',
                color: '#6b6560',
                lineHeight: 1.6,
                margin: '0 0 24px'
              }}>
                {celebration.message}
              </p>

              <button
                onClick={() => {
                  setCelebration(null);
                  triggerConfetti();
                }}
                style={{
                  background: '#0f0f0f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '12px 28px',
                  fontSize: '0.75rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#222'}
                onMouseLeave={e => e.currentTarget.style.background = '#0f0f0f'}
              >
                ¡Buenísimo! 🎉
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => { setOpen(o => !o); if (!open) loadNotifications(); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', position: 'relative', color: textColor, display: 'flex', alignItems: 'center' }}
        aria-label="Notificaciones"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {data.unread > 0 && (
          <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#ef4444', color: '#fff', width: '16px', height: '16px', borderRadius: '50%', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}>
            {data.unread > 9 ? '9+' : data.unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '44px', right: 0, background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: '300px', maxWidth: '360px', zIndex: 200, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #e0dbd4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0f0f0f', fontWeight: 500 }}>
              Notificaciones
            </span>
            {data.unread > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', color: '#6b6560', textDecoration: 'underline', padding: 0 }}>
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {data.notifications.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#aaa', fontSize: '0.8rem' }}>
                Sin notificaciones
              </div>
            ) : (
              data.notifications.slice(0, 8).map(n => (
                <div
                  key={n.id}
                  onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link; }}
                  style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0ede8', cursor: n.link ? 'pointer' : 'default', background: n.read ? '#fff' : '#fefce8', display: 'flex', gap: '10px', alignItems: 'flex-start', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f3f0'}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? '#fff' : '#fefce8'}
                >
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{TYPE_ICON[n.type] || '🔔'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: n.read ? 400 : 600, color: '#0f0f0f', marginBottom: '2px' }}>{n.title}</div>
                    <div style={{ fontSize: '0.68rem', color: '#6b6560', lineHeight: '1.4', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.message}</div>
                    <div style={{ fontSize: '0.62rem', color: '#aaa', marginTop: '3px' }}>{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '10px 16px', borderTop: '0.5px solid #e0dbd4', textAlign: 'center' }}>
            <Link href="/profile/notifications" onClick={() => setOpen(false)} style={{ fontSize: '0.68rem', color: '#6b6560', textDecoration: 'none', letterSpacing: '0.08em' }}>
              Ver todas →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
