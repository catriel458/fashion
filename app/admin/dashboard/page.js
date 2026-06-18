'use client';
import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_COLORS = {
  pending:   '#e67e22',
  confirmed: '#1565c0',
  ready:     '#2e7d32',
  delivered: '#1b5e20',
  cancelled: '#c0392b',
};
const PIE_COLORS = ['#e67e22', '#1565c0', '#2e7d32', '#1b5e20', '#c0392b'];

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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categorySearch, setCategorySearch]     = useState('');

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return; }
        setData(d);
        setLoading(false);
      })
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

  const statusLabel = { pending: 'Pendientes', confirmed: 'Confirmados', ready: 'Listos', delivered: 'Vendidos', cancelled: 'Cancelados' };

  // Group product-level sales by category name for summary
  const categorySummaryMap = {};
  if (data && data.category_sales) {
    data.category_sales.forEach(item => {
      const catName = item.category_name;
      if (!categorySummaryMap[catName]) {
        categorySummaryMap[catName] = { category_name: catName, units_sold: 0, revenue: 0 };
      }
      categorySummaryMap[catName].units_sold += item.units_sold;
      categorySummaryMap[catName].revenue += parseFloat(item.revenue);
    });
  }
  const categorySummaries = Object.values(categorySummaryMap).sort((a, b) => b.units_sold - a.units_sold);

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
        <StatCard label="Pedidos hoy" value={data.orders.today} sub="excluye cancelados" />
        <StatCard
          label="Pendientes"
          value={data.orders.pending}
          sub={data.orders.pending > 5 ? '⚠️ Muchos pendientes' : 'sin confirmar'}
        />
        <StatCard label="Listos para retirar" value={data.orders.ready} sub="esperando cliente" />
        <StatCard label="Ingresos del mes" value={`$${parseFloat(data.revenue.this_month).toFixed(0)}`} sub="pedidos entregados" />
        <StatCard label="Ingresos Totales" value={`$${parseFloat(data.revenue.total).toFixed(0)}`} sub="histórico acumulado" />
        <StatCard
          label="Ticket Promedio"
          value={`$${data.revenue.delivered_count > 0 ? (data.revenue.total / data.revenue.delivered_count).toFixed(0) : '0'}`}
          sub="promedio por compra"
        />
        <StatCard label="Productos activos" value={data.products.active} />
        <StatCard label="Sin stock" value={data.products.out_of_stock} sub="en 0 unidades" />
        <StatCard label="Uso Probador IA" value={data.fitting_usage_total} sub="simulaciones hechas" />
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

      {/* Charts row 3: Desires vs Sales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '36px' }}>
        {/* Top wishlisted */}
        <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '20px' }}>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '16px' }}>
            Top 5 productos más deseados (Favoritos)
          </div>
          {(!data.top_wishlisted || data.top_wishlisted.length === 0) ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6560', fontSize: '0.8rem' }}>
              Sin productos en favoritos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.top_wishlisted} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 9 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={90} />
                <Tooltip formatter={(v) => [v, 'Favoritos']} />
                <Bar dataKey="count" fill="#d97706" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* IA Fitting usage summary */}
        <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '16px' }}>
              Rendimiento del Probador IA
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '10px' }}>
              <span style={{ fontSize: '3rem', fontWeight: 300, fontFamily: 'var(--font-serif)' }}>
                {data.fitting_usage_total}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#6b6560' }}>
                simulaciones totales
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#6b6560', lineHeight: 1.5, marginTop: '16px' }}>
              El probador virtual con IA impulsa la decisión de compra en tu tienda. Los clientes interactúan visualmente con tus prendas de forma interactiva antes de agregarlas al carrito.
            </p>
          </div>
          <div style={{ borderTop: '0.5px solid #e0dbd4', paddingTop: '14px', marginTop: '14px', fontSize: '0.78rem', color: '#6b6560' }}>
            💡 Un alto número de simulaciones indica un catálogo interactivo atractivo para tus clientes.
          </div>
        </div>
      </div>

      {/* ── SECCIÓN ESTADÍSTICAS POR CATEGORÍA ── */}
      <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', margin: 0 }}>
              Estadísticas por Categoría y Productos
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#888', margin: '4px 0 0 0' }}>
              Unidades vendidas y ganancias totales
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Category select filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '0.5px solid #e0dbd4',
                borderRadius: '4px',
                fontSize: '0.78rem',
                outline: 'none',
                background: '#fafaf8',
                fontFamily: 'var(--font-sans)',
                color: '#1a1a1a',
              }}
            >
              <option value="">Todas las categorías</option>
              {categorySummaries.map(cat => (
                <option key={cat.category_name} value={cat.category_name}>
                  {cat.category_name}
                </option>
              ))}
            </select>

            {/* Category search input (only visible when showing category overview) */}
            {!selectedCategory && (
              <input
                type="text"
                placeholder="Buscar categoría..."
                value={categorySearch}
                onChange={e => setCategorySearch(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '0.5px solid #e0dbd4',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  background: '#fafaf8',
                  width: '150px',
                }}
              />
            )}
          </div>
        </div>

        {/* Display either Category Summaries or Product Breakdown */}
        <div style={{ overflowX: 'auto' }}>
          {!selectedCategory ? (
            // ── CATEGORY SUMMARIES ──
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f5f3f0' }}>
                  {['Categoría', 'Unidades Vendidas', 'Porcentaje del total', 'Ganancia Total'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 400 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categorySummaries.filter(cat => cat.category_name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#6b6560' }}>
                      Sin datos de categorías
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const filtered = categorySummaries.filter(cat => cat.category_name.toLowerCase().includes(categorySearch.toLowerCase()));
                    const maxUnits = Math.max(...categorySummaries.map(c => c.units_sold), 1);
                    return filtered.map(cat => (
                      <tr key={cat.category_name} style={{ borderBottom: '0.5px solid #e0dbd4' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>{cat.category_name}</td>
                        <td style={{ padding: '12px 16px' }}>{cat.units_sold}</td>
                        <td style={{ padding: '12px 16px', width: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ minWidth: '32px', fontSize: '0.75rem', color: '#6b6560' }}>
                              {((cat.units_sold / maxUnits) * 100).toFixed(0)}%
                            </span>
                            <div style={{ flex: 1, background: '#f5f3f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{
                                background: '#1a1a1a',
                                height: '100%',
                                width: `${(cat.units_sold / maxUnits) * 100}%`
                              }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: '#2e7d32' }}>
                          ${cat.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ));
                  })()
                )}
              </tbody>
            </table>
          ) : (
            // ── DETAILED PRODUCTS BREAKDOWN FOR SELECTED CATEGORY ──
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f5f3f0' }}>
                  {['Producto', 'Categoría', 'Unidades Vendidas', 'Ganancia Total'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 400 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredProducts = (data?.category_sales || []).filter(item => item.category_name === selectedCategory);
                  if (filteredProducts.length === 0) {
                    return (
                      <tr>
                        <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#6b6560' }}>
                          No hay productos vendidos en esta categoría
                        </td>
                      </tr>
                    );
                  }
                  return filteredProducts.map((prod, idx) => (
                    <tr key={idx} style={{ borderBottom: '0.5px solid #e0dbd4' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{prod.product_name}</td>
                      <td style={{ padding: '12px 16px', color: '#6b6560' }}>{prod.category_name}</td>
                      <td style={{ padding: '12px 16px' }}>{prod.units_sold}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: '#2e7d32' }}>
                        ${parseFloat(prod.revenue).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          )}
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
                  <tr
                    key={order.id}
                    style={{ borderBottom: '0.5px solid #e0dbd4', cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/orders'}
                  >
                    <td style={{ padding: '12px 16px', color: '#6b6560' }}>#{order.id}</td>
                    <td style={{ padding: '12px 16px' }}>{order.username || order.email || '—'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>${parseFloat(order.total).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '20px', fontSize: '0.65rem',
                        background: { pending: '#fff8e1', confirmed: '#e3f2fd', ready: '#e8f5e9', delivered: '#e8f5e9', cancelled: '#fef2f2' }[order.status] || '#f5f3f0',
                        color: STATUS_COLORS[order.status] || '#6b6560',
                      }}>
                        {statusLabel[order.status] || order.status}
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
