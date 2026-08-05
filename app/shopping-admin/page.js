'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const cardStyle = {
  background: '#fff',
  border: '0.5px solid #e0dbd4',
  borderRadius: '4px',
  padding: '24px',
  marginBottom: '20px',
};

const inputStyle = {
  width: '100%',
  padding: '11px',
  border: '0.5px solid #e0dbd4',
  background: '#fafaf8',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.875rem',
  outline: 'none',
  borderRadius: '2px',
  boxSizing: 'border-box',
  color: '#0f0f0f',
  marginBottom: '14px',
};

const buttonStyle = {
  background: '#1a0a2e',
  color: '#fff',
  border: 'none',
  padding: '12px 24px',
  cursor: 'pointer',
  borderRadius: '2px',
  fontSize: '0.75rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 600,
};

export default function ShoppingAdminDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [shopping, setShopping] = useState(null);
  const [stats, setStats] = useState({ storesCount: 0, productsCount: 0 });

  // Onboarding form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoading(true);
    try {
      const res = await fetch('/api/shopping-admin/config');
      const data = await res.ok ? await res.json() : null;
      if (data && !data.onboarding) {
        setShopping(data);
        // Load stats
        const [storesRes, prodsRes] = await Promise.all([
          fetch('/api/shopping-admin/stores'),
          fetch('/api/shopping-admin/products'),
        ]);
        const stores = await storesRes.json();
        const prods = await prodsRes.json();
        setStats({
          storesCount: Array.isArray(stores) ? stores.length : 0,
          productsCount: Array.isArray(prods) ? prods.length : 0,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Auto-slugify when writing name
  function handleNameChange(val) {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setSlug(generatedSlug);
  }

  async function handleOnboardingSubmit(e) {
    e.preventDefault();
    if (!name || !slug) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/shopping-admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear el shopping');
      setShopping(data);
      fetchConfig();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center', color: '#6b6560' }}>Cargando panel...</div>;
  }

  // 1. Onboarding View
  if (!shopping) {
    return (
      <div style={{ padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)', maxWidth: '600px', margin: '40px auto' }}>
        <div style={cardStyle}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: '1.8rem', margin: '0 0 10px', letterSpacing: '0.02em' }}>
            ¡Bienvenido a tu Shopping Virtual!
          </h1>
          <p style={{ color: '#6b6560', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '24px' }}>
            Antes de comenzar a añadir locales y prendas, debés crear la identidad y enlace de tu shopping.
            Tus clientes podrán navegar todas tus marcas agrupadas desde una portada unificada.
          </p>

          <form onSubmit={handleOnboardingSubmit}>
            {error && (
              <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', color: '#c0392b', fontSize: '0.8rem' }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' }}>
                Nombre de tu Shopping *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                style={inputStyle}
                placeholder="Ej: Galería Florida"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' }}>
                Dirección web exclusiva (Slug/Enlace) *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                style={inputStyle}
                placeholder="ej: galeria-florida"
              />
              <p style={{ margin: '-8px 0 0', color: '#6b6560', fontSize: '0.75rem', lineHeight: 1.4 }}>
                Tu shopping público estará disponible en: <br />
                <strong style={{ color: '#1a0a2e' }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/shopping/${slug || 'mi-shopping'}` : `/shopping/${slug || 'mi-shopping'}`}
                </strong>
              </p>
            </div>

            <button type="submit" disabled={saving} style={buttonStyle}>
              {saving ? 'Creando...' : 'Crear mi Shopping →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Active Dashboard View
  const maxLimit = session?.user?.max_stores ?? 5;
  const directUrl = typeof window !== 'undefined' ? `${window.location.origin}/shopping/${shopping.slug}` : `/shopping/${shopping.slug}`;

  return (
    <div style={{ padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)' }}>
      <div style={{ marginBottom: '32px' }}>
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8b2635', fontWeight: 600 }}>
          PANEL DE ADMINISTRACIÓN
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', margin: '4px 0 6px', letterSpacing: '0.02em' }}>
          {shopping.name}
        </h1>
        <p style={{ margin: 0, color: '#6b6560', fontSize: '0.85rem' }}>
          Configurá la portada de tu shopping, gestioná tus locales comerciales y supervisá tus productos.
        </p>
      </div>

      {/* Grid of stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div style={{ ...cardStyle, marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560' }}>
            Locales Creados
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 300, color: '#0f0f0f', marginTop: '6px' }}>
            {stats.storesCount} <span style={{ fontSize: '1rem', color: '#8b847f' }}>/ {maxLimit}</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6b6560', marginTop: '4px' }}>
            Límite de locales asignado por el administrador.
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560' }}>
            Prendas en Catálogo
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 300, color: '#0f0f0f', marginTop: '6px' }}>
            {stats.productsCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6b6560', marginTop: '4px' }}>
            Productos en todas tus tiendas.
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560' }}>
            Estado de publicación
          </span>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: shopping.active ? '#2e7d32' : '#c0392b', marginRight: '8px'
            }} />
            <span style={{ fontSize: '0.9rem', color: '#0f0f0f', fontWeight: 500 }}>
              {shopping.active ? 'Público y Activo' : 'Pausado (Inactivo)'}
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6b6560', marginTop: '8px' }}>
            Visible para todos tus visitantes.
          </div>
        </div>
      </div>

      {/* Address direct URL */}
      <div style={{ ...cardStyle, borderLeft: '3px solid #1a0a2e', background: '#fafaf8' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6560' }}>
          Dirección URL de tu Shopping
        </h3>
        <a href={directUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: '#009aae', fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all' }}>
          {directUrl}
        </a>
        <p style={{ margin: '6px 0 0', color: '#6b6560', fontSize: '0.78rem' }}>
          Compartí esta dirección web para que tus clientes puedan entrar a ver todas tus marcas.
        </p>
      </div>

      {/* Shortcuts */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, marginBottom: '16px' }}>Acciones rápidas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <Link href="/shopping-admin/config" style={{ textDecoration: 'none' }}>
            <div style={{ ...cardStyle, transition: 'transform 0.2s', cursor: 'pointer', height: '100%', boxSizing: 'border-box' }} className="shortcut-card">
              <h3 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#1a0a2e', fontWeight: 600 }}>Personalizar Portada</h3>
              <p style={{ margin: 0, color: '#6b6560', fontSize: '0.8rem', lineHeight: 1.5 }}>
                Subí tu logotipo, cambiá los colores oficiales, tipografías y el banner gigante de bienvenida del shopping.
              </p>
            </div>
          </Link>

          <Link href="/shopping-admin/stores" style={{ textDecoration: 'none' }}>
            <div style={{ ...cardStyle, transition: 'transform 0.2s', cursor: 'pointer', height: '100%', boxSizing: 'border-box' }} className="shortcut-card">
              <h3 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#1a0a2e', fontWeight: 600 }}>Administrar Tiendas</h3>
              <p style={{ margin: 0, color: '#6b6560', fontSize: '0.8rem', lineHeight: 1.5 }}>
                Creá locales de ropa, configurá sus horarios de atención, números de WhatsApp y probador virtual individual.
              </p>
            </div>
          </Link>

          <Link href="/shopping-admin/products" style={{ textDecoration: 'none' }}>
            <div style={{ ...cardStyle, transition: 'transform 0.2s', cursor: 'pointer', height: '100%', boxSizing: 'border-box' }} className="shortcut-card">
              <h3 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#1a0a2e', fontWeight: 600 }}>Gestionar Prendas</h3>
              <p style={{ margin: 0, color: '#6b6560', fontSize: '0.8rem', lineHeight: 1.5 }}>
                Cargá remeras, pantalones y abrigos en el catálogo de cualquiera de tus locales y definí sus talles y colores.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
