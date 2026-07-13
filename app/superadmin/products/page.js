'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

const EMPTY_FORM = {
  name: '', category_id: '', description: '', price: '', stock: '0', active: true, colors: '', store_id: '',
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.7rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#6b6560',
};

const inputStyle = {
  width: '100%',
  padding: '9px 11px',
  border: '0.5px solid #e0dbd4',
  background: '#fafaf8',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.875rem',
  outline: 'none',
  borderRadius: '2px',
  boxSizing: 'border-box',
  color: '#0f0f0f',
};

export default function SuperadminProductsPage() {
  const [products,       setProducts]       = useState([]);
  const [stores,         setStores]         = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showForm,       setShowForm]       = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [retainedImages,    setRetainedImages]    = useState([]);
  const [selectedNewFiles,  setSelectedNewFiles]  = useState([]);
  const [saving,         setSaving]         = useState(false);
  const [filterStore,    setFilterStore]    = useState('');
  const [search,         setSearch]         = useState('');
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);
  const [error,          setError]          = useState('');
  const [isMobile,       setIsMobile]       = useState(false);
  const [newCatName,     setNewCatName]     = useState('');
  const [showNewCat,     setShowNewCat]     = useState(false);
  const [savingCat,      setSavingCat]      = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Cargar tiendas iniciales para el filtro y para el select del formulario
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

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Carga dinámica de categorías según la tienda elegida en el formulario
  useEffect(() => {
    if (!form.store_id) {
      setCategories([]);
      return;
    }
    fetch(`/api/superadmin/stores/${form.store_id}/categories`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]));
  }, [form.store_id]);

  function openCreate() {
    setEditingProduct(null);
    setForm({
      ...EMPTY_FORM,
      store_id: filterStore ? String(filterStore) : '',
    });
    setRetainedImages([]);
    setSelectedNewFiles([]);
    setError('');
    setShowNewCat(false);
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
      colors:      product.colors || '',
      store_id:    product.store_id ? String(product.store_id) : '',
    });
    setRetainedImages(product.image_urls || (product.image_url ? [product.image_url] : []));
    setSelectedNewFiles([]);
    setError('');
    setShowNewCat(false);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.store_id) {
      setError('Tenés que seleccionar una tienda');
      return;
    }
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
      fd.append('colors',      form.colors || '');
      fd.append('store_id',    form.store_id);
      
      fd.append('retained_images', JSON.stringify(retainedImages));
      selectedNewFiles.forEach(file => {
        fd.append('images', file);
      });

      const url    = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res  = await fetch(url, { method, body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al guardar producto');

      setShowForm(false);
      await loadProducts();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    if (!newCatName.trim() || !form.store_id) return;
    setSavingCat(true);
    try {
      const res  = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), store_id: parseInt(form.store_id) }),
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
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar');
      }
      setDeleteConfirm(null);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(2.5rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem) 2.5rem' }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 4px', letterSpacing: '0.02em' }}>
              Gestión global de productos
            </h1>
            <p style={{ margin: 0, color: '#6b6560', fontSize: '0.8rem' }}>
              {products.length} producto{products.length !== 1 ? 's' : ''} en total
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

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text" placeholder="Buscar por nombre..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, maxWidth: '280px', background: '#fff' }}
          />
          <select
            value={filterStore} onChange={e => setFilterStore(e.target.value)}
            style={{ ...inputStyle, maxWidth: '220px', background: '#fff' }}
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

        {/* Tabla / Lista */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: '#6b6560' }}>Cargando...</div>
        ) : (
          <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', overflow: 'hidden' }}>
            
            {!isMobile && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 140px 120px 90px 70px 72px 110px',
                padding: '10px 16px',
                borderBottom: '0.5px solid #e0dbd4', background: '#f0ede8',
                fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560',
              }}>
                <div>Imagen</div>
                <div>Nombre</div>
                <div>Tienda</div>
                <div>Categoría</div>
                <div>Precio</div>
                <div>Stock</div>
                <div>Activo</div>
                <div>Acciones</div>
              </div>
            )}

            {products.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#6b6560', fontSize: '0.875rem' }}>
                No hay productos en esta selección.
              </div>
            ) : (
              products.map(p => (
                <ProductRow
                  key={p.id}
                  product={p}
                  isMobile={isMobile}
                  onEdit={() => openEdit(p)}
                  onDelete={() => setDeleteConfirm(p.id)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal confirmación de borrado */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '4px', maxWidth: '360px', width: '100%', border: '0.5px solid #e0dbd4' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, margin: '0 0 10px 0', fontSize: '1.3rem' }}>
              ¿Eliminar producto?
            </h3>
            <p style={{ color: '#6b6560', fontSize: '0.875rem', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Esta acción no se puede deshacer y borrará el producto de forma permanente.
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

      {/* Modal de Crear / Editar */}
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

              {/* Store Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Tienda *</label>
                <select
                  required
                  value={form.store_id}
                  disabled={editingProduct != null}
                  onChange={e => setForm({ ...form, store_id: e.target.value, category_id: '' })}
                  style={{ ...inputStyle, background: editingProduct ? '#f0ede8' : '#fafaf8' }}
                >
                  <option value="">-- Seleccionar Tienda --</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Nombre del Producto *</label>
                <input type="text" required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={inputStyle} placeholder="Ej: Vestido Fibrana" />
              </div>

              {/* Category */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Categoría</label>
                  <button type="button" onClick={() => { if (!form.store_id) { alert('Primero elegí la tienda'); return; } setShowNewCat(v => !v); setNewCatName(''); }}
                    style={{ background: 'none', border: '0.5px solid #e0dbd4', cursor: form.store_id ? 'pointer' : 'not-allowed', opacity: form.store_id ? 1 : 0.5, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6560', padding: '3px 8px', borderRadius: '2px' }}>
                    {showNewCat ? 'Cancelar' : '+ Nueva categoría'}
                  </button>
                </div>
                {showNewCat ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text" autoFocus placeholder="Nombre de categoría"
                      value={newCatName} onChange={e => setNewCatName(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }} required
                    />
                    <button type="button" onClick={handleCreateCategory} disabled={savingCat}
                      style={{ padding: '9px 14px', background: '#0f0f0f', color: '#fafaf8', border: 'none', cursor: savingCat ? 'not-allowed' : 'pointer', fontSize: '0.72rem', borderRadius: '2px', whiteSpace: 'nowrap' }}>
                      {savingCat ? '...' : 'Crear'}
                    </button>
                  </div>
                ) : (
                  <select value={form.category_id}
                    disabled={!form.store_id}
                    onChange={e => setForm({ ...form, category_id: e.target.value })}
                    style={inputStyle}>
                    <option value="">{form.store_id ? 'Sin categoría' : 'Selecciona una tienda primero'}</option>
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

              {/* Colors */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Colores (opcional, separados por coma)</label>
                <input type="text" value={form.colors}
                  onChange={e => setForm({ ...form, colors: e.target.value })}
                  style={inputStyle} placeholder="Ej: Negro, Blanco, Rojo, Azul" />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Descripción</label>
                <textarea value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="Descripción del producto..."
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {/* Images Manager */}
              <div style={{ marginBottom: '20px', padding: '14px', background: '#fcfcfb', border: '0.5px solid #e0dbd4', borderRadius: '4px' }}>
                <label style={{ ...labelStyle, marginBottom: '8px', fontWeight: 600 }}>Imágenes del producto (Máx. 5)</label>
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {/* Retained images */}
                  {retainedImages.map((url, idx) => (
                    <div key={`ret-${idx}`} style={{ position: 'relative', width: '72px', height: '84px', borderRadius: '4px', overflow: 'hidden', border: '0.5px solid #e0dbd4', background: '#f5f3f0' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setRetainedImages(prev => prev.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(15,15,15,0.75)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                      >
                        ✕
                      </button>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.55rem', textAlign: 'center', padding: '1px 0' }}>
                        {idx === 0 ? 'Portada' : `Foto ${idx + 1}`}
                      </div>
                    </div>
                  ))}

                  {/* Selected new files previews */}
                  {selectedNewFiles.map((file, idx) => {
                    const objectUrl = URL.createObjectURL(file);
                    return (
                      <div key={`new-${idx}`} style={{ position: 'relative', width: '72px', height: '84px', borderRadius: '4px', overflow: 'hidden', border: '0.5px dashed #009aae', background: '#f5f3f0' }}>
                        <img src={objectUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setSelectedNewFiles(prev => prev.filter((_, i) => i !== idx))}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(15,15,15,0.75)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                        >
                          ✕
                        </button>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#009aae', color: '#fff', fontSize: '0.55rem', textAlign: 'center', padding: '1px 0', fontWeight: 500 }}>
                          Subiendo
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Image button */}
                  {retainedImages.length + selectedNewFiles.length < 5 && (
                    <label style={{
                      width: '72px', height: '84px', border: '0.5px dashed #d4cfc8', borderRadius: '4px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      background: '#fff', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#0f0f0f'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#d4cfc8'}
                    >
                      <span style={{ fontSize: '1.2rem', color: '#6b6560', fontWeight: 300 }}>+</span>
                      <span style={{ fontSize: '0.58rem', color: '#6b6560', marginTop: '2px', textAlign: 'center' }}>Cargar</span>
                      <input
                        type="file" accept="image/*" multiple
                        style={{ display: 'none' }}
                        onChange={e => {
                          const files = Array.from(e.target.files || []);
                          const limit = 5 - (retainedImages.length + selectedNewFiles.length);
                          const sliced = files.slice(0, limit);
                          if (files.length > limit) {
                            alert(`Solo puedes cargar hasta 5 fotos en total. Se omitieron las restantes.`);
                          }
                          setSelectedNewFiles(prev => [...prev, ...sliced]);
                        }}
                      />
                    </label>
                  )}
                </div>
                
                <p style={{ margin: 0, fontSize: '0.62rem', color: '#888', lineHeight: 1.4 }}>
                  * La primera foto se usará como imagen de portada del producto.
                </p>
              </div>

              {/* Active */}
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="superadmin-active" checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                  style={{ cursor: 'pointer', width: '15px', height: '15px' }} />
                <label htmlFor="superadmin-active" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: '#0f0f0f', cursor: 'pointer' }}>
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
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b6560', marginBottom: '2px' }}>{product.store_name || '—'} · {product.category_name || '—'}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b6560', marginBottom: '4px' }}>${parseFloat(product.price).toFixed(2)}</div>
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
        gridTemplateColumns: '60px 1fr 140px 120px 90px 70px 72px 110px',
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
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</div>
        }
      </div>
      <div>
        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{product.name}</div>
        <div style={{ color: '#aaa', fontSize: '0.7rem', marginTop: '2px' }}>{product.slug}{product.colors ? ` · Colores: ${product.colors}` : ''}</div>
      </div>
      <div style={{ fontSize: '0.8rem', color: '#0f0f0f', fontWeight: 500 }}>{product.store_name || '—'}</div>
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
