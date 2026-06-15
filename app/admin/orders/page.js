'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

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
  // Legacy
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

// Returns valid next statuses for admin to advance to
function getNextStatuses(currentStatus, deliveryMethod) {
  const isDelivery = deliveryMethod === 'delivery';
  const map = {
    pendiente_pago:        ['pago_recibido', 'cancelado'],
    comprobante_pendiente: ['pago_recibido', 'cancelado'],
    comprobante_enviado:   ['pago_recibido', 'cancelado'],
    pago_recibido:         ['preparando_pedido', 'cancelado'],
    preparando_pedido:     [isDelivery ? 'en_camino' : 'listo_para_retirar', 'cancelado'],
    en_camino:             ['entregado', 'cancelado'],
    listo_para_retirar:    ['entregado', 'cancelado'],
    entregado:             [],
    cancelado:             [],
    // Legacy fallbacks
    pending:    ['pago_recibido', 'cancelado'],
    confirmed:  ['preparando_pedido', 'cancelado'],
    ready:      ['entregado', 'cancelado'],
    delivered:  [],
    cancelled:  [],
  };
  return map[currentStatus] ?? [];
}

const inp = { padding: '8px 11px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', outline: 'none', borderRadius: '2px', color: '#0f0f0f' };

function StatusBadge({ status }) {
  const s = STATUS_COLOR[status] || { bg: '#f5f3f0', color: '#6b6560' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.65rem', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export default function AdminOrdersPage() {
  const { data: session } = useSession();
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [search,        setSearch]        = useState('');
  const [selected,      setSelected]      = useState(null);
  const [detail,        setDetail]        = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [saveOk,        setSaveOk]        = useState('');
  const [sendingMail,   setSendingMail]   = useState(false);
  const [waPhone,       setWaPhone]       = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search.trim()) params.set('search', search.trim());
    try {
      const res  = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function openDetail(orderId) {
    setSelected(orderId);
    setDetail(null);
    setDetailLoading(true);
    setWaPhone('');
    try {
      const res  = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetail(data);
      setWaPhone(data.buyer_whatsapp || '');
    } catch (e) { setError(e.message); }
    finally { setDetailLoading(false); }
  }

  async function handleStatusChange(orderId, newStatus) {
    setSaving(true); setSaveOk('');
    try {
      const res  = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetail(prev => prev ? { ...prev, status: data.status } : prev);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: data.status } : o));
      setSaveOk('Estado actualizado');
      setTimeout(() => setSaveOk(''), 3000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleSendMail() {
    if (!detail) return;
    setSendingMail(true); setSaveOk('');
    try {
      const res = await fetch(`/api/admin/orders/${detail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ send_email: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaveOk('Mail enviado al comprador');
      setTimeout(() => setSaveOk(''), 4000);
    } catch (e) { setError(e.message); }
    finally { setSendingMail(false); }
  }

  async function handleSaveNotes() {
    if (!detail) return;
    setSaving(true); setSaveOk('');
    try {
      const res  = await fetch(`/api/admin/orders/${detail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: detail.admin_notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaveOk('Notas guardadas');
      setTimeout(() => setSaveOk(''), 3000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  function handleNotifyWhatsApp() {
    if (!detail) return;
    const phone = waPhone.replace(/\D/g, '');
    if (!phone) return;

    const buyerName = detail.first_name && detail.last_name
      ? `${detail.first_name} ${detail.last_name}`
      : detail.username || 'Cliente';

    const itemsStr = (detail.items || [])
      .map(i => `• ${i.quantity}x ${i.name}${i.size ? ` (Talle: ${i.size})` : ''} — $${(parseFloat(i.price_at_purchase) * i.quantity).toFixed(2)}`)
      .join('\n');

    const paymentLabel = detail.payment_method === 'mp' ? 'Mercado Pago' : 'Transferencia bancaria';

    let deliveryInfo = '';
    if (detail.delivery_method === 'delivery' && detail.delivery_address) {
      deliveryInfo = `📍 Envío a: ${detail.delivery_address}`;
    } else if (detail.pickup_point_name) {
      deliveryInfo = `📍 Retiro en: ${detail.pickup_point_name}`;
    }

    const statusMsg = {
      pago_recibido:      'Recibimos tu pago. Tu pedido está siendo procesado.',
      preparando_pedido:  'Estamos preparando tu pedido.',
      en_camino:          'Tu pedido está en camino hacia vos.',
      listo_para_retirar: 'Tu pedido está listo para retirar.',
      entregado:          '¡Tu pedido fue entregado! Gracias por tu compra.',
      comprobante_enviado:'Recibimos tu comprobante. Lo estamos verificando.',
    }[detail.status] || 'Tu pedido está siendo procesado.';

    const msg = [
      `Hola ${buyerName}! 👋`,
      '',
      `Te confirmamos tu pedido #${detail.id}.`,
      '',
      `📦 Productos:`,
      itemsStr,
      '',
      `💰 Total: $${parseFloat(detail.total).toFixed(2)}`,
      `💳 Pago: ${paymentLabel}`,
      deliveryInfo,
      '',
      statusMsg,
    ].filter(l => l !== undefined).join('\n').replace(/\n{3,}/g, '\n\n');

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  const containerStyle = { padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)', fontFamily: 'var(--font-sans)' };

  const allStatuses = Object.entries(STATUS_LABEL)
    .filter(([k]) => !['pending','confirmed','ready','delivered','cancelled'].includes(k));

  return (
    <div style={containerStyle}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 8px' }}>
        Pedidos
      </h1>
      <p style={{ color: '#6b6560', fontSize: '0.8rem', margin: '0 0 24px' }}>
        Gestioná los pedidos de tu tienda
      </p>

      {error && (
        <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', color: '#c0392b', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inp, minWidth: '200px' }}>
          <option value="">Todos los estados</option>
          {allStatuses.map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
          <option value="pending">Pendiente (legacy)</option>
          <option value="confirmed">Confirmado (legacy)</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por cliente o # orden"
          style={{ ...inp, minWidth: '200px', flex: 1 }}
        />
      </div>

      {/* Layout: list + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: '20px', alignItems: 'start' }}>

        {/* Orders list */}
        <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f5f3f0' }}>
                  {['#', 'Cliente', 'Items', 'Total', 'Estado', 'Fecha'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 400 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#6b6560' }}>Cargando...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#6b6560' }}>Sin pedidos</td></tr>
                ) : (
                  orders.map(order => (
                    <tr
                      key={order.id}
                      onClick={() => openDetail(order.id)}
                      style={{
                        borderBottom: '0.5px solid #e0dbd4', cursor: 'pointer',
                        background: selected === order.id ? '#f5f3f0' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ padding: '12px 14px', color: '#6b6560' }}>#{order.id}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 500 }}>{order.first_name && order.last_name ? `${order.first_name} ${order.last_name}` : order.username || '—'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#6b6560' }}>{order.email}</div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#6b6560' }}>{order.item_count} producto(s)</td>
                      <td style={{ padding: '12px 14px', fontWeight: 500 }}>${parseFloat(order.total).toFixed(2)}</td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge status={order.status} /></td>
                      <td style={{ padding: '12px 14px', color: '#6b6560', fontSize: '0.75rem' }}>
                        {new Date(order.created_at).toLocaleDateString('es-AR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '20px', position: 'sticky', top: '20px', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.1rem', margin: 0 }}>
                Pedido #{selected}
              </h2>
              <button onClick={() => { setSelected(null); setDetail(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6560', fontSize: '1rem' }}>✕</button>
            </div>

            {detailLoading ? (
              <div style={{ color: '#6b6560', fontSize: '0.82rem', padding: '16px 0' }}>Cargando...</div>
            ) : detail ? (
              <>
                {saveOk && <div style={{ background: '#e8f5e9', border: '0.5px solid #a5d6a7', padding: '8px 12px', borderRadius: '3px', marginBottom: '12px', color: '#2e7d32', fontSize: '0.75rem' }}>{saveOk}</div>}

                {/* Buyer info */}
                <div style={{ marginBottom: '14px', padding: '12px', background: '#f5f3f0', borderRadius: '4px', fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    {detail.first_name && detail.last_name ? `${detail.first_name} ${detail.last_name}` : detail.username || 'Cliente'}
                  </div>
                  <div style={{ color: '#6b6560' }}>{detail.email}</div>
                  <div style={{ marginTop: '6px' }}><StatusBadge status={detail.status} /></div>
                </div>

                {/* Comprobante de pago — solo para órdenes de transferencia */}
                {detail.payment_method === 'transfer' && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '6px' }}>
                      Comprobante de pago
                    </div>
                    {detail.comprobante_url ? (
                      <div style={{ padding: '10px 12px', background: '#fffbeb', border: '0.5px solid #fcd34d', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                        <span style={{ color: '#92400e', fontWeight: 500 }}>✓ Comprobante recibido</span>
                        <a
                          href={detail.comprobante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ padding: '4px 12px', background: '#92400e', color: '#fff', borderRadius: '3px', textDecoration: 'none', fontSize: '0.7rem', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}
                        >
                          Ver comprobante
                        </a>
                      </div>
                    ) : (
                      <div style={{ padding: '10px 12px', background: '#f5f3f0', border: '0.5px solid #e0dbd4', borderRadius: '4px', fontSize: '0.78rem', color: '#6b6560' }}>
                        Sin comprobante aún
                      </div>
                    )}
                  </div>
                )}

                {/* Factura link */}
                {detail.factura_url && (
                  <div style={{ marginBottom: '14px', padding: '10px 12px', background: '#e8f5e9', border: '0.5px solid #a5d6a7', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <span style={{ color: '#2e7d32' }}>Factura generada</span>
                    <a href={detail.factura_url} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#2e7d32', fontSize: '0.72rem', textDecoration: 'underline' }}>
                      Ver factura
                    </a>
                  </div>
                )}

                {/* Products */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '8px' }}>Productos</div>
                  {(detail.items || []).map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      {item.image_url
                        ? <img src={item.image_url} alt={item.name} style={{ width: '40px', height: '48px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
                        : <div style={{ width: '40px', height: '48px', background: '#f0ede8', borderRadius: '3px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👕</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{item.name}</span>
                          {item.size && (
                            <span style={{ padding: '2px 5px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', fontSize: '0.62rem', color: '#6b6560', fontWeight: 500 }}>
                              {item.size}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#6b6560' }}>x{item.quantity} · ${parseFloat(item.price_at_purchase).toFixed(2)} c/u</div>
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
                        ${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: '0.5px solid #e0dbd4', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.875rem' }}>
                    <span>Total</span>
                    <span>${parseFloat(detail.total).toFixed(2)}</span>
                  </div>
                </div>

                {/* Pickup point */}
                {detail.pickup_point_name && (
                  <div style={{ marginBottom: '14px', padding: '10px 12px', background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#166534', marginBottom: '3px' }}>Punto de retiro</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{detail.pickup_point_name}</div>
                  </div>
                )}

                {/* Status change — forward-only */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '6px' }}>
                    Avanzar estado
                  </label>
                  {(() => {
                    const nexts = getNextStatuses(detail.status, detail.delivery_method);
                    if (nexts.length === 0) {
                      return (
                        <p style={{ fontSize: '0.75rem', color: '#6b6560', margin: 0 }}>
                          Estado final — sin más cambios posibles.
                        </p>
                      );
                    }
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {nexts.map(s => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(detail.id, s)}
                            disabled={saving}
                            style={{
                              padding: '6px 14px',
                              background: s === 'cancelado' ? '#fef2f2' : '#f5f3f0',
                              border: `0.5px solid ${s === 'cancelado' ? '#fecaca' : '#e0dbd4'}`,
                              color: s === 'cancelado' ? '#c0392b' : '#0f0f0f',
                              borderRadius: '3px', cursor: saving ? 'not-allowed' : 'pointer',
                              fontSize: '0.72rem', fontFamily: 'var(--font-sans)',
                              letterSpacing: '0.06em',
                            }}
                          >
                            {STATUS_LABEL[s] || s}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Admin notes */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '6px' }}>
                    Notas internas
                  </label>
                  <textarea
                    value={detail.admin_notes || ''}
                    onChange={e => setDetail(prev => ({ ...prev, admin_notes: e.target.value }))}
                    rows={3}
                    style={{ ...inp, width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
                    placeholder="Notas internas del pedido..."
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={saving}
                    style={{ marginTop: '6px', padding: '7px 14px', background: saving ? '#ccc' : '#0f0f0f', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '0.7rem', letterSpacing: '0.08em' }}
                  >
                    {saving ? 'Guardando...' : 'Guardar notas'}
                  </button>
                </div>

                {/* Notify via WhatsApp (P2) */}
                <div style={{ marginBottom: '14px', padding: '14px', background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#166534', marginBottom: '8px' }}>
                    Notificar por WhatsApp
                  </div>
                  <input
                    type="tel"
                    value={waPhone}
                    onChange={e => setWaPhone(e.target.value)}
                    placeholder="Ej: 5491112345678"
                    style={{ ...inp, width: '100%', marginBottom: '8px', boxSizing: 'border-box' }}
                  />
                  <p style={{ fontSize: '0.65rem', color: '#6b6560', margin: '0 0 8px' }}>
                    Código de país + número sin espacios ni +
                  </p>
                  <button
                    onClick={handleNotifyWhatsApp}
                    disabled={!waPhone.replace(/\D/g, '')}
                    style={{
                      width: '100%', padding: '10px', background: !waPhone.replace(/\D/g, '') ? '#ccc' : '#25d366',
                      color: '#fff', border: 'none', borderRadius: '3px',
                      cursor: !waPhone.replace(/\D/g, '') ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Abrir WhatsApp con mensaje
                  </button>
                </div>

                {/* Send mail button */}
                <button
                  onClick={handleSendMail}
                  disabled={sendingMail}
                  style={{ width: '100%', marginBottom: '8px', padding: '10px', background: sendingMail ? '#ccc' : '#1565c0', color: '#fff', border: 'none', cursor: sendingMail ? 'not-allowed' : 'pointer', borderRadius: '2px', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                >
                  {sendingMail ? 'Enviando...' : 'Mandar mail al comprador'}
                </button>

                {detail.status_updated_at && (
                  <p style={{ fontSize: '0.65rem', color: '#6b6560', margin: '10px 0 0', textAlign: 'center' }}>
                    Última actualización: {new Date(detail.status_updated_at).toLocaleString('es-AR')}
                  </p>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
