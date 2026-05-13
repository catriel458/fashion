'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const STATUS_COLORS = { confirmed: '#2e7d32', pending: '#e67e22', cancelled: '#c0392b' };
const STATUS_LABEL  = { confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada' };

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '20px 22px', borderTop: `3px solid ${accent || '#1a0a2e'}` }}>
      <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: '#0f0f0f', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: '#6b6560', marginTop: '6px' }}>{sub}</div>}
    </div>
  );
}

function StoreCard({ store }) {
  const color = store.primary_color || '#009aae';
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', overflow: 'hidden' }}>
      <div style={{ height: '4px', background: color }} />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{store.name}</div>
            <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '20px', background: store.active ? '#e8f5e9' : '#f5f5f5', color: store.active ? '#2e7d32' : '#9e9e9e' }}>
              {store.active ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          <Link href={`/superadmin/stores/${store.id}/edit`} style={{ fontSize: '0.65rem', color: '#6b6560', textDecoration: 'none', border: '0.5px solid #e0dbd4', padding: '4px 8px', borderRadius: '2px' }}>
            Editar
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Ingresos', value: `$${parseFloat(store.revenue).toFixed(0)}` },
            { label: 'Órdenes',  value: store.confirmed_orders },
            { label: 'Productos', value: store.active_products },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', padding: '8px 4px', background: '#fafaf8', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.6rem', color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 300, color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SuperadminDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetch('/api/superadmin/dashboard')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '3rem', color: '#6b6560', fontFamily: 'var(--font-sans)' }}>Cargando...</div>;
  if (error)   return <div style={{ padding: '3rem', color: '#c0392b', fontFamily: 'var(--font-sans)' }}>{error}</div>;

  const { summary, stores, recent_orders, chart_days } = data;

  return (
    <div style={{ padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)', fontFamily: 'var(--font-sans)' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 4px', letterSpacing: '0.02em' }}>
        Dashboard Global
      </h1>
      <p style={{ color: '#6b6560', fontSize: '0.8rem', margin: '0 0 32px' }}>
        Resumen de todas las tiendas
      </p>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px', marginBottom: '36px' }}>
        <StatCard label="Tiendas activas" value={stores.filter(s => s.active).length} sub={`${summary.stores} en total`} accent="#1a0a2e" />
        <StatCard label="Ingresos totales" value={`$${summary.revenue.toFixed(0)}`} sub="órdenes confirmadas" accent="#2e7d32" />
        <StatCard label="Órdenes confirmadas" value={summary.orders} accent="#e67e22" />
        <StatCard label="Productos activos" value={summary.products} accent="#009aae" />
        <StatCard label="Usuarios" value={summary.users} sub="visitantes registrados" accent="#7c3aed" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '20px' }}>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '16px' }}>
            Órdenes últimos 30 días (todas las tiendas)
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chart_days} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
              <Tooltip formatter={v => [v, 'Órdenes']} />
              <Line type="monotone" dataKey="orders" stroke="#1a0a2e" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '20px' }}>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '16px' }}>
            Ingresos por tienda
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stores} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip formatter={v => [`$${parseFloat(v).toFixed(0)}`, 'Ingresos']} />
              <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                {stores.map((s, i) => <Cell key={i} fill={s.primary_color || '#009aae'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-store cards */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '14px' }}>
          Por tienda
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {stores.map(store => <StoreCard key={store.id} store={store} />)}
        </div>
      </div>

      {/* Recent orders */}
      <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #e0dbd4' }}>
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' }}>
            Últimas 15 órdenes — todas las tiendas
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f5f3f0' }}>
                {['#', 'Tienda', 'Usuario', 'Total', 'Estado', 'Fecha'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent_orders.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#6b6560' }}>Sin órdenes todavía</td></tr>
              ) : recent_orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '0.5px solid #e0dbd4' }}>
                  <td style={{ padding: '11px 16px', color: '#6b6560' }}>#{order.id}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: order.store_color || '#009aae', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem' }}>{order.store_name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 16px', color: '#6b6560' }}>{order.username || order.email || '—'}</td>
                  <td style={{ padding: '11px 16px', fontWeight: 500 }}>${parseFloat(order.total).toFixed(2)}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '0.62rem', background: order.status === 'confirmed' ? '#e8f5e9' : order.status === 'cancelled' ? '#fef2f2' : '#fff8e1', color: STATUS_COLORS[order.status] || '#6b6560' }}>
                      {STATUS_LABEL[order.status] || order.status}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px', color: '#6b6560', fontSize: '0.75rem' }}>{new Date(order.created_at).toLocaleDateString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
