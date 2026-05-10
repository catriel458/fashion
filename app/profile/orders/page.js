'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const STATUS_LABEL = { confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada' };
const STATUS_COLOR = { confirmed: '#2e7d32', pending: '#e67e22', cancelled: '#c0392b' };
const STATUS_BG    = { confirmed: '#e8f5e9', pending: '#fff8e1', cancelled: '#fef2f2' };

export default function OrdersPage() {
  const { data: session } = useSession();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [details,  setDetails]  = useState({});

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function toggleOrder(id) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!details[id]) {
      const res  = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      setDetails(prev => ({ ...prev, [id]: data }));
    }
  }

  if (!session) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-light)', fontFamily: 'var(--font-sans)' }}>

      {/* Header */}
      <div style={{ background: '#0f0f0f' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px clamp(1.2rem, 4vw, 2.5rem)' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', letterSpacing: '0.08em', color: '#fff', marginBottom: '16px' }}>
              FASHION<span style={{ color: '#6b6560' }}>MALL</span>
            </div>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: '1.6rem', color: '#fff', margin: '0 0 16px' }}>
            Mis compras
          </h1>

          <div style={{ display: 'flex', gap: '24px', borderBottom: '0.5px solid rgba(255,255,255,0.1)', paddingBottom: '0' }}>
            {[
              { label: 'Mi perfil', href: '/profile' },
              { label: 'Mis compras', href: '/profile/orders' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} style={{
                fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: href === '/profile/orders' ? '#fff' : 'rgba(255,255,255,0.45)',
                textDecoration: 'none', paddingBottom: '12px',
                borderBottom: href === '/profile/orders' ? '1.5px solid #fff' : 'none',
              }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Orders list */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '28px clamp(1.2rem, 4vw, 2.5rem) 48px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b6560' }}>Cargando...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 16px', background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🛍️</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '8px', fontWeight: 300 }}>
              Todavía no tenés compras
            </div>
            <Link href="/store/zara" style={{ fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0f0f0f', textDecoration: 'underline' }}>
              Ir a la tienda →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {orders.map(order => (
              <div key={order.id} style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', overflow: 'hidden' }}>
                <button onClick={() => toggleOrder(order.id)} style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '16px 20px', textAlign: 'left', fontFamily: 'var(--font-sans)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '0.62rem', color: '#6b6560', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '2px' }}>Orden</div>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>#{order.id}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.62rem', color: '#6b6560', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '2px' }}>Fecha</div>
                        <div style={{ fontSize: '0.82rem' }}>{new Date(order.created_at).toLocaleDateString('es-AR')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.62rem', color: '#6b6560', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '2px' }}>Total</div>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem' }}>${parseFloat(order.total).toFixed(2)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '0.65rem',
                        background: STATUS_BG[order.status], color: STATUS_COLOR[order.status],
                      }}>
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                      <span style={{ color: '#6b6560', fontSize: '0.8rem' }}>{expanded === order.id ? '▲' : '▼'}</span>
                    </div>
                  </div>
                </button>

                {expanded === order.id && (
                  <div style={{ borderTop: '0.5px solid #e0dbd4', padding: '16px 20px' }}>
                    {!details[order.id] ? (
                      <div style={{ color: '#6b6560', fontSize: '0.82rem' }}>Cargando productos...</div>
                    ) : (
                      (details[order.id].items || []).map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: i < details[order.id].items.length - 1 ? '0.5px solid #f0ede8' : 'none' }}>
                          <div style={{ width: '52px', height: '62px', background: '#f0ede8', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                            {item.image_url
                              ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👕</div>
                            }
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>{item.name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#6b6560' }}>
                              Cantidad: {item.quantity} · ${parseFloat(item.price_at_purchase).toFixed(2)} c/u
                            </div>
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                            ${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
