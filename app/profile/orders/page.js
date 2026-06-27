'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const STATUS_LABEL = {
  pendiente_pago:        'Pendiente de pago',
  comprobante_pendiente: 'Falta envío comprobante',
  comprobante_enviado:   'El local está viendo el comprobante',
  pago_recibido:         'Pago exitoso',
  preparando_pedido:     'Preparando pedido',
  en_camino:             'En camino',
  listo_para_retirar:    'Listo para retirar',
  entregado:             'Entregado',
  cancelado:             'Cancelado',
  // Legacy values
  pending:   'Pendiente',
  confirmed: 'Confirmado',
  ready:     'Listo para retirar',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_COLOR = {
  pendiente_pago:        { bg: '#fff8e1', color: '#e67e22' },
  comprobante_pendiente: { bg: '#fef3c7', color: '#d97706' },
  comprobante_enviado:   { bg: '#fef9c3', color: '#ca8a04' },
  pago_recibido:         { bg: '#dcfce7', color: '#16a34a' },
  preparando_pedido:     { bg: '#e3f2fd', color: '#1565c0' },
  en_camino:             { bg: '#ede9fe', color: '#7c3aed' },
  listo_para_retirar:    { bg: '#d1fae5', color: '#065f46' },
  entregado:             { bg: '#e8f5e9', color: '#1b5e20' },
  cancelado:             { bg: '#fef2f2', color: '#c0392b' },
  // Legacy
  pending:   { bg: '#fff8e1', color: '#e67e22' },
  confirmed: { bg: '#e3f2fd', color: '#1565c0' },
  ready:     { bg: '#e8f5e9', color: '#2e7d32' },
  delivered: { bg: '#e8f5e9', color: '#1b5e20' },
  cancelled: { bg: '#fef2f2', color: '#c0392b' },
};

const STATUS_DESC = {
  pendiente_pago:        'Tu pedido fue recibido. Esperando aprobación del pago.',
  comprobante_pendiente: 'Falta envío del comprobante de transferencia bancaria.',
  comprobante_enviado:   'El local está verificando el comprobante de transferencia enviado.',
  pago_recibido:         '¡Pago exitoso! Estamos preparando tu pedido.',
  preparando_pedido:     'Tu pedido está siendo preparado.',
  en_camino:             'Tu pedido está en camino.',
  listo_para_retirar:    'Tu pedido está listo para retirar.',
  entregado:             '¡Pedido completado! Gracias por tu compra.',
  cancelado:             'Este pedido fue cancelado.',
  // Legacy
  pending:   'Esperando confirmación del local',
  confirmed: 'El local confirmó tu pedido',
  ready:     'Tu pedido está listo para retirar',
  delivered: '¡Pedido completado! Gracias por tu compra',
  cancelled: 'Este pedido fue cancelado',
};

