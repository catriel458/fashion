'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const STATUS_LABEL = {
  pending:   'Pendiente',
  confirmed: 'Confirmado',
  ready:     'Listo para retirar',
  delivered: 'Vendido',
  cancelled: 'Cancelado',
};
const STATUS_COLOR = {
  pending:   { bg: '#fff8e1', color: '#e67e22' },
  confirmed: { bg: '#e3f2fd', color: '#1565c0' },
  ready:     { bg: '#e8f5e9', color: '#2e7d32' },
  delivered: { bg: '#e8f5e9', color: '#1b5e20' },
  cancelled: { bg: '#fef2f2', color: '#c0392b' },
};
const STATUS_DESC = {
  pending:   'Esperando confirmación del local',
  confirmed: 'El local confirmó tu pedido, coordiná el retiro por WhatsApp',
  ready:     'Tu pedido está listo para retirar',
  delivered: '¡Pedido completado! Gracias por tu compra',
  cancelled: 'Este pedido fue cancelado',
};

export default function OrdersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [details,  setDetails]  = useState({});

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session) return;
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session, sessionStatus]);

  async function toggleOrder(id) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!details[id]) {
      const res  = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (!data.error) setDetails(prev => ({ ...prev, [id]: data }));
    }
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gray-light)', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6b6560' }}>Cargando...</div>
      </div>
    );
  }

  if (!session) return null;

  function StatusBadge({ status }) {
    const s = STATUS_COLOR[status] || { bg: '#f5f3f0', color: '#6b6560' };
    return (
      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.65rem', background: s.bg, color: s.color }}>
        {STATUS_LABEL[status] || status}
      </span>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-light)', fontFamily: 'var(--font-sans)' }}>

      {/* Header */}
      <div style={{ background: '#0f0f0f' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px clamp(1.2rem, 4vw, 2.5rem)' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', letterSpacing: '0.08em', color: '#fff', marginBottom: '16px' }}>
              CnB<span style={{ color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.18em', marginLeft: '6px' }}>Choose and Buy</span>
            </div>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: '1.6rem', color: '#fff', margin: '0 0 16px' }}>
            Mis pedidos
          </h1>
          <div style={{ display: 'flex', gap: '24px', borderBottom: '0.5px solid rgba(255,255,255,0.1)', paddingBottom: '0' }}>
            {[
              { label: 'Mi perfil', href: '/profile' },
              { label: 'Mis pedidos', href: '/profile/orders' },
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

      {/* Lista */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '28px clamp(1.2rem, 4vw, 2.5rem) 48px' }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 16px', background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🛍️</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '8px', fontWeight: 300 }}>
              Todavía no tenés pedidos
            </div>
            <Link href="/" style={{ fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0f0f0f', textDecoration: 'underline' }}>
              Ir a la tienda →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {orders.map(order => {
              const statusDesc = STATUS_DESC[order.status] || order.status;
              return (
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
                        {order.store_name && (
                          <div>
                            <div style={{ fontSize: '0.62rem', color: '#6b6560', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '2px' }}>Tienda</div>
                            <div style={{ fontSize: '0.82rem' }}>{order.store_name}</div>
                          </div>
                        )}
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
                        <StatusBadge status={order.status} />
                        <span style={{ color: '#6b6560', fontSize: '0.8rem' }}>{expanded === order.id ? '▲' : '▼'}</span>
                      </div>
                    </div>
                  </button>

                  {expanded === order.id && (
                    <div style={{ borderTop: '0.5px solid #e0dbd4', padding: '16px 20px' }}>
                      {/* Estado descriptivo */}
                      <div style={{ marginBottom: '16px', padding: '10px 14px', background: (STATUS_COLOR[order.status] || { bg: '#f5f3f0' }).bg, borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '3px' }}>Estado del pedido</div>
                        <div style={{ fontSize: '0.82rem', color: '#0f0f0f' }}>{statusDesc}</div>
                      </div>

                      {/* Punto de retiro */}
                      {details[order.id]?.pickup_point_name && (
                        <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: '4px' }}>
                          <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#166534', marginBottom: '3px' }}>Punto de retiro</div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#0f0f0f' }}>{details[order.id].pickup_point_name}</div>
                        </div>
                      )}

                      {/* Productos */}
                      {!details[order.id] ? (
                        <div style={{ color: '#6b6560', fontSize: '0.82rem', marginBottom: '12px' }}>Cargando productos...</div>
                      ) : (
                        <>
                          {(details[order.id].items || []).map((item, i) => (
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
                          ))}

                          {/* Info de retiro si la tienda tiene WhatsApp */}
                          {details[order.id].store_whatsapp && (
                            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '0.5px solid #f0ede8' }}>
                              <a
                                href={`https://wa.me/${details[order.id].store_whatsapp}?text=${encodeURIComponent(`Hola, consulta sobre mi pedido #${order.id}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-block', padding: '8px 16px', background: '#25d366', color: '#fff',
                                  borderRadius: '3px', textDecoration: 'none', fontSize: '0.72rem',
                                  letterSpacing: '0.08em', textTransform: 'uppercase',
                                }}
                              >
                                Contactar por WhatsApp
                              </a>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
