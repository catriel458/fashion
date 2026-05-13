'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SuperadminStoresPage() {
  const [stores,  setStores]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => { loadStores(); }, []);

  async function loadStores() {
    setLoading(true);
    try {
      const res  = await fetch('/api/superadmin/stores');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStores(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(store) {
    try {
      await fetch(`/api/superadmin/stores/${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !store.active }),
      });
      await loadStores();
    } catch {
      setError('Error al actualizar tienda');
    }
  }

  return (
    <div style={{ padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)', fontFamily: 'var(--font-sans)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 4px', letterSpacing: '0.02em' }}>
            Tiendas
          </h1>
          <p style={{ margin: 0, color: '#6b6560', fontSize: '0.8rem' }}>{stores.length} tienda{stores.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/superadmin/stores/new" style={{
          background: '#1a0a2e', color: '#fff', border: 'none',
          padding: '10px 20px', cursor: 'pointer', borderRadius: '2px',
          fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase',
          textDecoration: 'none', display: 'inline-block',
        }}>
          + Nueva tienda
        </Link>
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
                  {['Nombre', 'Slug', 'Admin', 'Productos', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 400, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stores.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#6b6560' }}>No hay tiendas</td></tr>
                ) : stores.map(store => (
                  <tr key={store.id} style={{ borderBottom: '0.5px solid #e0dbd4' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: store.primary_color || '#009aae', flexShrink: 0 }} />
                        {store.name}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b6560', fontSize: '0.78rem' }}>{store.slug}</td>
                    <td style={{ padding: '12px 16px', color: '#6b6560' }}>{store.admin_name || <span style={{ color: '#ccc' }}>—</span>}</td>
                    <td style={{ padding: '12px 16px' }}>{store.product_count ?? 0}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '0.62rem', background: store.active ? '#e8f5e9' : '#f5f5f5', color: store.active ? '#2e7d32' : '#6b6560' }}>
                        {store.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                        <Link href={`/superadmin/stores/${store.id}/edit`} style={{ border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.65rem', borderRadius: '2px', color: '#0f0f0f', textDecoration: 'none' }}>
                          Editar
                        </Link>
                        <Link href={`/store/${store.slug}`} target="_blank" style={{ border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.65rem', borderRadius: '2px', color: '#6b6560', textDecoration: 'none' }}>
                          Ver →
                        </Link>
                        <button onClick={() => toggleActive(store)} style={{ border: `0.5px solid ${store.active ? '#fecaca' : '#bbf7d0'}`, background: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.65rem', borderRadius: '2px', color: store.active ? '#c0392b' : '#2e7d32' }}>
                          {store.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
