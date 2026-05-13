'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const inputStyle = {
  padding: '9px 11px', border: '0.5px solid #e0dbd4', background: '#fff',
  fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none',
  borderRadius: '2px', boxSizing: 'border-box', color: '#0f0f0f',
};

export default function SuperadminProductsPage() {
  const [products,    setProducts]    = useState([]);
  const [stores,      setStores]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [error,       setError]       = useState('');

  useEffect(() => {
    fetch('/api/superadmin/stores')
      .then(r => r.json())
      .then(data => setStores(Array.isArray(data) ? data : []));
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStore) params.set('store_id', filterStore);
      if (search)      params.set('search', search);
      const res  = await fetch(`/api/superadmin/products?${params}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [filterStore, search]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(2.5rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem) 2.5rem' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 4px', letterSpacing: '0.02em' }}>
            Todos los productos
          </h1>
          <p style={{ margin: 0, color: '#6b6560', fontSize: '0.8rem' }}>
            {products.length} producto{products.length !== 1 ? 's' : ''} en total
          </p>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text" placeholder="Buscar por nombre..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, maxWidth: '280px' }}
          />
          <select
            value={filterStore} onChange={e => setFilterStore(e.target.value)}
            style={{ ...inputStyle, maxWidth: '220px' }}
          >
            <option value="">Todas las tiendas</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '12px 16px', borderRadius: '4px', marginBottom: '16px', color: '#c0392b', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: '#6b6560' }}>Cargando...</div>
        ) : (
          <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f0ede8' }}>
                    {['Imagen', 'Nombre', 'Tienda', 'Categoría', 'Precio', 'Stock', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 400, whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#6b6560' }}>
                        No hay productos
                      </td>
                    </tr>
                  ) : products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '0.5px solid #e0dbd4' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '4px', background: '#f0ede8', overflow: 'hidden', flexShrink: 0 }}>
                          {p.image_url
                            ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</div>
                          }
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 500 }}>
                        <div>{p.name}</div>
                        {p.store_slug && (
                          <Link href={`/store/${p.store_slug}`} target="_blank" style={{ fontSize: '0.68rem', color: '#a78bfa', textDecoration: 'none' }}>
                            Ver en tienda →
                          </Link>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa', flexShrink: 0 }} />
                          {p.store_name || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#6b6560' }}>{p.category_name || '—'}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>${Number(p.price).toLocaleString('es-AR')}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ color: p.stock === 0 ? '#c0392b' : '#6b6560' }}>
                          {p.stock}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '0.62rem', background: p.active ? '#e8f5e9' : '#f5f5f5', color: p.active ? '#2e7d32' : '#6b6560' }}>
                          {p.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
