'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

const cardStyle = { background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '24px', marginBottom: '20px' };
const tableHeader = { padding: '10px 14px', textAlign: 'left', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 400, whiteSpace: 'nowrap' };
const tableCell = { padding: '10px 14px', color: '#0f0f0f', fontSize: '0.82rem' };

export default function ShoppingStoresPage() {
  const { data: session } = useSession();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    setLoading(true);
    try {
      const res = await fetch('/api/shopping-admin/stores');
      const data = await res.json();
      setStores(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error al cargar locales comerciales');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(store) {
    try {
      const res = await fetch(`/api/shopping-admin/stores/${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !store.active }),
      });
      if (!res.ok) throw new Error();
      toast.success('Estado actualizado');
      loadStores();
    } catch {
      toast.error('Error al actualizar estado');
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/shopping-admin/stores/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Local comercial eliminado');
      setDeleteConfirm(null);
      loadStores();
    } catch {
      toast.error('Error al eliminar local comercial');
    }
  }

  const maxLimit = session?.user?.max_stores ?? 5;
  const isLimitReached = stores.length >= maxLimit;

  return (
    <div style={{ padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)' }}>
      <Toaster />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 4px', letterSpacing: '0.02em' }}>
            Locales Comerciales
          </h1>
          <p style={{ margin: 0, color: '#6b6560', fontSize: '0.8rem' }}>
            {stores.length} de {maxLimit} marcas registradas.
          </p>
        </div>

        {isLimitReached ? (
          <div style={{ fontSize: '0.75rem', color: '#c0392b', padding: '10px 16px', background: '#fef2f2', border: '1px dashed #fecaca', borderRadius: '4px' }}>
            Límite máximo alcanzado ({maxLimit})
          </div>
        ) : (
          <Link href="/shopping-admin/stores/new" style={{ textDecoration: 'none' }}>
            <button style={{ background: '#1a0a2e', color: '#fff', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '2px', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>
              + Crear nueva marca
            </button>
          </Link>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: '#6b6560' }}>Cargando locales...</div>
      ) : (
        <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f0ede8' }}>
                  {['Local / Marca', 'Enlace (Slug)', 'Estado', 'Tipo', 'Registro', 'Acciones'].map(h => (
                    <th key={h} style={tableHeader}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stores.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#6b6560', fontSize: '0.85rem' }}>
                      Sin locales comerciales registrados aún.
                    </td>
                  </tr>
                ) : (
                  stores.map(store => (
                    <tr key={store.id} style={{ borderBottom: '0.5px solid #e0dbd4' }}>
                      <td style={{ ...tableCell, fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {store.logo_url && <img src={store.logo_url} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain', background: '#fafafa', borderRadius: '2px', border: '0.5px solid #e2e8f0' }} />}
                          {store.name}
                        </div>
                      </td>
                      <td style={{ ...tableCell, color: '#6b6560' }}>{store.slug}</td>
                      <td style={tableCell}>
                        <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '0.62rem', background: store.active ? '#e8f5e9' : '#f5f5f5', color: store.active ? '#2e7d32' : '#6b6560' }}>
                          {store.active ? 'Activo' : 'Pausado'}
                        </span>
                      </td>
                      <td style={tableCell}>
                        <span style={{ fontSize: '0.72rem', color: '#6b6560' }}>
                          {store.is_independent ? 'Independiente' : 'Shopping Colectivo'}
                        </span>
                      </td>
                      <td style={{ ...tableCell, color: '#6b6560', fontSize: '0.75rem' }}>
                        {new Date(store.created_at).toLocaleDateString('es-AR')}
                      </td>
                      <td style={tableCell}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                          <Link href={`/shopping-admin/stores/${store.id}/edit`}>
                            <button style={{ border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: '0.65rem', borderRadius: '2px', color: '#1a0a2e' }}>Diseño / Editar</button>
                          </Link>
                          <button onClick={() => toggleActive(store)} style={{ border: `0.5px solid ${store.active ? '#fecaca' : '#bbf7d0'}`, background: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: '0.65rem', borderRadius: '2px', color: store.active ? '#c0392b' : '#2e7d32' }}>
                            {store.active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button onClick={() => setDeleteConfirm(store.id)} style={{ border: '0.5px solid #fecaca', background: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: '0.65rem', borderRadius: '2px', color: '#c0392b' }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '4px', maxWidth: '340px', width: '100%', border: '0.5px solid #e0dbd4' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, margin: '0 0 10px', fontSize: '1.3rem' }}>¿Eliminar tienda?</h3>
            <p style={{ color: '#6b6560', fontSize: '0.875rem', margin: '0 0 24px', lineHeight: 1.5 }}>
              Esta acción eliminará de forma permanente el local, sus categorías y todos sus productos. No se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 18px', border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', fontSize: '0.78rem', borderRadius: '2px' }}>Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '9px 18px', background: '#c0392b', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.78rem', borderRadius: '2px' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