export default function OrdersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [orders,          setOrders]         = useState([]);
  const [loading,         setLoading]        = useState(true);
  const [expanded,        setExpanded]       = useState(null);
  const [details,         setDetails]        = useState({});
  const [uploadingId,     setUploadingId]    = useState(null);
  const [uploadDoneIds,   setUploadDoneIds]  = useState(new Set());
  const [selectedFiles,   setSelectedFiles]  = useState({});  // orderId → File
  const [uploadErrors,    setUploadErrors]   = useState({});  // orderId → message
  const compFileRef = useRef(null);
  const [pendingOrderId,  setPendingOrderId] = useState(null);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session) return;
    
    // First, fetch the orders
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));

    // Fallback verification for Mercado Pago redirects (great for local environments without webhook tunnels)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isPaymentSuccess = params.get('payment') === 'success' || params.get('status') === 'approved';
      const paymentId = params.get('payment_id') || params.get('collection_id');
      const extRef = params.get('external_reference');

      if (isPaymentSuccess && paymentId && extRef) {
        fetch('/api/checkout/mp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_id: paymentId, external_reference: extRef }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.verified) {
              // Re-fetch orders to show updated "Pago exitoso" state
              fetch('/api/orders')
                .then(r => r.json())
                .then(d => setOrders(Array.isArray(d) ? d : []));
              
              // Clear query parameters from the address bar for clean UX
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch(() => {});
      }
    }
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

  function handleComprobanteClick(orderId) {
    setPendingOrderId(orderId);
    compFileRef.current?.click();
  }

  async function handleFileSelected(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !pendingOrderId) return;
    const orderId = pendingOrderId;
    setPendingOrderId(null);
    setUploadingId(orderId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res  = await fetch(`/api/orders/${orderId}/comprobante`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir');
      setUploadDoneIds(prev => new Set([...prev, orderId]));
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'comprobante_enviado' } : o));
      setDetails(prev => prev[orderId]
        ? { ...prev, [orderId]: { ...prev[orderId], comprobante_url: data.url, status: 'comprobante_enviado' } }
        : prev,
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingId(null);
    }
  }

  async function handleUploadFile(orderId) {
    const file = selectedFiles[orderId];
    if (!file) return;
    setUploadingId(orderId);
    setUploadErrors(prev => { const n = { ...prev }; delete n[orderId]; return n; });
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res  = await fetch(`/api/orders/${orderId}/comprobante`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir');
      setUploadDoneIds(prev => new Set([...prev, orderId]));
      setSelectedFiles(prev => { const n = { ...prev }; delete n[orderId]; return n; });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'comprobante_enviado' } : o));
      setDetails(prev => prev[orderId]
        ? { ...prev, [orderId]: { ...prev[orderId], comprobante_url: data.url, status: 'comprobante_enviado' } }
        : prev,
      );
    } catch (err) {
      setUploadErrors(prev => ({ ...prev, [orderId]: err.message }));
    } finally {
      setUploadingId(null);
    }
  }

  function needsComprobante(order) {
    if (order.payment_method !== 'transfer') return false;
    if (uploadDoneIds.has(order.id)) return false;
    const blockedStatuses = ['pago_recibido', 'preparando_pedido', 'en_camino', 'listo_para_retirar', 'entregado', 'cancelado', 'confirmed', 'delivered', 'cancelled'];
    return !blockedStatuses.includes(order.status);
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
      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.65rem', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
        {STATUS_LABEL[status] || status}
      </span>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-light)', fontFamily: 'var(--font-sans)' }}>
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*,application/pdf"
        ref={compFileRef}
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {/* Header */}
      <div style={{ background: '#0f0f0f' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px clamp(1.2rem, 4vw, 2.5rem)' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', letterSpacing: '0.08em', color: '#fff', marginBottom: '16px' }}>
              TnB<span style={{ color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.18em', marginLeft: '6px' }}>Try & Buy</span>
            </div>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: '1.6rem', color: '#fff', margin: '0 0 16px' }}>
            Mis pedidos
          </h1>
          <div style={{
            display: 'flex', gap: '24px',
            borderBottom: '0.5px solid rgba(255,255,255,0.1)', paddingBottom: '0',
            overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
          }}>
            {[
              { label: 'Mi perfil', href: '/profile' },
              { label: 'Mis pedidos', href: '/profile/orders' },
              { label: 'Mis beneficios', href: '/profile/benefits' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} style={{
                fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: href === '/profile/orders' ? '#fff' : 'rgba(255,255,255,0.45)',
                textDecoration: 'none', paddingBottom: '12px',
                borderBottom: href === '/profile/orders' ? '1.5px solid #fff' : 'none',
                flexShrink: 0,
              }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Order list */}
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
              const isTransferPending = order.status === 'comprobante_pendiente' && !uploadDoneIds.has(order.id);
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

                  {/* Alert for pending comprobante */}
                  {isTransferPending && (
                    <div style={{ margin: '0 20px 12px', padding: '10px 14px', background: '#fef3c7', border: '0.5px solid #fcd34d', borderRadius: '4px', fontSize: '0.78rem', color: '#92400e' }}>
                      <strong>Tu pago está pendiente.</strong> Subí el comprobante de transferencia para continuar.{' '}
                      <button
                        onClick={() => handleComprobanteClick(order.id)}
                        disabled={uploadingId === order.id}
                        style={{ marginLeft: '8px', padding: '4px 12px', background: '#92400e', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'var(--font-sans)' }}
                      >
                        {uploadingId === order.id ? 'Subiendo...' : 'Subir comprobante'}
                      </button>
                    </div>
                  )}

                  {expanded === order.id && (
                    <div style={{ borderTop: '0.5px solid #e0dbd4', padding: '16px 20px' }}>
                      {/* Status description */}
                      <div style={{ marginBottom: '16px', padding: '10px 14px', background: (STATUS_COLOR[order.status] || { bg: '#f5f3f0' }).bg, borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '3px' }}>Estado del pedido</div>
                        <div style={{ fontSize: '0.82rem', color: '#0f0f0f' }}>{statusDesc}</div>
                      </div>

                      {/* Comprobante — solo para órdenes de transferencia */}
                      {order.payment_method === 'transfer' && details[order.id] && (
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '8px' }}>
                            Comprobante de pago
                          </div>

                          {details[order.id].comprobante_url || uploadDoneIds.has(order.id) ? (
                            /* Ya enviado */
                            <div style={{ padding: '10px 14px', background: '#e8f5e9', border: '0.5px solid #a5d6a7', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', fontSize: '0.82rem', color: '#2e7d32' }}>
                              <span>✓ Comprobante enviado</span>
                              {details[order.id].comprobante_url && (
                                <a
                                  href={details[order.id].comprobante_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: '0.72rem', color: '#166534', textDecoration: 'underline', whiteSpace: 'nowrap' }}
                                >
                                  Ver archivo
                                </a>
                              )}
                            </div>
                          ) : (
                            /* Formulario de subida */
                            <div style={{ padding: '14px', background: '#fef3c7', border: '0.5px solid #fcd34d', borderRadius: '4px' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#92400e', marginBottom: '10px' }}>
                                Aún no subiste tu comprobante de pago
                              </div>

                              {uploadErrors[order.id] && (
                                <p style={{ fontSize: '0.72rem', color: '#c0392b', margin: '0 0 8px' }}>
                                  {uploadErrors[order.id]}
                                </p>
                              )}

                              {/* File input */}
                              <label style={{ display: 'block', cursor: 'pointer', marginBottom: '8px' }}>
                                <div style={{
                                  padding: '9px 12px', border: '0.5px dashed #fcd34d', background: '#fff',
                                  borderRadius: '3px', fontSize: '0.75rem', color: '#92400e',
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                                }}>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {selectedFiles[order.id] ? `📎 ${selectedFiles[order.id].name}` : '+ Seleccionar imagen o PDF'}
                                  </span>
                                  {selectedFiles[order.id] && (
                                    <button
                                      type="button"
                                      onClick={e => { e.preventDefault(); setSelectedFiles(prev => { const n = { ...prev }; delete n[order.id]; return n; }); }}
                                      style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', padding: 0, fontSize: '0.75rem' }}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  style={{ display: 'none' }}
                                  onChange={e => {
                                    if (e.target.files[0]) {
                                      setSelectedFiles(prev => ({ ...prev, [order.id]: e.target.files[0] }));
                                      setUploadErrors(prev => { const n = { ...prev }; delete n[order.id]; return n; });
                                    }
                                    e.target.value = '';
                                  }}
                                />
                              </label>

                              <button
                                onClick={() => handleUploadFile(order.id)}
                                disabled={!selectedFiles[order.id] || uploadingId === order.id}
                                style={{
                                  width: '100%', padding: '10px', borderRadius: '3px', border: 'none',
                                  background: (!selectedFiles[order.id] || uploadingId === order.id) ? '#ccc' : '#92400e',
                                  color: '#fff', cursor: (!selectedFiles[order.id] || uploadingId === order.id) ? 'not-allowed' : 'pointer',
                                  fontSize: '0.78rem', fontFamily: 'var(--font-sans)', fontWeight: 600,
                                  letterSpacing: '0.06em', textTransform: 'uppercase', boxSizing: 'border-box',
                                }}
                              >
                                {uploadingId === order.id ? 'Subiendo...' : 'Subir comprobante'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pickup point */}
                      {details[order.id]?.pickup_point_name && (
                        <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: '4px' }}>
                          <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#166534', marginBottom: '3px' }}>Punto de retiro</div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#0f0f0f' }}>{details[order.id].pickup_point_name}</div>
                        </div>
                      )}

                      {/* Products */}
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
                                <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
                                  {item.name}
                                  {item.size && (
                                    <span style={{ marginLeft: '8px', padding: '2px 6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', fontSize: '0.68rem', color: '#6b6560', fontWeight: 500 }}>
                                      Talle: {item.size}
                                    </span>
                                  )}
                                  {item.color && (
                                    <span style={{ marginLeft: '8px', padding: '2px 6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', fontSize: '0.68rem', color: '#6b6560', fontWeight: 500 }}>
                                      Color: {item.color}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#6b6560' }}>
                                  Cantidad: {item.quantity} · ${parseFloat(item.price_at_purchase).toFixed(2)} c/u
                                </div>
                              </div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                ${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          ))}

                          {/* Factura download (P4) */}
                          {details[order.id]?.factura_url && (
                            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '0.5px solid #f0ede8' }}>
                              <a
                                href={details[order.id].factura_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  padding: '8px 16px', background: '#0f0f0f', color: '#fff',
                                  borderRadius: '3px', textDecoration: 'none', fontSize: '0.72rem',
                                  letterSpacing: '0.08em', textTransform: 'uppercase',
                                }}
                              >
                                📄 Ver factura
                              </a>
                            </div>
                          )}

                          {/* Contact store via WA */}
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
