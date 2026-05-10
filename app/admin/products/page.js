'use client';

import { useState, useEffect } from 'react';

const EMPTY_FORM = {
  name: '', category_id: '', description: '', price: '', stock: '0', active: true,
};

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

export default function AdminProductsPage() {
  const [products,       setProducts]       = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showForm,       setShowForm]       = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [imageFile,      setImageFile]      = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [search,         setSearch]         = useState('');
  const [deleteConfirm,   setDeleteConfirm]  = useState(null);
  const [error,           setError]          = useState('');
  const [isMobile,        setIsMobile]       = useState(false);
  const [newCatName,      setNewCatName]     = useState('');
  const [showNewCat,      setShowNewCat]     = useState(false);
  const [savingCat,       setSavingCat]      = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/categories'),
      ]);
      const [prods, cats] = await Promise.all([prodsRes.json(), catsRes.json()]);
      setProducts(  Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats)  ? cats  : []);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(product) {
    setEditingProduct(product);
    setForm({
      name:        product.name,
      category_id: product.category_id ? String(product.category_id) : '',
      description: product.description || '',
      price:       product.price,
      stock:       String(product.stock),
      active:      product.active,
    });
    setImageFile(null);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name',        form.name);
      fd.append('category_id', form.category_id);
      fd.append('description', form.description);
      fd.append('price',       form.price);
      fd.append('stock',       form.stock);
      fd.append('active',      form.active ? 'true' : 'false');
      if (imageFile) fd.append('image', imageFile);

      const url    = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res  = await fetch(url, { method, body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al guardar');

      setShowForm(false);
      await loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      const res  = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const cat = await res.json();
      if (!res.ok) throw new Error(cat.error || 'Error al crear categoría');
      setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(f => ({ ...f, category_id: String(cat.id) }));
      setNewCatName('');
      setShowNewCat(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingCat(false);
    }
  }

  async function handleDelete(id) {
    try {
      await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      await loadData();
    } catch {
      setError('Error al eliminar');
    }
  }

  const filtered = products.filter(p => {
    const matchCat    = !filterCategory || String(p.category_id) === String(filterCategory);
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', fontFamily: 'var(--font-sans)' }}>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(2.5rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem) 2.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 4px 0', letterSpacing: '0.02em' }}>
              Gestión de Productos
            </h1>
            <p style={{ margin: 0, color: '#6b6560', fontSize: '0.8rem' }}>
              {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={openCreate}
            style={{
              background: '#0f0f0f', color: '#fafaf8', border: 'none',
              padding: '10px 20px', cursor: 'pointer', borderRadius: '2px',
              fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            + Nuevo producto
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text" placeholder="Buscar producto..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, maxWidth: '240px', background: '#fff' }}
          />
          <select
            value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            style={{ ...inputStyle, maxWidth: '200px', background: '#fff' }}
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

            {/* Table head */}
            {!isMobile && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 150px 90px 70px 72px 110px',
                padding: '10px 16px',
                borderBottom: '0.5px solid #e0dbd4', background: '#f0ede8',
                fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560',
              }}>
                <div>Imagen</div><div>Nombre</div><div>Categoría</div>
                <div>Precio</div><div>Stock</div><div>Activo</div><div>Acciones</div>
              </div>
            )}

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px', color: '#6b6560', fontSize: '0.875rem' }}>
                No hay productos
              </div>
            ) : (
              filtered.map(product => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isMobile={isMobile}
                  onEdit={() => openEdit(product)}
                  onDelete={() => setDeleteConfirm(product.id)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '4px', maxWidth: '360px', width: '100%', border: '0.5px solid #e0dbd4' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, margin: '0 0 10px 0', fontSize: '1.3rem' }}>
              ¿Eliminar producto?
            </h3>
            <p style={{ color: '#6b6560', fontSize: '0.875rem', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Esta acción no se puede deshacer.
            </p>
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

      {/* Create / Edit form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{
            background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px',
            width: '100%', maxWidth: '520px', maxHeight: '92vh', overflowY: 'auto',
          }}>

            <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', borderBottom: '0.5px solid #e0dbd4', paddingBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.4rem', margin: 0 }}>
                {editingProduct ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6b6560', padding: '4px' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              {error && (
                <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', color: '#c0392b', fontSize: '0.8rem' }}>
                  {error}
                </div>
              )}

              {/* Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Nombre *</label>
                <input type="text" required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={inputStyle} placeholder="Ej: Remera básica" />
              </div>

              {/* Category */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Categoría</label>
                  <button type="button" onClick={() => { setShowNewCat(v => !v); setNewCatName(''); }}
                    style={{ background: 'none', border: '0.5px solid #e0dbd4', cursor: 'pointer', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6560', padding: '3px 8px', borderRadius: '2px' }}>
                    {showNewCat ? 'Cancelar' : '+ Nueva categoría'}
                  </button>
                </div>
                {showNewCat ? (
                  <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text" autoFocus placeholder="Nombre de categoría"
                      value={newCatName} onChange={e => setNewCatName(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }} required
                    />
                    <button type="submit" disabled={savingCat}
                      style={{ padding: '9px 14px', background: '#0f0f0f', color: '#fafaf8', border: 'none', cursor: savingCat ? 'not-allowed' : 'pointer', fontSize: '0.72rem', borderRadius: '2px', whiteSpace: 'nowrap' }}>
                      {savingCat ? '...' : 'Crear'}
                    </button>
                  </form>
                ) : (
                  <select value={form.category_id}
                    onChange={e => setForm({ ...form, category_id: e.target.value })}
                    style={inputStyle}>
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              {/* Price + Stock */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Precio *</label>
                  <input type="number" required min="0" step="0.01" value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    style={inputStyle} placeholder="0.00" />
                </div>
                <div>
                  <label style={labelStyle}>Stock</label>
                  <input type="number" min="0" value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    style={inputStyle} placeholder="0" />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Descripción</label>
                <textarea value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="Descripción del producto..."
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {/* Image */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Imagen</label>
                {editingProduct?.image_url && (
                  <div style={{ marginBottom: '10px' }}>
                    <img src={editingProduct.image_url} alt="" style={{ width: '72px', height: '80px', objectFit: 'cover', borderRadius: '2px', border: '0.5px solid #e0dbd4' }} />
                    <p style={{ fontSize: '0.7rem', color: '#6b6560', margin: '4px 0 0' }}>Imagen actual</p>
                  </div>
                )}
                <input type="file" accept="image/*"
                  onChange={e => setImageFile(e.target.files[0])}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: '#6b6560', cursor: 'pointer' }} />
              </div>

              {/* Active */}
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="admin-active" checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                  style={{ cursor: 'pointer', width: '15px', height: '15px' }} />
                <label htmlFor="admin-active" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: '#0f0f0f', cursor: 'pointer' }}>
                  Producto activo (visible en la tienda)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '10px 20px', border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', fontSize: '0.78rem', borderRadius: '2px' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{
                    padding: '10px 22px',
                    background: saving ? '#ccc' : '#0f0f0f',
                    color: '#fafaf8', border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '0.78rem', letterSpacing: '0.1em',
                    borderRadius: '2px', transition: 'background 0.2s',
                  }}>
                  {saving ? 'Guardando...' : editingProduct ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductRow({ product, isMobile, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);

  if (isMobile) {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '14px 16px',
          borderBottom: '0.5px solid #e0dbd4',
          background: hovered ? '#fafaf8' : '#fff',
          transition: 'background 0.15s',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ width: '52px', height: '60px', background: '#f0ede8', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
            {product.image_url
              ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👕</div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b6560', marginBottom: '4px' }}>{product.category_name || '—'} · ${parseFloat(product.price).toFixed(2)}</div>
            <div style={{ fontSize: '0.72rem', color: '#6b6560' }}>Stock: {product.stock} · {product.active ? 'Activo' : 'Inactivo'}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button onClick={onEdit} style={{ border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', padding: '5px 10px', fontSize: '0.68rem', borderRadius: '2px', color: '#0f0f0f' }}>Editar</button>
            <button onClick={onDelete} style={{ border: '0.5px solid #fecaca', background: 'none', cursor: 'pointer', padding: '5px 10px', fontSize: '0.68rem', borderRadius: '2px', color: '#c0392b' }}>✕</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '60px 1fr 150px 90px 70px 72px 110px',
        padding: '12px 16px',
        borderBottom: '0.5px solid #e0dbd4',
        alignItems: 'center',
        background: hovered ? '#fafaf8' : '#fff',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ width: '48px', height: '56px', background: '#f0ede8', borderRadius: '2px', overflow: 'hidden' }}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👕</div>
        }
      </div>
      <div>
        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{product.name}</div>
        <div style={{ color: '#aaa', fontSize: '0.7rem', marginTop: '2px' }}>{product.slug}</div>
      </div>
      <div style={{ color: '#6b6560', fontSize: '0.8rem' }}>{product.category_name || '—'}</div>
      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>${parseFloat(product.price).toFixed(2)}</div>
      <div style={{ color: product.stock < 5 ? '#c0392b' : '#0f0f0f', fontSize: '0.875rem' }}>{product.stock}</div>
      <div>
        <span style={{
          display: 'inline-block', padding: '3px 8px', borderRadius: '20px',
          fontSize: '0.65rem', letterSpacing: '0.06em',
          background: product.active ? '#e8f5e9' : '#f5f5f5',
          color: product.active ? '#2e7d32' : '#6b6560',
        }}>
          {product.active ? 'Sí' : 'No'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={onEdit}
          style={{ border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', padding: '5px 10px', fontSize: '0.68rem', color: '#0f0f0f', borderRadius: '2px', transition: 'all 0.2s' }}>
          Editar
        </button>
        <button onClick={onDelete}
          style={{ border: '0.5px solid #fecaca', background: 'none', cursor: 'pointer', padding: '5px 10px', fontSize: '0.68rem', color: '#c0392b', borderRadius: '2px', transition: 'all 0.2s' }}>
          ✕
        </button>
      </div>
    </div>
  );
}
