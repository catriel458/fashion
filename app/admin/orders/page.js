'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const STATUS_LABEL = {
  pending:   'Pendiente',
  confirmed: 'Confirmado',
  delivered: 'Vendido',
  cancelled: 'Cancelado',
};
const STATUS_COLOR = {
  pending:   { bg: '#fff8e1', color: '#e67e22' },
  confirmed: { bg: '#e3f2fd', color: '#1565c0' },
  delivered: { bg: '#e8f5e9', color: '#1b5e20' },
  cancelled: { bg: '#fef2f2', color: '#c0392b' },
};

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
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search,     setSearch]     = useState('');
  const [selected,   setSelected]   = useState(null);
  const [detail,     setDetail]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveOk,     setSaveOk]     = useState('');
  const [sendingMail, setSendingMail] = useState(false);

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
    try {
      const res  = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetail(data);
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

  const containerStyle = { padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)', fontFamily: 'var(--font-sans)' };

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

      {/* Filtros */}
      <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inp, minWidth: '160px' }}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por cliente o # orden"
          style={{ ...inp, minWidth: '200px', flex: 1 }}
        />
      </div>

      {/* Layout: lista + detalle */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: '20px', alignItems: 'start' }}>

        {/* Lista de pedidos */}
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

        {/* Panel de detalle */}
        {selected && (
          <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '20px', position: 'sticky', top: '20px' }}>
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

                {/* Comprador */}
                <div style={{ marginBottom: '14px', padding: '12px', background: '#f5f3f0', borderRadius: '4px', fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    {detail.first_name && detail.last_name ? `${detail.first_name} ${detail.last_name}` : detail.username || 'Cliente'}
                  </div>
                  <div style={{ color: '#6b6560' }}>{detail.email}</div>
                  <div style={{ marginTop: '6px' }}><StatusBadge status={detail.status} /></div>
                </div>

                {/* Productos */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '8px' }}>Productos</div>
                  {(detail.items || []).map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      {item.image_url
                        ? <img src={item.image_url} alt={item.name} style={{ width: '40px', height: '48px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
                        : <div style={{ width: '40px', height: '48px', background: '#f0ede8', borderRadius: '3px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👕</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
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

                {/* Cambiar estado */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '6px' }}>
                    Estado
                  </label>
                  <select
                    value={detail.status}
                    onChange={e => handleStatusChange(detail.id, e.target.value)}
                    disabled={saving}
                    style={{ ...inp, width: '100%' }}
                  >
                    {Object.entries(STATUS_LABEL).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Notas del admin */}
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

                {/* Punto de retiro */}
                {detail.pickup_point_name && (
                  <div style={{ marginBottom: '14px', padding: '10px 12px', background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#166534', marginBottom: '3px' }}>Punto de retiro</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{detail.pickup_point_name}</div>
                  </div>
                )}

                {/* Botón mandar mail */}
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
