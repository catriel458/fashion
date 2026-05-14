'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const TYPE_ICON = {
  order_confirmed: '📦',
  low_stock: '⚠️',
  new_user: '👤',
  birthday_coupon: '🎂',
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

export default function NotificationBell({ textColor = '#0f0f0f' }) {
  const { data: session } = useSession();
  const [open, setOpen]   = useState(false);
  const [data, setData]   = useState({ notifications: [], unread: 0 });
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

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications?page=1');
      if (res.ok) setData(await res.json());
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
                    <div style={{ fontSize: '0.68rem', color: '#6b6560', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
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
