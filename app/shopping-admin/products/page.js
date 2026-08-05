'use client';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const EMPTY_FORM = { name: '', category_id: '', description: '', price: '', stock: '0', active: true, colors: '' };
const labelStyle = { display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' };
const inputStyle = { width: '100%', padding: '9px 11px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none', borderRadius: '2px', boxSizing: 'border-box', color: '#0f0f0f' };

export default function ShoppingProductsPage() {
  const [stores, setSelectedStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  
  const [products,       setProducts]       = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [showForm,       setShowForm]       = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [retainedImages,    setRetainedImages]    = useState([]);
  const [selectedNewFiles,  setSelectedNewFiles]  = useState([]);
  const [saving,         setSaving]         = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [search,         setSearch]         = useState('');
  const [deleteConfirm,   setDeleteConfirm]  = useState(null);
  const [error,           setError]          = useState('');
  const [newCatName,      setNewCatName]     = useState('');
  const [showNewCat,      setShowNewCat]     = useState(false);
  const [savingCat,       setSavingCat]      = useState(false);

  useEffect(() => {
    // Load stores of this shopping admin
    fetch('/api/shopping-admin/stores')
      .then(r => r.json())
      .then(data => {
        setSelectedStores(Array.isArray(data) ? data : []);
        if (data && data.length > 0) {
          setSelectedStoreId(String(data[0].id));
        }
      });
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      loadData(selectedStoreId);
    } else {
      setProducts([]);
      setCategories([]);
    }
  }, [selectedStoreId]);

  async function loadData(storeId) {
    setLoading(true);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        fetch(`/api/shopping-admin/products?store_id=${storeId}`),
        fetch(`/api/shopping-admin/categories?store_id=${storeId}`),
      ]);
      const [prods, cats] = await Promise.all([prodsRes.json(), catsRes.json()]);
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch {
      toast.error('Error al cargar catálogo de productos');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setRetainedImages([]);
    setSelectedNewFiles([]);
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
      colors:      product.colors || '',
    });
    setRetainedImages(product.image_urls || (product.image_url ? [product.image_url] : []));
    setSelectedNewFiles([]);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('store_id',    selectedStoreId);
      fd.append('name',        form.name);
      fd.append('category_id', form.category_id);
      fd.append('description', form.description);
      fd.append('price',       form.price);
      fd.append('stock',       form.stock);
      fd.append('active',      form.active ? 'true' : 'false');
      fd.append('colors',      form.colors || '');
      
      fd.append('retained_images', JSON.stringify(retainedImages));
      selectedNewFiles.forEach(file => {
        fd.append('images', file);
      });

      const url    = editingProduct ? `/api/shopping-admin/products/${editingProduct.id}` : '/api/shopping-admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res  = await fetch(url, { method, body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al guardar');

      setShowForm(false);
      await loadData(selectedStoreId);
      toast.success('Producto guardado');
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
      const res  = await fetch('/api/shopping-admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), store_id: parseInt(selectedStoreId) }),
      });
      const cat = await res.json();
      if (!res.ok) throw new Error(cat.error || 'Error al crear categoría');
      setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(f => ({ ...f, category_id: String(cat.id) }));
      setNewCatName('');
      setShowNewCat(false);
      toast.success('Categoría agregada');
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingCat(false);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/shopping-admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setDeleteConfirm(null);
      await loadData(selectedStoreId);
      toast.success('Producto eliminado');
    } catch {
      toast.error('Error al eliminar producto');
    }
  }

  const filtered = products.filter(p => {
    const matchCat    = !filterCategory || String(p.category_id) === String(filterCategory);
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)', fontFamily: 'var(--font-sans)' }}>
      <Toaster />

      {/* Selector de tienda */}
      <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', padding: '16px 20px', borderRadius: '4px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <label style={{ ...labelStyle, marginBottom: 0, fontWeight: 700 }}>Seleccionar Tienda Comercial:</label>
        <select value={selectedStoreId} onChange={e => setSelectedStoreId(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '240px' }}>
          <option value="">Elegir tienda...</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {selectedStoreId ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 4px', letterSpacing: '0.02em' }}>
                Catálogo de Productos
              </h1>
              <p style={{ margin: 0, color: '#6b6560', fontSize: '0.8rem' }}>
                {filtered.length} producto{filtered.length !== 1 ? 's' : ''} en local seleccionado.
              </p>
            </div>
            <button onClick={openCreate} style={{ background: '#1a0a2e', color: '#fff', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '2px', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>
              + Nuevo producto
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Buscar prenda..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, maxWidth: '280px', background: '#fff' }} />
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ ...inputStyle, maxWidth: '180px', background: '#fff' }}>
              <option value="">Todas las secciones</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '64px', color: '#6b6560' }}>Cargando catálogo...</div>
          ) : (
            <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f0ede8' }}>
                      {['Foto', 'Producto', 'Precio', 'Stock', 'Categoría', 'Estado', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#6b6560' }}>Sin productos en este local comercial.</td></tr>
                    ) : filtered.map(product => (
                      <tr key={product.id} style={{ borderBottom: '0.5px solid #e0dbd4' }}>
                        <td style={{ padding: '10px 14px' }}>
                          {product.image_url ? (
                            <img src={product.image_url} alt="" style={{ height: '36px', width: '36px', objectFit: 'cover', borderRadius: '3px', border: '1px solid #cbd5e1' }} />
                          ) : (
                            <div style={{ height: '36px', width: '36px', background: '#cbd5e1', borderRadius: '3px' }} />
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 500 }}>{product.name}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>${product.price}</td>
                        <td style={{ padding: '10px 14px', color: '#6b6560' }}>{product.stock} u.</td>
                        <td style={{ padding: '10px 14px', color: '#6b6560' }}>{product.category_name || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '0.62rem', background: product.active ? '#e8f5e9' : '#f5f5f5', color: product.active ? '#2e7d32' : '#6b6560' }}>
                            {product.active ? 'Activo' : 'Pausado'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                            <button onClick={() => openEdit(product)} style={{ border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: '0.65rem', borderRadius: '2px', color: '#1a0a2e' }}>Editar</button>
                            <button onClick={() => setDeleteConfirm(product.id)} style={{ border: '0.5px solid #fecaca', background: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: '0.65rem', borderRadius: '2px', color: '#c0392b' }}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: '80px', textAlign: 'center', background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', color: '#6b6560' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, margin: '0 0 10px' }}>Ninguna tienda seleccionada</h2>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Elegí una marca comercial en la barra superior para gestionar sus prendas de catálogo.</p>
        </div>
      )}

      {/* Delete product confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '4px', maxWidth: '340px', width: '100%', border: '0.5px solid #e0dbd4' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, margin: '0 0 10px', fontSize: '1.3rem' }}>¿Eliminar producto?</h3>
            <p style={{ color: '#6b6560', fontSize: '0.875rem', margin: '0 0 24px', lineHeight: 1.5 }}>Esta acción eliminará de forma permanente el producto de tu catálogo.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 18px', border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', fontSize: '0.78rem', borderRadius: '2px' }}>Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '9px 18px', background: '#c0392b', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.78rem', borderRadius: '2px' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '0.5px solid #e0dbd4', position: 'sticky', top: 0, background: '#fff' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.3rem', margin: 0 }}>
                {editingProduct ? 'Editar Producto' : 'Cargar prenda en local'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6b6560' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              {error && <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', color: '#c0392b', fontSize: '0.8rem' }}>{error}</div>}

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Nombre de la prenda *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Ej: Campera de jean gastada" />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Categoría / Sección</label>
                  <button type="button" onClick={() => setShowNewCat(!showNewCat)} style={{ background: 'none', border: 'none', color: '#009aae', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                    {showNewCat ? 'Elegir existente' : '+ Crear nueva'}
                  </button>
                </div>

                {showNewCat ? (
                  <div style={{ display: 'flex', gap: '6px', background: '#fafaf8', padding: '8px', borderRadius: '4px', border: '0.5px solid #cbd5e1' }}>
                    <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} style={{ ...inputStyle, background: '#fff' }} placeholder="Nombre (ej: Accesorios)" />
                    <button type="button" onClick={handleCreateCategory} disabled={savingCat || !newCatName} style={{ background: '#1a0a2e', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '2px', cursor: 'pointer', fontSize: '0.7rem' }}>
                      {savingCat ? 'Guardando...' : 'Crear'}
                    </button>
                  </div>
                ) : (
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={inputStyle}>
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Precio de venta ($) *</label>
                  <input type="number" step="0.01" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} placeholder="12500" />
                </div>
                <div>
                  <label style={labelStyle}>Stock disponible *</label>
                  <input type="number" required value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} style={inputStyle} placeholder="15" />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Colores disponibles (Separados por coma)</label>
                <input type="text" value={form.colors} onChange={e => setForm({ ...form, colors: e.target.value })} style={inputStyle} placeholder="Ej: Azul, Negro, Blanco" />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Descripción de la prenda</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Detalles de composición, corte o modelo..." />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Fotos de la prenda</label>
                {retainedImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {retainedImages.map((img, i) => (
                      <div key={i} style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => setRetainedImages(prev => prev.filter(x => x !== img))} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <input type="file" accept="image/*" multiple onChange={e => setSelectedNewFiles(Array.from(e.target.files))} style={{ fontSize: '0.8rem' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <input type="checkbox" id="prod-active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                <label htmlFor="prod-active" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>Prenda en línea / Visible</label>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', fontSize: '0.78rem', borderRadius: '2px' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 22px', background: saving ? '#ccc' : '#1a0a2e', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.78rem', borderRadius: '2px', fontWeight: 600 }}>
                  {saving ? 'Guardando...' : 'Guardar prenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
