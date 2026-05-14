'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const TYPE_ICON = {
  order_confirmed: '📦',
  low_stock: '⚠️',
  new_user: '👤',
  birthday_coupon: '🎂',
  general: '🔔',
};

const TYPE_LABEL = {
  order_confirmed: 'Pedidos',
  low_stock: 'Stock',
  new_user: 'Usuarios',
  birthday_coupon: 'Cumpleaños',
  general: 'General',
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

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [filter, setFilter]  = useState('all');
  const [page, setPage]      = useState(1);
  const [data, setData]      = useState({ notifications: [], total: 0, unread: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    loadNotifications();
  }, [session, page]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${page}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' });
    setData(prev => ({ ...prev, unread: 0, notifications: prev.notifications.map(n => ({ ...n, read: true })) }));
  }

  async function markRead(id) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    setData(prev => ({
      ...prev,
      unread: Math.max(0, prev.unread - 1),
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
  }

  const filtered = filter === 'all' ? data.notifications : data.notifications.filter(n => n.type === filter);
  const totalPages = Math.ceil(data.total / 20);

  if (!session?.user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3f0', fontFamily: 'var(--font-sans)' }}>
      <div style={{ background: '#0f0f0f', padding: '24px clamp(1.2rem,4vw,2.5rem)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: '#fff', marginBottom: '16px', letterSpacing: '0.08em' }}>
              CnB<span style={{ color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.65rem', marginLeft: '4px' }}>Choose and Buy</span>
            </div>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <h1 style={{ color: '#fff', fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: '1.4rem', margin: 0 }}>
              Notificaciones
              {data.unread > 0 && <span style={{ marginLeft: '8px', background: '#ef4444', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '0.65rem' }}>{data.unread}</span>}
            </h1>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {data.unread > 0 && (
                <button onClick={markAllRead} style={{ background: 'none', border: '0.5px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '6px 12px', borderRadius: '2px', fontSize: '0.68rem', letterSpacing: '0.1em' }}>
                  Marcar todas como leídas
                </button>
              )}
              <Link href="/profile" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', textDecoration: 'none', letterSpacing: '0.1em' }}>← Mi perfil</Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px clamp(1.2rem,4vw,2.5rem) 48px' }}>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {['all', 'order_confirmed', 'birthday_coupon', 'low_stock', 'new_user', 'general'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: '999px', border: '0.5px solid', borderColor: filter === f ? '#0f0f0f' : '#e0dbd4', background: filter === f ? '#0f0f0f' : '#fff', color: filter === f ? '#fff' : '#6b6560', cursor: 'pointer', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {f === 'all' ? 'Todas' : (TYPE_LABEL[f] || f)}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: '#6b6560', fontSize: '0.875rem' }}>Cargando...</p>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '0.875rem' }}>
            Sin notificaciones
          </div>
        ) : (
          <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', overflow: 'hidden' }}>
            {filtered.map((n, i) => (
              <div
                key={n.id}
                onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link; }}
                style={{ padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '0.5px solid #f0ede8' : 'none', cursor: n.link ? 'pointer' : 'default', background: n.read ? '#fff' : '#fefce8', display: 'flex', gap: '12px', alignItems: 'flex-start', transition: 'background 0.15s' }}
                onMouseEnter={e => { if (n.link) e.currentTarget.style.background = '#f5f3f0'; }}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? '#fff' : '#fefce8'}
              >
                <span style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: '2px' }}>{TYPE_ICON[n.type] || '🔔'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: n.read ? 400 : 600, color: '#0f0f0f' }}>{n.title}</div>
                    <div style={{ fontSize: '0.65rem', color: '#aaa', flexShrink: 0 }}>{timeAgo(n.created_at)}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b6560', marginTop: '3px', lineHeight: 1.5 }}>{n.message}</div>
                </div>
                {!n.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: '6px' }} />}
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '0.72rem' }}>
              ← Anterior
            </button>
            <span style={{ padding: '6px 14px', fontSize: '0.72rem', color: '#6b6560' }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 14px', border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '0.72rem' }}>
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
