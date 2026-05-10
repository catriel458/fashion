'use client';
import { useState, useEffect, useCallback } from 'react';

const labelStyle = {
  display: 'block', marginBottom: '6px',
  fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
  letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560',
};
const inputStyle = {
  width: '100%', padding: '9px 11px',
  border: '0.5px solid #e0dbd4', background: '#fafaf8',
  fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
  outline: 'none', borderRadius: '2px',
  boxSizing: 'border-box', color: '#0f0f0f',
};

const EMPTY_FORM = { username: '', email: '', password: '', role: 'visitor' };

export default function AdminUsersPage() {
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [filterRole,    setFilterRole]    = useState('');
  const [showForm,      setShowForm]      = useState(false);
  const [editingUser,   setEditingUser]   = useState(null);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [saving,        setSaving]        = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error,         setError]         = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRole) params.set('role', filterRole);
      if (search)     params.set('search', search);
      const res  = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [filterRole, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  function openCreate() {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  }

  function openEdit(user) {
    setEditingUser(user);
    setForm({ username: user.username, email: user.email, password: '', role: user.role });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { username: form.username, email: form.email, role: form.role };
      if (form.password) body.password = form.password;

      if (editingUser) {
        const res  = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else {
        if (!form.password) throw new Error('La contraseña es requerida');
        const res = await fetch('/api/admin/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user) {
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      });
      await loadUsers();
    } catch {
      setError('Error al actualizar usuario');
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      setDeleteConfirm(null);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(2.5rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem) 2.5rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 4px', letterSpacing: '0.02em' }}>
              Gestión de Usuarios
            </h1>
            <p style={{ margin: 0, color: '#6b6560', fontSize: '0.8rem' }}>{users.length} usuario{users.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openCreate} style={{ background: '#0f0f0f', color: '#fafaf8', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '2px', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            + Nuevo usuario
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Buscar por nombre o email..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, maxWidth: '280px', background: '#fff' }} />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            style={{ ...inputStyle, maxWidth: '180px', background: '#fff' }}>
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="visitor">Visitor</option>
          </select>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '12px 16px', borderRadius: '4px', marginBottom: '16px', color: '#c0392b', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: '#6b6560' }}>Cargando...</div>
        ) : (
          <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f0ede8' }}>
                    {['Avatar', 'Usuario', 'Email', 'Rol', 'Estado', 'Registro', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 400, whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#6b6560' }}>
                        No hay usuarios
                      </td>
                    </tr>
                  ) : users.map(user => (
                    <tr key={user.id} style={{ borderBottom: '0.5px solid #e0dbd4' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f0ede8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {user.avatar_url
                            ? <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: '0.9rem', color: '#6b6560' }}>{user.username?.[0]?.toUpperCase()}</span>
                          }
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 500 }}>{user.username}</td>
                      <td style={{ padding: '10px 14px', color: '#6b6560' }}>{user.email}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '0.62rem', background: user.role === 'admin' ? '#e8f0fe' : '#f0ede8', color: user.role === 'admin' ? '#1a56db' : '#6b6560' }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '0.62rem', background: user.active ? '#e8f5e9' : '#f5f5f5', color: user.active ? '#2e7d32' : '#6b6560' }}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#6b6560', fontSize: '0.75rem' }}>
                        {new Date(user.created_at).toLocaleDateString('es-AR')}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                          <button onClick={() => openEdit(user)}
                            style={{ border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: '0.65rem', borderRadius: '2px', whiteSpace: 'nowrap' }}>
                            Editar
                          </button>
                          <button onClick={() => toggleActive(user)}
                            style={{ border: `0.5px solid ${user.active ? '#fecaca' : '#bbf7d0'}`, background: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: '0.65rem', borderRadius: '2px', color: user.active ? '#c0392b' : '#2e7d32', whiteSpace: 'nowrap' }}>
                            {user.active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button onClick={() => setDeleteConfirm(user.id)}
                            style={{ border: '0.5px solid #fecaca', background: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: '0.65rem', borderRadius: '2px', color: '#c0392b' }}>
                            ✕
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

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '4px', maxWidth: '340px', width: '100%', border: '0.5px solid #e0dbd4' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, margin: '0 0 10px', fontSize: '1.3rem' }}>¿Eliminar usuario?</h3>
            <p style={{ color: '#6b6560', fontSize: '0.875rem', margin: '0 0 24px', lineHeight: 1.5 }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ padding: '9px 18px', border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', fontSize: '0.78rem', borderRadius: '2px' }}>
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                style={{ padding: '9px 18px', background: '#c0392b', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.78rem', borderRadius: '2px' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '0.5px solid #e0dbd4', position: 'sticky', top: 0, background: '#fff' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.3rem', margin: 0 }}>
                {editingUser ? 'Editar usuario' : 'Nuevo usuario'}
              </h2>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6b6560' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              {error && (
                <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', color: '#c0392b', fontSize: '0.8rem' }}>
                  {error}
                </div>
              )}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Usuario *</label>
                <input type="text" required value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  style={inputStyle} placeholder="Nombre de usuario" />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Email *</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={inputStyle} placeholder="usuario@email.com" />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Contraseña {editingUser ? '(dejar vacío para no cambiar)' : '*'}</label>
                <input type="password" required={!editingUser} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={inputStyle} placeholder="••••••••" minLength={editingUser ? 0 : 6} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Rol *</label>
                <select required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inputStyle}>
                  <option value="visitor">Visitor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '10px 20px', border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', fontSize: '0.78rem', borderRadius: '2px' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: '10px 22px', background: saving ? '#ccc' : '#0f0f0f', color: '#fafaf8', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.78rem', borderRadius: '2px' }}>
                  {saving ? 'Guardando...' : editingUser ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
