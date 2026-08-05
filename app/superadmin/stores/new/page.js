'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const FONTS = ['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Poppins', 'Raleway', 'Open Sans', 'Lato', 'Nunito', 'Oswald'];
const BUTTON_STYLES = [
  { value: 'sharp',   label: 'Sharp (Cuadrado)' },
  { value: 'rounded', label: 'Rounded (Bordes redondeados)' },
  { value: 'pill',    label: 'Pill (Cápsula redondeada)' },
];

const DAY_NAMES_SA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DEFAULT_HOURS_SA = Array.from({ length: 7 }, (_, i) => ({
  day_of_week: i,
  is_open: i !== 0,
  open_time: '09:00',
  close_time: '18:00',
}));

const EMPTY = {
  name: '', slug: '', tagline: '', about_text: '', active: true, is_independent: false,
  primary_color: '#009aae', secondary_color: '#ffffff', accent_color: '#0f0f0f',
  header_color: '', footer_color: '',
  panel_bg_color: '', panel_text_color: '',
  header_font: '', header_font_size: '', header_text_color: '',
  footer_font: '', footer_font_size: '', footer_text_color: '',
  font_family: 'Inter', button_style: 'rounded',
  hero_title: '', hero_subtitle: '', hero_button_text: 'Ver colección', hero_season: '',
  social_instagram: '', social_whatsapp: '', social_facebook: '',
  contact_email: '', contact_phone: '',
};

const lbl = { display: 'block', marginBottom: '4px', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1e293b', fontWeight: 700 };
const inp = { width: '100%', padding: '12px 14px', border: '1px solid #e0dbd4', background: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', outline: 'none', borderRadius: '6px', boxSizing: 'border-box', color: '#0f0f0f', transition: 'border-color 0.2s' };
const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' };
const h2s = { fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.35rem', margin: '0 0 4px', color: '#0f172a' };
const descStyle = { fontSize: '0.75rem', color: '#475569', marginTop: '3px', marginBottom: '12px', lineHeight: '1.4' };

const STEPS = [
  { num: 1, title: 'Identidad', desc: 'Nombre y URL' },
  { num: 2, title: 'Colores', desc: 'Paleta visual' },
  { num: 3, title: 'Fuentes', desc: 'Tipografía de la web' },
  { num: 4, title: 'Portada', desc: 'Mensaje de bienvenida' },
  { num: 5, title: 'Multimedia', desc: 'Logo y carrusel' },
  { num: 6, title: 'Horarios', desc: 'WhatsApp y horas' },
  { num: 7, title: 'Categorías', desc: 'Catálogo' },
  { num: 8, title: 'Admin', desc: 'Asignar acceso' },
];

function ColorField({ label, value, explanation, onChange }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={lbl}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ position: 'relative', width: '48px', height: '42px', borderRadius: '6px', border: '1px solid #cbd5e1', overflow: 'hidden', flexShrink: 0 }}>
          <input type="color" value={value || '#fafaf8'} onChange={e => onChange(e.target.value)} style={{ position: 'absolute', top: '-10px', left: '-10px', width: '68px', height: '62px', border: 'none', cursor: 'pointer', background: 'none' }} />
        </div>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} style={{ ...inp, fontFamily: 'monospace' }} placeholder="#ffffff" />
      </div>
      {explanation && <p style={descStyle}>{explanation}</p>}
    </div>
  );
}

function slugify(name) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

