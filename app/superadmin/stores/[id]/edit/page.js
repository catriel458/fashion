'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const FONTS = ['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Poppins', 'Raleway', 'Open Sans', 'Lato', 'Nunito', 'Oswald'];

const labelStyle = { display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' };
const inputStyle = { width: '100%', padding: '9px 11px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none', borderRadius: '2px', boxSizing: 'border-box', color: '#0f0f0f' };

export default function EditStorePage({ params }) {
  const { id } = params;
  const router  = useRouter();

  const [store,        setStore]        = useState(null);
  const [images,       setImages]       = useState([]);
  const [admin,        setAdmin]        = useState(null);
  const [form,         setForm]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [imgFile,      setImgFile]      = useState(null);
  const [imgCaption,   setImgCaption]   = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [logoFile,     setLogoFile]     = useState(null);
  const [uploadingLogo,setUploadingLogo]= useState(false);
  const [adminForm,    setAdminForm]    = useState({ username: '', email: '', password: '', store_id: id });
  const [savingAdmin,  setSavingAdmin]  = useState(false);

  useEffect(() => {
    fetch(`/api/superadmin/stores/${id}`)
      .then(r => r.json())
      .then(data => {
        setStore(data);
        setImages(data.images || []);
        setAdmin(data.admin || null);
        setForm({
          name:            data.name,
          tagline:         data.tagline || '',
          primary_color:   data.primary_color || '#009aae',
          secondary_color: data.secondary_color || '#ffffff',
          font_family:     data.font_family || 'Inter',
          hero_title:      data.hero_title || '',
          hero_subtitle:   data.hero_subtitle || '',
          about_text:      data.about_text || '',
          active:          data.active,
        });
      })
      .catch(() => setError('Error al cargar tienda'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res  = await fetch(`/api/superadmin/stores/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStore(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadImage(e) {
    e.preventDefault();
    if (!imgFile) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('image',   imgFile);
      fd.append('caption', imgCaption);
      fd.append('sort_order', String(images.length));
      const res  = await fetch(`/api/superadmin/stores/${id}/images`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImages(prev => [...prev, data]);
      setImgFile(null);
      setImgCaption('');
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingImg(false);
    }
  }

  async function handleDeleteImage(imgId) {
    try {
      await fetch(`/api/superadmin/stores/${id}/images/${imgId}`, { method: 'DELETE' });
      setImages(prev => prev.filter(i => i.id !== imgId));
    } catch {
      setError('Error al eliminar imagen');
    }
  }

  async function moveImage(index, direction) {
    const newImages = [...images];
    const target = index + direction;
    if (target < 0 || target >= newImages.length) return;
    [newImages[index], newImages[target]] = [newImages[target], newImages[index]];
    setImages(newImages);
    await Promise.all(newImages.map((img, i) =>
      fetch(`/api/superadmin/stores/${id}/images/${img.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: i, caption: img.caption }),
      })
    ));
  }

  async function handleUploadLogo(e) {
    e.preventDefault();
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('logo', logoFile);
      const res  = await fetch(`/api/superadmin/stores/${id}/logo`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStore(prev => ({ ...prev, logo_url: data.logo_url }));
      setLogoFile(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleDeleteLogo() {
    try {
      await fetch(`/api/superadmin/stores/${id}/logo`, { method: 'DELETE' });
      setStore(prev => ({ ...prev, logo_url: null }));
    } catch {
      setError('Error al eliminar logo');
    }
  }

  async function handleCreateAdmin(e) {
    e.preventDefault();
    setSavingAdmin(true);
    setError('');
    try {
      const res  = await fetch('/api/superadmin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...adminForm, role: 'admin', store_id: parseInt(id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdmin(data);
      setAdminForm({ username: '', email: '', password: '', store_id: id });
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingAdmin(false);
    }
  }

  if (loading) return <div style={{ padding: '3rem', color: '#6b6560', fontFamily: 'var(--font-sans)' }}>Cargando...</div>;
  if (!form)   return <div style={{ padding: '3rem', color: '#c0392b', fontFamily: 'var(--font-sans)' }}>{error || 'Tienda no encontrada'}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 28px', letterSpacing: '0.02em' }}>
        Editar: {store.name}
      </h1>

      {error && (
        <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', color: '#c0392b', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      {/* Main form */}
      <form onSubmit={handleSave} style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '28px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.2rem', margin: '0 0 20px' }}>Datos generales</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Tagline</label>
            <input type="text" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Color primario</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} style={{ width: '40px', height: '36px', padding: '2px', border: '0.5px solid #e0dbd4', borderRadius: '2px', cursor: 'pointer' }} />
              <input type="text" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} style={{ ...inputStyle, fontFamily: 'monospace' }} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Color secundario</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="color" value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} style={{ width: '40px', height: '36px', padding: '2px', border: '0.5px solid #e0dbd4', borderRadius: '2px', cursor: 'pointer' }} />
              <input type="text" value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} style={{ ...inputStyle, fontFamily: 'monospace' }} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Tipografía</label>
            <select value={form.font_family} onChange={e => setForm({ ...form, font_family: e.target.value })} style={inputStyle}>
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginBottom: '16px', padding: '20px', background: form.primary_color, borderRadius: '4px', textAlign: 'center' }}>
          <p style={{ fontFamily: form.font_family, fontSize: '1.5rem', color: form.secondary_color, margin: 0 }}>{form.name}</p>
          <p style={{ fontFamily: form.font_family, fontSize: '0.8rem', color: form.secondary_color, opacity: 0.7, margin: '4px 0 0' }}>{form.tagline}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Hero title</label>
            <input type="text" value={form.hero_title} onChange={e => setForm({ ...form, hero_title: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Hero subtitle</label>
            <input type="text" value={form.hero_subtitle} onChange={e => setForm({ ...form, hero_subtitle: e.target.value })} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Sobre nosotros</label>
          <textarea value={form.about_text} onChange={e => setForm({ ...form, about_text: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" id="store-active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} style={{ cursor: 'pointer', width: '15px', height: '15px' }} />
          <label htmlFor="store-active" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', cursor: 'pointer' }}>Tienda activa (visible en el home)</label>
        </div>

        <button type="submit" disabled={saving} style={{ padding: '10px 22px', background: saving ? '#ccc' : '#1a0a2e', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.78rem', borderRadius: '2px' }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {/* Carousel images */}
      <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '28px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.2rem', margin: '0 0 20px' }}>Carrusel de imágenes</h2>

        {images.length === 0 ? (
          <p style={{ color: '#6b6560', fontSize: '0.875rem', marginBottom: '20px' }}>No hay imágenes aún.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {images.map((img, i) => (
              <div key={img.id} style={{ border: '0.5px solid #e0dbd4', borderRadius: '4px', overflow: 'hidden' }}>
                <img src={img.image_url} alt={img.caption || ''} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                <div style={{ padding: '8px', fontSize: '0.7rem', color: '#6b6560' }}>{img.caption || '—'}</div>
                <div style={{ padding: '0 8px 8px', display: 'flex', gap: '4px' }}>
                  <button onClick={() => moveImage(i, -1)} disabled={i === 0} style={{ flex: 1, border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', padding: '3px', fontSize: '0.7rem', borderRadius: '2px' }}>↑</button>
                  <button onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} style={{ flex: 1, border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', padding: '3px', fontSize: '0.7rem', borderRadius: '2px' }}>↓</button>
                  <button onClick={() => handleDeleteImage(img.id)} style={{ flex: 1, border: '0.5px solid #fecaca', background: 'none', cursor: 'pointer', padding: '3px', fontSize: '0.7rem', borderRadius: '2px', color: '#c0392b' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleUploadImage} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={labelStyle}>Nueva imagen</label>
            <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])} required style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: '#6b6560', cursor: 'pointer' }} />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={labelStyle}>Caption (opcional)</label>
            <input type="text" value={imgCaption} onChange={e => setImgCaption(e.target.value)} style={inputStyle} placeholder="Descripción..." />
          </div>
          <button type="submit" disabled={uploadingImg || !imgFile} style={{ padding: '9px 16px', background: uploadingImg ? '#ccc' : '#0f0f0f', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
            {uploadingImg ? 'Subiendo...' : 'Subir imagen'}
          </button>
        </form>
      </div>

      {/* Logo section */}
      <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '28px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.2rem', margin: '0 0 20px' }}>Logo de la tienda</h2>

        {store?.logo_url ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '16px', background: '#f0ede8', borderRadius: '4px' }}>
            <img src={store.logo_url} alt="Logo actual" style={{ height: '64px', maxWidth: '200px', objectFit: 'contain', background: '#fff', padding: '8px', borderRadius: '4px', border: '0.5px solid #e0dbd4' }} />
            <div>
              <p style={{ fontSize: '0.8rem', color: '#6b6560', margin: '0 0 8px' }}>Logo actual</p>
              <button onClick={handleDeleteLogo} style={{ border: '0.5px solid #fecaca', background: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.65rem', borderRadius: '2px', color: '#c0392b' }}>
                Eliminar logo
              </button>
            </div>
          </div>
        ) : (
          <p style={{ color: '#6b6560', fontSize: '0.875rem', marginBottom: '16px' }}>No hay logo cargado. Se muestra el nombre de la tienda.</p>
        )}

        <form onSubmit={handleUploadLogo} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label style={labelStyle}>Subir nuevo logo (PNG, SVG, JPG)</label>
            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} required style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: '#6b6560', cursor: 'pointer' }} />
          </div>
          <button type="submit" disabled={uploadingLogo || !logoFile} style={{ padding: '9px 16px', background: uploadingLogo ? '#ccc' : '#0f0f0f', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
            {uploadingLogo ? 'Subiendo...' : 'Subir logo'}
          </button>
        </form>
        <p style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '8px' }}>Recomendado: fondo transparente (PNG/SVG), mínimo 200px de ancho.</p>
      </div>

      {/* Store admin section */}
      <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.2rem', margin: '0 0 20px' }}>Admin de la tienda</h2>

        {admin ? (
          <div style={{ background: '#f0ede8', padding: '16px', borderRadius: '4px', marginBottom: '20px' }}>
            <div style={{ fontWeight: 500, marginBottom: '4px' }}>{admin.username}</div>
            <div style={{ color: '#6b6560', fontSize: '0.8rem' }}>{admin.email}</div>
          </div>
        ) : (
          <p style={{ color: '#6b6560', fontSize: '0.875rem', marginBottom: '20px' }}>Esta tienda no tiene admin asignado.</p>
        )}

        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', margin: '0 0 14px' }}>
          {admin ? 'Crear nuevo admin' : 'Asignar admin'}
        </h3>
        <form onSubmit={handleCreateAdmin} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Usuario *</label>
            <input type="text" required value={adminForm.username} onChange={e => setAdminForm({ ...adminForm, username: e.target.value })} style={inputStyle} placeholder="username" />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input type="email" required value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} style={inputStyle} placeholder="admin@tienda.com" />
          </div>
          <div>
            <label style={labelStyle}>Contraseña *</label>
            <input type="password" required minLength={6} value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} style={inputStyle} placeholder="••••••••" />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={savingAdmin} style={{ padding: '9px 18px', background: savingAdmin ? '#ccc' : '#1a0a2e', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '0.72rem' }}>
              {savingAdmin ? 'Creando...' : 'Crear admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
