'use client';
import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_COLORS = {
  confirmed: '#2e7d32',
  pending:   '#e67e22',
  cancelled: '#c0392b',
};
const PIE_COLORS = ['#2e7d32', '#e67e22', '#c0392b'];

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px',
      padding: '20px 22px',
    }}>
      <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: '#0f0f0f', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.7rem', color: '#6b6560', marginTop: '6px' }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Error al cargar datos'); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#6b6560', fontFamily: 'var(--font-sans)' }}>
      Cargando dashboard...
    </div>
  );
  if (error) return (
    <div style={{ padding: '3rem', color: '#c0392b', fontFamily: 'var(--font-sans)' }}>{error}</div>
  );

  const pieData = (data.orders.by_status || []).map(s => ({
    name: s.status,
    value: s.count,
  }));

  const statusLabel = { confirmed: 'Confirmadas', pending: 'Pendientes', cancelled: 'Canceladas' };

  return (
    <div style={{ padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)', fontFamily: 'var(--font-sans)' }}>

      <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 8px', letterSpacing: '0.02em' }}>
        Dashboard
      </h1>
      <p style={{ color: '#6b6560', fontSize: '0.8rem', margin: '0 0 32px' }}>
        Resumen general del negocio
      </p>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '36px' }}>
        <StatCard label="Usuarios totales" value={data.users.total} sub={`+${data.users.new_this_week} esta semana`} />
        <StatCard label="Órdenes totales" value={data.orders.total} />
        <StatCard label="Ingresos totales" value={`$${parseFloat(data.revenue.total).toFixed(0)}`} sub="órdenes confirmadas" />
        <StatCard label="Productos activos" value={data.products.active} />
        <StatCard label="Sin stock" value={data.products.out_of_stock} sub="productos en 0" />
        <StatCard label="Nuevos esta semana" value={data.users.new_this_week} sub="usuarios" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Orders per day */}
        <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '20px' }}>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '16px' }}>
            Órdenes últimos 30 días
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.orders.by_day} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v, 'Órdenes']} labelFormatter={l => l} />
              <Line type="monotone" dataKey="orders" stroke="#0f0f0f" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue per day */}
        <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '20px' }}>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '16px' }}>
            Ingresos últimos 30 días
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.orders.by_day} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip formatter={(v) => [`$${parseFloat(v).toFixed(2)}`, 'Ingresos']} />
              <Bar dataKey="revenue" fill="#0f0f0f" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '36px' }}>

        {/* Pie chart */}
        <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '20px' }}>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '16px' }}>
            Distribución de órdenes por estado
          </div>
          {pieData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6560', fontSize: '0.8rem' }}>
              Sin datos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${statusLabel[name] || name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, statusLabel[n] || n]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top products */}
        <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '20px' }}>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '16px' }}>
            Top 5 productos más vendidos
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.top_products} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 9 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={90} />
              <Tooltip formatter={(v) => [v, 'Vendidos']} />
              <Bar dataKey="total_sold" fill="#0f0f0f" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent orders table */}
      <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #e0dbd4' }}>
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' }}>
            Últimas 10 órdenes
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f5f3f0' }}>
                {['#', 'Usuario', 'Total', 'Estado', 'Fecha'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.orders.recent.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#6b6560' }}>
                    Sin órdenes todavía
                  </td>
                </tr>
              ) : (
                data.orders.recent.map(order => (
                  <tr key={order.id} style={{ borderBottom: '0.5px solid #e0dbd4' }}>
                    <td style={{ padding: '12px 16px', color: '#6b6560' }}>#{order.id}</td>
                    <td style={{ padding: '12px 16px' }}>{order.username || order.email || '—'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>${parseFloat(order.total).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '20px', fontSize: '0.65rem',
                        background: order.status === 'confirmed' ? '#e8f5e9' : order.status === 'cancelled' ? '#fef2f2' : '#fff8e1',
                        color: STATUS_COLORS[order.status] || '#6b6560',
                      }}>
                        {order.status === 'confirmed' ? 'Confirmada' : order.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b6560', fontSize: '0.78rem' }}>
                      {new Date(order.created_at).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