export default function NewStorePage() {
  const router = useRouter();
  const [currentStep,   setCurrentStep]   = useState(1);
  const [form,          setForm]          = useState(EMPTY);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [categories,    setCategories]    = useState([]);
  const [catInput,      setCatInput]      = useState('');
  const [logoFile,      setLogoFile]      = useState(null);
  const [logoPreview,   setLogoPreview]   = useState(null);
  const [carouselFiles, setCarouselFiles] = useState([]);
  const [adminMode,     setAdminMode]     = useState('new');
  const [adminForm,     setAdminForm]     = useState({ username: '', email: '', password: '' });
  const [freeAdmins,    setFreeAdmins]    = useState([]);
  const [assignAdminId, setAssignAdminId] = useState('');
  const [slugManual,    setSlugManual]    = useState(false);
  const [previewTab,     setPreviewTab]     = useState('store'); // 'store' o 'cart'
  const carouselRef = useRef(null);

  // Contacto y horarios
  const [waNumber,     setWaNumber]     = useState('');
  const [waAddress,    setWaAddress]    = useState('');
  const [waPickup,     setWaPickup]     = useState('');
  const [storeHours,   setStoreHours]   = useState(DEFAULT_HOURS_SA);

  useEffect(() => {
    fetch('/api/superadmin/users?role=admin&no_store=1')
      .then(r => r.ok ? r.json() : [])
      .then(d => setFreeAdmins(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  function set(key) { return e => setForm({ ...form, [key]: e.target.value }); }

  function handleNameChange(e) {
    const name = e.target.value;
    setForm(prev => ({ ...prev, name, slug: slugManual ? prev.slug : slugify(name) }));
  }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleCarouselChange(e) {
    const files = Array.from(e.target.files);
    setCarouselFiles(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f), caption: '' }))]);
  }

  function handleCarouselCaptionChange(idx, val) {
    setCarouselFiles(prev => prev.map((item, i) => i === idx ? { ...item, caption: val } : item));
  }

  function removeCarouselFile(idx) {
    setCarouselFiles(prev => {
      const target = prev[idx];
      if (target && target.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, i) => i !== idx);
    });
  }

  function addCategory(e) {
    e.preventDefault();
    const name = catInput.trim();
    if (!name || categories.some(c => c.name.toLowerCase() === name.toLowerCase())) return;
    setCategories(prev => [...prev, { tempId: Math.random().toString(36).substr(2, 9), name, imageFile: null, imagePreview: null }]);
    setCatInput('');
  }

  function handleCategoryImageChange(tempId, file) {
    if (!file) return;
    setCategories(prev => prev.map(c => {
      if (c.tempId !== tempId) return c;
      if (c.imagePreview) URL.revokeObjectURL(c.imagePreview);
      return { ...c, imageFile: file, imagePreview: URL.createObjectURL(file) };
    }));
  }

  function removeCategory(tempId) {
    setCategories(prev => {
      const target = prev.find(c => c.tempId === tempId);
      if (target && target.imagePreview) {
        URL.revokeObjectURL(target.imagePreview);
      }
      return prev.filter(c => c.tempId !== tempId);
    });
  }

  function validateStep(s) {
    setError('');
    if (s === 1) {
      if (!form.name?.trim()) return 'El nombre de la tienda es requerido.';
      if (!form.slug?.trim()) return 'La dirección URL (Slug) es requerida.';
    }
    if (s === 6) {
      if (waNumber && !/^\d+$/.test(waNumber.replace(/\D/g, ''))) {
        return 'El número de WhatsApp de pedidos debe contener solo números.';
      }
    }
    if (s === 8) {
      if (adminMode === 'new') {
        if ((adminForm.username || adminForm.email || adminForm.password) && 
            (!adminForm.username || !adminForm.email || !adminForm.password)) {
          return 'Si completas los datos del administrador, todos los campos (Usuario, Email y Contraseña) son obligatorios.';
        }
      }
    }
    return null;
  }

  function nextStep() {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (currentStep < 8) {
      setCurrentStep(c => c + 1);
      window.scrollTo(0, 0);
    }
  }

  function prevStep() {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(c => c - 1);
      window.scrollTo(0, 0);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validateStep(8);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true); setError('');
    try {
      // 1. Crear tienda
      const res = await fetch('/api/superadmin/stores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          whatsapp_number: waNumber.trim(),
          address: waAddress.trim(),
          pickup_info: waPickup.trim(),
          hours: storeHours,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const storeId = data.id;

      // 2. Subir logo
      if (logoFile) {
        const fd = new FormData(); fd.append('logo', logoFile);
        await fetch(`/api/superadmin/stores/${storeId}/logo`, { method: 'POST', body: fd });
      }

      // 3. Subir imágenes del carrusel con captions
      for (let i = 0; i < carouselFiles.length; i++) {
        const fd = new FormData();
        fd.append('image', carouselFiles[i].file);
        fd.append('sort_order', String(i));
        fd.append('caption', carouselFiles[i].caption || '');
        await fetch(`/api/superadmin/stores/${storeId}/images`, { method: 'POST', body: fd });
      }

      // 4. Crear categorías e imágenes
      for (const cat of categories) {
        const catRes = await fetch(`/api/superadmin/stores/${storeId}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cat.name }),
        });
        const catData = await catRes.json();
        if (catRes.ok && cat.imageFile) {
          const fd = new FormData();
          fd.append('image', cat.imageFile);
          await fetch(`/api/superadmin/stores/${storeId}/categories/${catData.id}`, {
            method: 'PUT',
            body: fd,
          });
        }
      }

      // 5. Admin
      if (adminMode === 'new' && adminForm.username && adminForm.email && adminForm.password) {
        await fetch('/api/superadmin/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...adminForm, role: 'admin', store_id: storeId }),
        });
      } else if (adminMode === 'assign' && assignAdminId) {
        await fetch(`/api/superadmin/users/${assignAdminId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ store_id: storeId }),
        });
      }

      router.push('/superadmin/stores');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const radius = form.button_style === 'pill' ? '999px' : form.button_style === 'sharp' ? '0px' : '6px';
  const logoSrc = logoPreview || null;

  const activeFonts = form ? Array.from(new Set([
    form.font_family,
    form.header_font,
    form.footer_font
  ].filter(Boolean))) : [];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {activeFonts.map(f => (
        <link key={f} rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`} />
      ))}
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: '1.8rem', margin: 0, letterSpacing: '0.02em', color: '#0f172a' }}>
            Creador de Tiendas
          </h1>
          <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>
            Asistente paso a paso para configurar una nueva marca.
          </p>
        </div>
        <button type="button" onClick={() => router.push('/superadmin/stores')} style={{ background: 'none', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px', fontSize: '0.75rem', color: '#475569', fontWeight: 500 }}>
          Volver a tiendas
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '14px 18px', borderRadius: '8px', marginBottom: '24px', color: '#991b1b', fontSize: '0.8rem', fontWeight: 500 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Contenedor Flex del Formulario + Sticky Preview */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* COLUMNA IZQUIERDA: Formulario */}
        <div style={{ flex: '1 1 540px', minWidth: '320px' }}>
          
          {/* Barra de progreso */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', gap: '12px' }}>
              {STEPS.map((s) => {
                const isActive = s.num === currentStep;
                const isCompleted = s.num < currentStep;
                return (
                  <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, minWidth: '60px', cursor: 'pointer' }} onClick={() => {
                    if (s.num < currentStep || !validateStep(currentStep)) {
                      setCurrentStep(s.num);
                      setError('');
                    }
                  }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.78rem', fontWeight: 700,
                      background: isActive ? '#009aae' : isCompleted ? '#e0f2fe' : '#f1f5f9',
                      color: isActive ? '#fff' : isCompleted ? '#0369a1' : '#64748b',
                      transition: 'all 0.2s', marginBottom: '4px'
                    }}>
                      {isCompleted ? '✓' : s.num}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#0f172a' : '#64748b', whiteSpace: 'nowrap' }}>
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PASO 1: Identidad */}
          {currentStep === 1 && (
            <div style={card}>
              <h2 style={h2s}>1. Datos básicos de identidad</h2>
              <p style={descStyle}>Configurá el nombre público de tu tienda, su dirección web única y cómo se mostrará a tus clientes en internet.</p>

              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Nombre comercial de la tienda *</label>
                <input type="text" required value={form.name} onChange={handleNameChange} style={inp} placeholder="Ej: Bloom Boutique" />
                <p style={descStyle}>El nombre público de tu marca o local comercial (ej: "Bloom Boutique"). Así aparecerá en las cabeceras, menús y pie de página de tu sitio.</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Dirección web única (enlace/slug) *</label>
                <input type="text" required value={form.slug}
                  onChange={e => { setSlugManual(true); setForm({ ...form, slug: e.target.value }); }}
                  style={{ ...inp, fontFamily: 'monospace' }} placeholder="ej: bloom-boutique" />
                <p style={descStyle}>Dirección web única. Usá solo letras minúsculas, números y guiones, sin espacios. Ejemplo: "bloom-boutique" (tu tienda se podrá visitar en /store/bloom-boutique)</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Lema o frase corta de tu marca</label>
                <input type="text" value={form.tagline} onChange={set('tagline')} style={inp} placeholder="Ej: Vestite con estilo y comodidad" />
                <p style={descStyle}>Una frase corta promocional que acompaña al nombre de la tienda para resumir rápidamente lo que ofrecés (ej: "Moda femenina y accesorios").</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'flex-start' }}>
                <div>
                  <label style={lbl}>Tipo de publicación</label>
                  <select value={form.is_independent ? 'independent' : 'shopping'} 
                    onChange={e => setForm({ ...form, is_independent: e.target.value === 'independent' })} 
                    style={inp}>
                    <option value="shopping">Aparecer en el Shopping (Catálogo central)</option>
                    <option value="independent">Tienda Independiente (Página privada y exclusiva)</option>
                  </select>
                  <p style={descStyle}>
                    {form.is_independent 
                      ? 'Página Independiente: Tu tienda tendrá un sitio web exclusivo (URL única). Ideal si querés difundir tu marca de manera directa y personalizada sin mezclarte con otros locales.'
                      : 'Shopping Virtual: Tu marca se integra al catálogo colectivo de la plataforma. Los clientes te encontrarán buscando en la página de inicio común junto a otras tiendas.'
                    }
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                  <label htmlFor="active" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', cursor: 'pointer', color: '#1e293b', fontWeight: 600 }}>Habilitar tienda (Poner en línea)</label>
                </div>
              </div>

                <p style={{ ...descStyle, marginTop: '8px', marginBottom: '16px' }}>
                  {form.is_independent 
                    ? '✓ Tu tienda tendrá su propia dirección web directa. Funcionará de forma independiente y estará oculta del catálogo central (ideal para tu propia marca o publicidad).'
                    : '✓ Tu tienda aparecerá en el catálogo general, en el buscador multimarca y en las recomendaciones para todos los usuarios.'
                  }
                </p>


              {form.is_independent ? (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '12px' }}>
                  <label style={lbl}>Dirección web (URL) de tu tienda</label>
                  <span style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 600, wordBreak: 'break-all', marginTop: '4px' }}>
                    {form.slug ? (
                      <a href={`/store/${form.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#009aae', textDecoration: 'underline' }}>
                        {typeof window !== 'undefined' ? `${window.location.origin}/store/${form.slug}` : `/store/${form.slug}`}
                      </a>
                    ) : 'Se generará automáticamente cuando escribas el nombre o slug'}
                  </span>
                  <p style={{ ...descStyle, margin: '6px 0 0' }}>
                    Esta tienda está configurada como Página Independiente. Funciona de manera aislada (fuera del shopping), por lo que tus clientes solo podrán ingresar usando este enlace directo.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '12px' }}>
                  <label style={lbl}>Publicación en el Shopping</label>
                  <p style={{ ...descStyle, margin: '0', fontSize: '0.8rem' }}>
                    Esta tienda está configurada como Shopping Virtual. Aparecerá en el catálogo colectivo y en el buscador central de la plataforma para que cualquier visitante la pueda encontrar.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PASO 2: Colores */}
          {currentStep === 2 && (
            <div style={card}>
              <h2 style={h2s}>2. Colores y Estilos Visuales</h2>
              <p style={descStyle}>Elegí la paleta de colores oficial de tu catálogo. El simulador de la derecha cambiará en vivo.</p>

              <ColorField label="Color de Fondo Principal (Primario)" value={form.primary_color} explanation="Fondo de la página. Te sugerimos usar color blanco o un tono gris muy claro para que las fotos de tu ropa se luzcan y contrasten bien." onChange={v => setForm({ ...form, primary_color: v })} />
              <ColorField label="Color de Contraste (Secundario)" value={form.secondary_color} explanation="Color para textos de la portada/banner. Este color se usará para el título y descripción principales de la portada." onChange={v => setForm({ ...form, secondary_color: v })} />
              <ColorField label="Color de Botones de Acción" value={form.accent_color} explanation="Color de los botones más importantes (Comprar y Probarse). Elegí un color que llame la atención (negro, azul oscuro, verde o rojo) para que la gente vea rápido dónde hacer clic." onChange={v => setForm({ ...form, accent_color: v })} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <ColorField label="Fondo del Menú Superior (Header)" value={form.header_color} explanation="Color del Menú Superior. La barra de navegación de arriba. Te recomendamos un tono neutro o el mismo color que el fondo general." onChange={v => setForm({ ...form, header_color: v })} />
                <ColorField label="Fondo del Pie de Página (Footer)" value={form.footer_color} explanation="Color del Pie de Página. La barra inferior al final de tu web. Se suele usar un color oscuro o sobrio." onChange={v => setForm({ ...form, footer_color: v })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <ColorField label="Fondo del Vestidor y Carrito" value={form.panel_bg_color} explanation="Fondo del Carrito y Probador. Color del panel que se desliza por el costado cuando tus clientes prueban prendas o ven sus compras." onChange={v => setForm({ ...form, panel_bg_color: v })} />
                <ColorField label="Texto del Vestidor y Carrito" value={form.panel_text_color} explanation="Color de las letras en Carrito/Probador. Asegurate de que contraste con el fondo elegido arriba para que se lea con facilidad." onChange={v => setForm({ ...form, panel_text_color: v })} />
              </div>
            </div>
          )}

          {/* PASO 3: Fuentes */}
          {currentStep === 3 && (
            <div style={card}>
              <h2 style={h2s}>3. Tipografías de la Web</h2>
              <p style={descStyle}>Elegí la tipografía general (el estilo de letra) y la forma que tendrán tus botones.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={lbl}>Estilo de Letra Principal (Tipografía)</label>
                  <select value={form.font_family} onChange={e => setForm({ ...form, font_family: e.target.value })} style={inp}>
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <p style={descStyle}>El estilo de letra principal que se usará para los nombres de tus productos, descripciones y precios.</p>
                </div>
                <div>
                  <label style={lbl}>Silueta de los Botones</label>
                  <select value={form.button_style} onChange={e => setForm({ ...form, button_style: e.target.value })} style={inp}>
                    {BUTTON_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <p style={descStyle}>Elegí el diseño de tus botones. 'Cuadrado' se ve muy moderno y minimalista, 'Redondeado' es el estilo clásico por excelencia, y 'Cápsula (Pill)' tiene las esquinas totalmente redondeadas, dándole un toque más amigable.</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <h3 style={{ ...lbl, color: '#009aae', marginBottom: '12px' }}>Personalizar tipografías detalladas (Opcional)</h3>
                
                <div style={{ paddingLeft: '12px', borderLeft: '3px solid #cbd5e1', marginBottom: '16px' }}>
                  <p style={{ ...lbl, fontSize: '0.65rem', color: '#475569', marginBottom: '8px' }}>Menú superior (Navbar)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ ...lbl, fontSize: '0.62rem' }}>Familia de letra</label>
                      <select value={form.header_font} onChange={e => setForm({ ...form, header_font: e.target.value })} style={{ ...inp, padding: '8px 10px' }}>
                        <option value="">Igual a la tienda</option>
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...lbl, fontSize: '0.62rem' }}>Tamaño de letra</label>
                      <input type="text" value={form.header_font_size} onChange={e => setForm({ ...form, header_font_size: e.target.value })} style={{ ...inp, padding: '8px 10px' }} placeholder="Ej: 0.75rem" />
                    </div>
                    <div>
                      <label style={{ ...lbl, fontSize: '0.62rem' }}>Color de letra</label>
                      <input type="color" value={form.header_text_color || '#000000'} onChange={e => setForm({ ...form, header_text_color: e.target.value })} style={{ width: '100%', height: '36px', padding: '2px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }} />
                    </div>
                  </div>
                </div>

                <div style={{ paddingLeft: '12px', borderLeft: '3px solid #cbd5e1' }}>
                  <p style={{ ...lbl, fontSize: '0.65rem', color: '#475569', marginBottom: '8px' }}>Pie de página (Footer)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ ...lbl, fontSize: '0.62rem' }}>Familia de letra</label>
                      <select value={form.footer_font} onChange={e => setForm({ ...form, footer_font: e.target.value })} style={{ ...inp, padding: '8px 10px' }}>
                        <option value="">Serif por defecto</option>
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...lbl, fontSize: '0.62rem' }}>Tamaño de letra</label>
                      <input type="text" value={form.footer_font_size} onChange={e => setForm({ ...form, footer_font_size: e.target.value })} style={{ ...inp, padding: '8px 10px' }} placeholder="Ej: 0.9rem" />
                    </div>
                    <div>
                      <label style={{ ...lbl, fontSize: '0.62rem' }}>Color de letra</label>
                      <input type="color" value={form.footer_text_color || '#000000'} onChange={e => setForm({ ...form, footer_text_color: e.target.value })} style={{ width: '100%', height: '36px', padding: '2px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: Hero */}
          {currentStep === 4 && (
            <div style={card}>
              <h2 style={h2s}>4. Portada de la tienda (Banner Principal)</h2>
              <p style={descStyle}>La portada o "Hero" es la marquesina de bienvenida al inicio de tu web. Es lo primero que ven tus clientes al entrar.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div><label style={lbl}>Texto destacado (Etiqueta de temporada)</label><input type="text" value={form.hero_season} onChange={set('hero_season')} style={inp} placeholder="Ej: Nueva Colección 2026" /><p style={descStyle}>Una etiqueta flotante opcional arriba del título principal (ej: "NUEVO", "TEMPORADA 2026").</p></div>
                <div><label style={lbl}>Título de la Portada</label><input type="text" value={form.hero_title} onChange={set('hero_title')} style={inp} placeholder="Ej: Bienvenidos a Bloom Boutique" /><p style={descStyle}>El encabezado principal o saludo gigante de la portada de tu web.</p></div>
                <div><label style={lbl}>Subtítulo o Anuncio Promocional</label><input type="text" value={form.hero_subtitle} onChange={set('hero_subtitle')} style={inp} placeholder="Ej: 3 cuotas sin interés en todo el local" /><p style={descStyle}>Frase corta promocional o informativa que va debajo de tu título principal.</p></div>
                <div><label style={lbl}>Texto del Botón Principal</label><input type="text" value={form.hero_button_text} onChange={set('hero_button_text')} style={inp} placeholder="Ej: Ver catálogo" /><p style={descStyle}>El llamado a la acción del botón de la portada (ej: "Explorar Colección" o "Ver Catálogo").</p></div>
              </div>
              <div>
                <label style={lbl}>Sobre tu marca (Historia o Quiénes Somos)</label>
                <textarea value={form.about_text} onChange={set('about_text')} rows={4} style={{ ...inp, resize: 'vertical' }} placeholder="Escribí un breve párrafo contando los valores, origen o propuesta de tu local..." />
                <p style={descStyle}>Sección informativa al final de la página donde contás la historia y propuesta de valor de tu marca. Esto te ayudará a generar confianza con tus clientes.</p>
              </div>
            </div>
          )}

          {/* PASO 5: Multimedia */}
          {currentStep === 5 && (
            <div style={card}>
              <h2 style={h2s}>5. Logotipo y Portada de tu Marca</h2>
              <p style={descStyle}>Subí la identidad visual de tu tienda. Un lindo logo y buenas fotos harán que tu marca se vea profesional.</p>

              <div style={{ marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                <label style={lbl}>Logo de la marca (Imagen PNG sin fondo recomendada)</label>
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ fontSize: '0.8rem', color: '#475569', cursor: 'pointer', marginBottom: '8px', display: 'block' }} />
                {logoPreview && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src={logoPreview} alt="" style={{ height: '40px', maxWidth: '140px', objectFit: 'contain', background: '#f8fafc', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                    <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); }} style={{ background: 'none', border: '1px solid #f87171', color: '#dc2626', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem' }}>Quitar</button>
                  </div>
                )}
                <p style={descStyle}>Subí tu logotipo oficial. Te aconsejamos usar un formato con fondo transparente (PNG) y de forma alargada u horizontal para que se adapte perfectamente arriba de tu sitio.</p>
              </div>

              <div>
                <label style={lbl}>Fotos de Portada (Carrusel de imágenes)</label>
                <input ref={carouselRef} type="file" accept="image/*" multiple onChange={handleCarouselChange} style={{ display: 'none' }} />
                <button type="button" onClick={() => carouselRef.current?.click()} style={{ padding: '8px 14px', border: '1px solid #009aae', color: '#009aae', background: 'none', cursor: 'pointer', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, marginBottom: '16px' }}>
                  + Subir fotos de portada
                </button>
                <p style={descStyle}>Subí una o más fotos grandes que se irán mostrando en secuencia al inicio de tu web. Se recomiendan fotos en formato horizontal y de buena definición.</p>

                {carouselFiles.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                    {carouselFiles.map((f, i) => (
                      <div key={i} style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', background: '#fff' }}>
                        <img src={f.preview} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                        <div style={{ padding: '6px' }}>
                          <input
                            type="text"
                            value={f.caption}
                            onChange={e => handleCarouselCaptionChange(i, e.target.value)}
                            placeholder="Leyenda..."
                            style={{ ...inp, padding: '5px 8px', fontSize: '0.7rem' }}
                          />
                        </div>
                        <button type="button" onClick={() => removeCarouselFile(i)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(15,23,42,0.8)', border: 'none', color: '#fff', cursor: 'pointer', width: '18px', height: '18px', borderRadius: '50%', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 6: Horarios y Contacto */}
          {currentStep === 6 && (
            <div style={card}>
              <h2 style={h2s}>6. Canales de Contacto y Horarios</h2>
              <p style={descStyle}>Configurá el número de WhatsApp a donde te llegarán los pedidos de compra, la dirección de tu local y tus horarios de atención comercial.</p>

              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>WhatsApp para recibir pedidos *</label>
                <input type="text" value={waNumber} onChange={e => setWaNumber(e.target.value)} style={inp} placeholder="Ej: 5491133334444" />
                <p style={descStyle}>El número telefónico donde vas a recibir los carritos de compra armados. Escribilo completo y todo corrido, sin el símbolo "+", sin espacios ni guiones. Ejemplo en Argentina: 5491133334444 (código de país 54 + prefijo de celular 9 + código de área 11 + número).</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div><label style={lbl}>Dirección de tu Local Físico o Showroom</label><textarea value={waAddress} onChange={e => setWaAddress(e.target.value)} rows={2} style={inp} placeholder="Ej: Av. Santa Fe 1234, CABA" /><p style={descStyle}>Completá la dirección física de tu local o showroom únicamente si tenés atención presencial al público.</p></div>
                <div><label style={lbl}>Indicaciones para el retiro (Pickup)</label><textarea value={waPickup} onChange={e => setWaPickup(e.target.value)} rows={2} style={inp} placeholder="Ej: Retiros de Lunes a Viernes de 12 a 19 hs. Coordinar cita previa." /><p style={descStyle}>Instrucciones claras para tus clientes si eligen retirar sus productos de forma presencial (ej: "Coordinar día por WhatsApp, timbre 4B").</p></div>
              </div>

              {/* Redes */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginBottom: '16px' }}>
                <h3 style={{ ...lbl, color: '#009aae', marginBottom: '10px' }}>Redes sociales y Soporte</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={lbl}>Usuario de Instagram</label><input type="text" value={form.social_instagram} onChange={set('social_instagram')} style={inp} placeholder="Ej: @mi.marca" /></div>
                  <div><label style={lbl}>Enlace directo de WhatsApp</label><input type="text" value={form.social_whatsapp} onChange={set('social_whatsapp')} style={inp} placeholder="Ej: https://wa.me/54911..." /></div>
                  <div><label style={lbl}>Página de Facebook</label><input type="text" value={form.social_facebook} onChange={set('social_facebook')} style={inp} placeholder="Ej: facebook.com/mi.marca" /></div>
                  <div><label style={lbl}>Email de Soporte</label><input type="email" value={form.contact_email} onChange={set('contact_email')} style={inp} placeholder="Ej: soporte@mi.marca.com" /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Teléfono de línea o contacto</label><input type="text" value={form.contact_phone} onChange={set('contact_phone')} style={inp} placeholder="Ej: 011 4444-5555" /></div>
                </div>
              </div>

              {/* Horarios */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <label style={{ ...lbl, marginBottom: '8px' }}>Horarios comerciales</label>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Día', 'Abierto', 'Apertura', 'Cierre'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {storeHours.map((h, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', color: '#334155', fontWeight: 500 }}>{DAY_NAMES_SA[h.day_of_week]}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <input type="checkbox" checked={h.is_open} onChange={e => setStoreHours(prev => prev.map((x, j) => j === i ? { ...x, is_open: e.target.checked } : x))} style={{ cursor: 'pointer' }} />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input type="time" value={h.open_time} disabled={!h.is_open} onChange={e => setStoreHours(prev => prev.map((x, j) => j === i ? { ...x, open_time: e.target.value } : x))} style={{ ...inp, width: 'auto', padding: '4px 6px', fontSize: '0.75rem', opacity: h.is_open ? 1 : 0.4 }} />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input type="time" value={h.close_time} disabled={!h.is_open} onChange={e => setStoreHours(prev => prev.map((x, j) => j === i ? { ...x, close_time: e.target.value } : x))} style={{ ...inp, width: 'auto', padding: '4px 6px', fontSize: '0.75rem', opacity: h.is_open ? 1 : 0.4 }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PASO 7: Categorías */}
          {currentStep === 7 && (
            <div style={card}>
              <h2 style={h2s}>7. Categorías de Ropa (Secciones del catálogo)</h2>
              <p style={descStyle}>Organizá tus prendas creando secciones o divisiones (ej: 'Remeras', 'Jeans', 'Vestidos'). Para una experiencia súper visual e intuitiva para tus clientes, te recomendamos subir una linda foto representativa para cada categoría.</p>

              {categories.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  {categories.map(cat => (
                    <div key={cat.tempId} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                      <div style={{ height: '90px', background: cat.imagePreview ? 'transparent' : (form.primary_color || '#009aae'), position: 'relative', overflow: 'hidden' }}>
                        {cat.imagePreview && <img src={cat.imagePreview} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontFamily: 'var(--font-serif)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>{cat.name}</span>
                        </div>
                      </div>
                      <div style={{ padding: '8px' }}>
                        <label style={{ display: 'block', width: '100%', textAlign: 'center', padding: '5px', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '4px', fontSize: '0.62rem', cursor: 'pointer', marginBottom: '4px', fontWeight: 600 }}>
                          Foto
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => handleCategoryImageChange(cat.tempId, e.target.files[0])} />
                        </label>
                        <button type="button" onClick={() => removeCategory(cat.tempId)}
                          style={{ width: '100%', border: '1px solid #fee2e2', background: 'none', cursor: 'pointer', padding: '4px', fontSize: '0.62rem', borderRadius: '4px', color: '#dc2626', fontWeight: 600 }}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={catInput} onChange={e => setCatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(e); } }} placeholder="Ej: Remeras, Abrigos..." style={{ ...inp, flex: 1 }} />
                <button type="button" onClick={addCategory} disabled={!catInput.trim()} style={{ padding: '10px 18px', background: catInput.trim() ? '#0f172a' : '#cbd5e1', color: '#fff', border: 'none', cursor: catInput.trim() ? 'pointer' : 'not-allowed', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                  + Añadir
                </button>
              </div>
            </div>
          )}

          {/* PASO 8: Admin */}
          {currentStep === 8 && (
            <div style={card}>
              <h2 style={h2s}>8. Administrador de la Tienda</h2>
              <p style={descStyle}>Asigná quién va a poder subir ropa, editar precios y gestionar esta tienda. Podés crear una cuenta de administrador nueva o asignar una cuenta existente libre.</p>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {['new', 'assign'].map(m => (
                  <button key={m} type="button" onClick={() => setAdminMode(m)} style={{ padding: '8px 14px', border: '1px solid', borderColor: adminMode === m ? '#0f172a' : '#cbd5e1', background: adminMode === m ? '#0f172a' : 'none', color: adminMode === m ? '#fff' : '#475569', cursor: 'pointer', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
                    {m === 'new' ? 'Nuevo Administrador' : 'Admin Existente'}
                  </button>
                ))}
              </div>

              {adminMode === 'new' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={lbl}>Usuario *</label><input type="text" value={adminForm.username} onChange={e => setAdminForm({ ...adminForm, username: e.target.value })} style={inp} placeholder="username" /></div>
                  <div><label style={lbl}>Email *</label><input type="email" value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} style={inp} placeholder="email@tienda.com" /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Contraseña *</label><input type="password" value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} style={{ ...inp, maxWidth: '240px' }} placeholder="••••••••" /></div>
                </div>
              ) : (
                <div>
                  {freeAdmins.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>⚠️ No hay administradores libres en el sistema.</p>
                  ) : (
                    <div>
                      <label style={lbl}>Seleccionar Administrador</label>
                      <select value={assignAdminId} onChange={e => setAssignAdminId(e.target.value)} style={{ ...inp, maxWidth: '280px' }}>
                        <option value="">-- Seleccionar --</option>
                        {freeAdmins.map(a => <option key={a.id} value={a.id}>{a.username} ({a.email})</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Botones de navegación */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '24px' }}>
            <div>
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} style={{ padding: '11px 24px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '0.8rem', borderRadius: '6px', color: '#334155', fontWeight: 600 }}>
                  Atrás
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => router.push('/superadmin/stores')} style={{ padding: '11px 22px', border: '1px solid transparent', background: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#64748b' }}>
                Cancelar
              </button>
              {currentStep < 8 ? (
                <button type="button" onClick={nextStep} style={{ padding: '11px 26px', background: '#009aae', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', borderRadius: '6px', fontWeight: 600 }}>
                  Siguiente
                </button>
              ) : (
                <button type="submit" disabled={saving} style={{ padding: '11px 26px', background: saving ? '#cbd5e1' : '#0f172a', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.8rem', borderRadius: '6px', fontWeight: 600 }}>
                  {saving ? 'Creando tienda...' : 'Crear Tienda'}
                </button>
              )}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: Sticky Interactive Mock Store Preview */}
        <div style={{ flex: '1 1 360px', position: 'sticky', top: '24px', alignSelf: 'flex-start', minWidth: '320px' }}>
          
          <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', background: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
            <button type="button" onClick={() => setPreviewTab('store')} style={{ flex: 1, padding: '8px', border: 'none', background: previewTab === 'store' ? '#fff' : 'none', color: previewTab === 'store' ? '#0f172a' : '#475569', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
              📱 Ver Tienda
            </button>
            <button type="button" onClick={() => setPreviewTab('cart')} style={{ flex: 1, padding: '8px', border: 'none', background: previewTab === 'cart' ? '#fff' : 'none', color: previewTab === 'cart' ? '#0f172a' : '#475569', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
              🛒 Ver Carrito/Vestidor
            </button>
          </div>

          <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', background: '#fff', boxShadow: '0 10px 20px rgba(0,0,0,0.06)' }}>
            
            <div style={{ background: '#e2e8f0', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
              </div>
              <div style={{ background: '#fff', fontSize: '0.65rem', color: '#64748b', padding: '3px 12px', borderRadius: '4px', flex: 1, textAlign: 'center', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                tnb.com/store/{form.slug || 'slug'}
              </div>
            </div>

            <div style={{ height: '480px', overflowY: 'auto', background: form.primary_color, position: 'relative', transition: 'all 0.3s' }}>
              
              {previewTab === 'store' ? (
                <div>
                  {/* Mock Navbar */}
                  <div style={{
                    height: '42px',
                    background: form.header_color || '#fafaf8',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 12px', borderBottom: '1px solid rgba(0,0,0,0.08)',
                    position: 'sticky', top: 0, zIndex: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 400, fontFamily: 'serif', color: form.header_text_color || form.primary_color }}>TnB</span>
                      <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>/</span>
                      {logoSrc ? (
                        <img src={logoSrc} alt="" style={{ height: '18px', maxWidth: '60px', objectFit: 'contain' }} />
                      ) : (
                        <span style={{
                          fontFamily: form.header_font || form.font_family,
                          fontSize: form.header_font_size || '0.62rem',
                          color: form.header_text_color || form.accent_color,
                          fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase'
                        }}>
                          {form.name || 'MARCA'}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.58rem', fontFamily: form.header_font || form.font_family, color: form.header_text_color || '#475569', fontWeight: 500 }}>
                      <span>Catálogo</span>
                      <span style={{ fontWeight: 700 }}>🛒 (0)</span>
                    </div>
                  </div>

                  {/* Mock Hero */}
                  <div style={{
                    padding: '36px 16px',
                    background: 'rgba(0,0,0,0.03)',
                    textAlign: 'center',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    fontFamily: form.font_family
                  }}>
                    {form.hero_season && (
                      <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: form.accent_color, fontWeight: 700, display: 'inline-block', marginBottom: '4px' }}>
                        {form.hero_season}
                      </span>
                    )}
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 300, color: form.secondary_color, margin: '0 0 6px' }}>
                      {form.hero_title || 'Mensaje de Bienvenida'}
                    </h3>
                    <p style={{ fontSize: '0.7rem', color: form.secondary_color, opacity: 0.8, margin: '0 auto 12px', maxWidth: '240px' }}>
                      {form.hero_subtitle || 'Subtítulo o descripción de la portada.'}
                    </p>
                    <button type="button" style={{
                      padding: '8px 16px',
                      background: form.accent_color,
                      color: '#fff',
                      border: 'none',
                      borderRadius: radius,
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      cursor: 'default'
                    }}>
                      {form.hero_button_text || 'Ver colección'}
                    </button>
                  </div>

                  {/* Mock products */}
                  <div style={{ padding: '16px', fontFamily: form.font_family }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { name: 'Remera Algodón', price: '$12.000' },
                        { name: 'Pantalon Cargo', price: '$26.500' }
                      ].map((p, idx) => (
                        <div key={idx} style={{ background: '#fff', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                          <div style={{ height: '80px', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👕</div>
                          <div style={{ padding: '8px' }}>
                            <p style={{ fontSize: '0.68rem', fontWeight: 600, color: '#0f172a', margin: '0 0 2px' }}>{p.name}</p>
                            <p style={{ fontSize: '0.62rem', color: '#475569', margin: '0 0 6px' }}>{p.price}</p>
                            <button type="button" style={{ width: '100%', padding: '4px', background: form.accent_color, color: '#fff', border: 'none', borderRadius: radius, fontSize: '0.55rem', fontWeight: 700 }}>
                              Probarse
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mock Footer */}
                  <div style={{
                    background: form.footer_color || '#1a1a1a',
                    padding: '24px 16px',
                    color: form.footer_text_color || '#fafafa',
                    fontFamily: form.footer_font || form.font_family,
                    borderTop: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <h4 style={{ fontSize: '0.8rem', margin: '0 0 4px', textTransform: 'uppercase' }}>{form.name || 'Nueva Tienda'}</h4>
                    {form.tagline && <p style={{ fontSize: '0.62rem', opacity: 0.7, margin: '0 0 12px' }}>{form.tagline}</p>}
                    <div style={{ fontSize: '0.58rem', opacity: 0.6 }}>
                      <p>📧 {form.contact_email || 'contacto@marca.com'}</p>
                      <p>📞 {form.contact_phone || '+54 11 1234-5678'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mock Cart Panel */
                <div style={{
                  padding: '20px 16px',
                  background: form.panel_bg_color || '#fafaf8',
                  color: form.panel_text_color || '#0f0f0f',
                  height: '100%',
                  boxSizing: 'border-box',
                  fontFamily: form.font_family
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '10px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>PROBADOR VIRTUAL</span>
                    <span>✕</span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', height: '320px' }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: '6px', border: '1px dashed rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, opacity: 0.6, marginBottom: '6px' }}>CARRITO</span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', opacity: 0.5 }}>Vacío</div>
                      <button type="button" style={{ width: '100%', padding: '6px', background: form.accent_color, color: '#fff', border: 'none', borderRadius: radius, fontSize: '0.55rem', fontWeight: 700 }}>Comprar</button>
                    </div>
                    <div style={{ flex: 1.2, background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, opacity: 0.6, alignSelf: 'flex-start' }}>VESTIDOR</span>
                      <div style={{ fontSize: '2.5rem', margin: '12px 0' }}>🧍‍♂️</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </form>
    </div>
  );
}
