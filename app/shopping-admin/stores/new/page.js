'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

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
  hero_title: '', hero_subtitle: '', hero_button_text: 'Ver catálogo', hero_season: '',
  social_instagram: '', social_whatsapp: '', social_facebook: '',
  contact_email: '', contact_phone: '',
};

const lbl = { display: 'block', marginBottom: '4px', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1e293b', fontWeight: 700 };
const inp = { width: '100%', padding: '12px 14px', border: '1px solid #e0dbd4', background: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', outline: 'none', borderRadius: '6px', boxSizing: 'border-box', color: '#0f0f0f', transition: 'border-color 0.2s' };
const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' };
const h2s = { fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.35rem', margin: '0 0 4px', color: '#0f172a' };
const descStyle = { fontSize: '0.75rem', color: '#475569', marginTop: '3px', marginBottom: '12px', lineHeight: '1.4' };
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

const STEPS = [
  { num: 1, title: 'Identidad', desc: 'Nombre y URL' },
  { num: 2, title: 'Colores', desc: 'Paleta visual' },
  { num: 3, title: 'Fuentes', desc: 'Tipografía de la web' },
  { num: 4, title: 'Portada', desc: 'Mensaje de bienvenida' },
  { num: 5, title: 'Multimedia', desc: 'Logo y carrusel' },
  { num: 6, title: 'Horarios', desc: 'WhatsApp y horas' },
  { num: 7, title: 'Categorías', desc: 'Catálogo' },
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
  const [slugManual,    setSlugManual]    = useState(false);
  const [previewTab,     setPreviewTab]     = useState('store'); // 'store' o 'cart'
  const carouselRef = useRef(null);

  // Contacto y horarios
  const [waNumber,     setWaNumber]     = useState('');
  const [waAddress,    setWaAddress]    = useState('');
  const [waPickup,     setWaPickup]     = useState('');
  const [storeHours,   setStoreHours]   = useState(DEFAULT_HOURS_SA);

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
    return null;
  }

  function nextStep() {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (currentStep < 7) {
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
    const validationError = validateStep(7);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true); setError('');
    try {
      // 1. Crear tienda
      const res = await fetch('/api/shopping-admin/stores', {
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
        await fetch(`/api/shopping-admin/stores/${storeId}/logo`, { method: 'POST', body: fd });
      }

      // 3. Subir imágenes del carrusel con captions
      for (let i = 0; i < carouselFiles.length; i++) {
        const fd = new FormData();
        fd.append('file', carouselFiles[i].file);
        fd.append('sort_order', String(i));
        fd.append('caption', carouselFiles[i].caption || '');
        await fetch(`/api/shopping-admin/stores/${storeId}/images`, { method: 'POST', body: fd });
      }

      // 4. Crear categorías e imágenes
      for (const cat of categories) {
        const catRes = await fetch(`/api/shopping-admin/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cat.name, store_id: storeId }),
        });
        const catData = await catRes.json();
        if (catRes.ok && cat.imageFile) {
          const fd = new FormData();
          fd.append('image', cat.imageFile);
          await fetch(`/api/shopping-admin/stores/${storeId}/categories/${catData.id}`, {
            method: 'PUT',
            body: fd,
          });
        }
      }

      toast.success('¡Tienda comercial creada correctamente!');
      router.push('/shopping-admin/stores');
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
      <Toaster />
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: '1.8rem', margin: 0, letterSpacing: '0.02em', color: '#0f172a' }}>
            Alta de Marca / Local
          </h1>
          <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '0.8rem' }}>
            Diseñá y configurá el probador y catálogo de tu nueva marca paso a paso.
          </p>
        </div>
      </div>

      {/* Indicador de pasos */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {STEPS.map(s => (
          <div key={s.num} style={{
            flex: '1 1 110px', padding: '10px 14px', borderRadius: '8px',
            background: currentStep === s.num ? '#1a0a2e' : '#fff',
            color: currentStep === s.num ? '#fff' : '#475569',
            border: '1px solid #e2e8f0', transition: 'all 0.2s', fontSize: '0.72rem'
          }}>
            <div style={{ fontWeight: 700, opacity: currentStep === s.num ? 1 : 0.5, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em' }}>Paso {s.num}</div>
            <div style={{ fontWeight: 600, marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{s.title}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
        
        {/* Formulario */}
        <div style={{ minWidth: 0 }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#c0392b', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.8rem', fontWeight: 500 }}>{error}</div>}

          {/* Paso 1: Identidad */}
          {currentStep === 1 && (
            <div style={card}>
              <h2 style={h2s}>1. Datos básicos de identidad</h2>
              <p style={descStyle}>Escribí el nombre y definí la URL exclusiva del nuevo local comercial.</p>

              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Nombre de tu local/marca *</label>
                <input type="text" required value={form.name} onChange={handleNameChange} style={inp} placeholder="Ej: Bloom Boutique" />
                <p style={descStyle}>El nombre público comercial (ej: "Bloom Boutique"). Así aparecerá en las cabeceras, menús y pie de página de su sitio.</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Dirección web única (enlace/slug) *</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" required value={form.slug} onChange={e => { setSlugManual(true); setForm({ ...form, slug: slugify(e.target.value) }); }} style={inp} placeholder="ej-bloom-boutique" />
                </div>
                <p style={descStyle}>La URL amigable para entrar directo a esta tienda. Se autogenera al escribir el nombre.</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Lema o frase corta de tu local</label>
                <input type="text" value={form.tagline} onChange={set('tagline')} style={inp} placeholder="Ej: Vestite con estilo y comodidad" />
                <p style={descStyle}>Una frase corta descriptiva para presentarse (ej: "Moda femenina y accesorios"). Aparece abajo del nombre de tu tienda para resumir rápido qué vendés.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
            </div>
          )}

          {/* Paso 2: Colores */}
          {currentStep === 2 && (
            <div style={card}>
              <h2 style={h2s}>2. Colores y Estilos Visuales</h2>
              <p style={descStyle}>Elegí la paleta de colores oficial de tu catálogo. El simulador de la derecha se actualizará en tiempo real para mostrarte cómo queda.</p>

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

          {/* Paso 3: Fuentes */}
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
            </div>
          )}

          {/* Paso 4: Portada */}
          {currentStep === 4 && (
            <div style={card}>
              <h2 style={h2s}>4. Portada de la tienda (Banner Principal)</h2>
              <p style={descStyle}>La portada o "Hero" es la marquesina de bienvenida al inicio de tu web. Es lo primero que ven tus clientes al entrar.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={lbl}>Título de la Portada</label>
                  <input type="text" value={form.hero_title} onChange={set('hero_title')} style={inp} placeholder="Ej: Bienvenidos a Bloom Boutique" />
                  <p style={descStyle}>El encabezado principal o saludo gigante de la portada de tu web.</p>
                </div>
                <div>
                  <label style={lbl}>Subtítulo o Anuncio Promocional</label>
                  <input type="text" value={form.hero_subtitle} onChange={set('hero_subtitle')} style={inp} placeholder="Ej: 3 cuotas sin interés en todo el local" />
                  <p style={descStyle}>Frase corta promocional o informativa que va debajo de tu título principal.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={lbl}>Texto del Botón Principal</label>
                  <input type="text" value={form.hero_button_text} onChange={set('hero_button_text')} style={inp} placeholder="Ej: Ver catálogo" />
                  <p style={descStyle}>El llamado a la acción del botón de la portada (ej: "Explorar Colección" o "Ver Catálogo").</p>
                </div>
                <div>
                  <label style={lbl}>Texto destacado (Etiqueta de temporada)</label>
                  <input type="text" value={form.hero_season} onChange={set('hero_season')} style={inp} placeholder="Ej: Nueva Colección 2026" />
                  <p style={descStyle}>Una etiqueta flotante opcional arriba del título principal (ej: "NUEVO", "TEMPORADA 2026").</p>
                </div>
              </div>

              <div>
                <label style={lbl}>Sobre tu marca (Historia o Quiénes Somos)</label>
                <textarea value={form.about_text} onChange={set('about_text')} rows={4} style={{ ...inp, resize: 'vertical' }} placeholder="Escribí un breve párrafo contando los valores, origen o propuesta de tu local..." />
                <p style={descStyle}>Sección informativa al final de la página donde contás la historia y propuesta de valor de tu marca. Esto te ayudará a generar confianza con tus clientes.</p>
              </div>
            </div>
          )}

          {/* Paso 5: Multimedia */}
          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={card}>
                <h2 style={h2s}>Logotipo oficial de tu marca</h2>
                <p style={descStyle}>Subí tu logotipo oficial. Te aconsejamos usar un formato con fondo transparente (PNG) y de forma alargada u horizontal para que se adapte perfectamente arriba de tu sitio.</p>

                {logoPreview && (
                  <div style={{ marginBottom: '14px', background: '#fafaf8', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'inline-block' }}>
                    <img src={logoPreview} alt="Vista previa del Logo" style={{ height: '50px', display: 'block' }} />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ fontSize: '0.85rem' }} />
              </div>

              <div style={card}>
                <h2 style={h2s}>Fotos de Portada (Carrusel de imágenes)</h2>
                <p style={descStyle}>Subí una o más fotos grandes que se irán mostrando en secuencia al inicio de tu web. Se recomiendan fotos rectangulares horizontales y de buena definición.</p>

                <div style={{ marginBottom: '14px' }}>
                  <input type="file" accept="image/*" multiple onChange={handleCarouselChange} style={{ fontSize: '0.85rem' }} />
                </div>

                {carouselFiles.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                    {carouselFiles.map((f, i) => (
                      <div key={i} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', background: '#fafaf8' }}>
                        <img src={f.preview} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                        <div style={{ padding: '6px' }}>
                          <input type="text" value={f.caption} onChange={e => handleCarouselCaptionChange(i, e.target.value)} placeholder="Frase foto..." style={{ ...inp, padding: '4px 6px', fontSize: '0.7rem', marginBottom: '6px' }} />
                          <button type="button" onClick={() => removeCarouselFile(i)} style={{ width: '100%', border: '1px solid #fee2e2', color: '#dc2626', background: '#fff', fontSize: '0.62rem', padding: '4px', cursor: 'pointer', borderRadius: '3px', fontWeight: 600 }}>Quitar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paso 6: Horarios */}
          {currentStep === 6 && (
            <div style={card}>
              <h2 style={h2s}>6. Canales de Contacto y Horarios</h2>
              <p style={descStyle}>Configurá el número de WhatsApp a donde te llegarán los pedidos de compra, la dirección de tu local y tus horarios de atención comercial.</p>

              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>WhatsApp para recibir pedidos *</label>
                <input type="text" value={waNumber} onChange={e => setWaNumber(e.target.value)} style={inp} placeholder="Ej: 5491133334444" />
                <p style={descStyle}>El número telefónico donde vas a recibir los carritos de compra armados. Escribilo completo y todo corrido, sin el símbolo "+", sin espacios ni guiones. Ejemplo en Argentina: 5491133334444 (código de país 54 + prefijo de celular 9 + código de área 11 + número).</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={lbl}>Dirección de tu Local Físico o Showroom</label>
                  <textarea value={waAddress} onChange={e => setWaAddress(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="Ej: Av. Santa Fe 1234, CABA" />
                  <p style={descStyle}>Completá la dirección física de tu local o showroom únicamente si tenés atención presencial al público.</p>
                </div>
                <div>
                  <label style={lbl}>Indicaciones para el retiro (Pickup)</label>
                  <textarea value={waPickup} onChange={e => setWaPickup(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="Ej: Retiros de Lunes a Viernes de 12 a 19 hs. Coordinar cita previa." />
                  <p style={descStyle}>Instrucciones claras para tus clientes si eligen retirar sus productos de forma presencial (ej: "Coordinar día por WhatsApp, timbre 4B").</p>
                </div>
              </div>

              {/* Redes sociales */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginBottom: '20px' }}>
                <h3 style={{ ...lbl, color: '#009aae', marginBottom: '12px' }}>Redes sociales y Soporte</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                  <div><label style={lbl}>Usuario de Instagram</label><input type="text" value={form.social_instagram} onChange={set('social_instagram')} style={inp} placeholder="Ej: @mi.marca" /></div>
                  <div><label style={lbl}>Enlace directo de WhatsApp</label><input type="text" value={form.social_whatsapp} onChange={set('social_whatsapp')} style={inp} placeholder="Ej: https://wa.me/54911..." /></div>
                  <div><label style={lbl}>Página de Facebook</label><input type="text" value={form.social_facebook} onChange={set('social_facebook')} style={inp} placeholder="Ej: facebook.com/mi.marca" /></div>
                  <div><label style={lbl}>Email de Soporte</label><input type="email" value={form.contact_email} onChange={set('contact_email')} style={inp} placeholder="Ej: soporte@mi.marca.com" /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Teléfono de línea o contacto</label><input type="text" value={form.contact_phone} onChange={set('contact_phone')} style={inp} placeholder="Ej: 011 4444-5555" /></div>
                </div>
              </div>

              {/* Horarios */}
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '20px' }}>
                <label style={lbl}>Días y Horarios de Atención al Público</label>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Día', 'Abierto', 'Apertura', 'Cierre'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {storeHours.map((h, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', color: '#334155', fontWeight: 500 }}>{DAY_NAMES_SA[h.day_of_week]}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <input type="checkbox" checked={h.is_open} onChange={e => setStoreHours(prev => prev.map((x, j) => j === i ? { ...x, is_open: e.target.checked } : x))} />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input type="time" value={h.open_time} disabled={!h.is_open} onChange={e => setStoreHours(prev => prev.map((x, j) => j === i ? { ...x, open_time: e.target.value } : x))} style={{ ...inp, width: 'auto', padding: '4px 6px', fontSize: '0.75rem', marginBottom: 0, opacity: h.is_open ? 1 : 0.4 }} />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input type="time" value={h.close_time} disabled={!h.is_open} onChange={e => setStoreHours(prev => prev.map((x, j) => j === i ? { ...x, close_time: e.target.value } : x))} style={{ ...inp, width: 'auto', padding: '4px 6px', fontSize: '0.75rem', marginBottom: 0, opacity: h.is_open ? 1 : 0.4 }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Paso 7: Categorías */}
          {currentStep === 7 && (
            <div style={card}>
              <h2 style={h2s}>7. Categorías de Ropa (Secciones del catálogo)</h2>
              <p style={descStyle}>Organizá tus prendas creando secciones o divisiones (ej: 'Remeras', 'Jeans', 'Vestidos'). Para una experiencia súper visual e intuitiva para tus clientes, te recomendamos subir una linda foto representativa para cada categoría.</p>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <input type="text" value={catInput} onChange={e => setCatInput(e.target.value)} style={{ ...inp, marginBottom: 0 }} placeholder="Nueva categoría (ej: Remeras)" />
                <button type="button" onClick={addCategory} style={{ ...buttonStyle, padding: '10px 18px' }}>+ Agregar</button>
              </div>

              {categories.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Sin categorías asignadas.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                  {categories.map((c, i) => (
                    <div key={c.tempId} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#fafaf8' }}>
                      <div style={{ height: '90px', background: c.imagePreview ? 'transparent' : (form.primary_color || '#009aae'), position: 'relative' }}>
                        {c.imagePreview && <img src={c.imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', textShadow: '0 1px 3px rgba(0,0,0,0.5)', padding: '0 5px', textTransform: 'uppercase' }}>
                            {c.name}
                          </span>
                        </div>
                      </div>
                      <div style={{ padding: '8px' }}>
                        <label style={{ display: 'block', width: '100%', textAlign: 'center', padding: '5px', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', marginBottom: '4px', fontWeight: 600 }}>
                          Foto
                          <input type="file" accept="image/*" onChange={e => handleCategoryImageChange(c.tempId, e.target.files[0])} style={{ display: 'none' }} />
                        </label>
                        <button type="button" onClick={() => removeCategory(c.tempId)} style={{ width: '100%', border: '1px solid #fee2e2', color: '#dc2626', background: '#fff', fontSize: '0.62rem', padding: '4px', cursor: 'pointer', borderRadius: '3px', fontWeight: 600 }}>Quitar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Botones de navegación */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            <button type="button" onClick={prevStep} disabled={currentStep === 1} style={{ ...buttonStyle, background: '#fff', color: '#475569', border: '1px solid #cbd5e1', opacity: currentStep === 1 ? 0.5 : 1 }}>Atrás</button>
            {currentStep < 7 ? (
              <button type="button" onClick={nextStep} style={buttonStyle}>Continuar</button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={saving} style={{ ...buttonStyle, background: '#8b2635' }}>
                {saving ? 'Guardando local...' : 'Finalizar y Crear Local'}
              </button>
            )}
          </div>
        </div>

        {/* Simulador */}
        <aside style={{ position: 'sticky', top: '20px' }}>
          <h3 style={{ ...lbl, marginBottom: '8px' }}>Simulador en tiempo real</h3>
          <div style={{
            border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden',
            background: form.primary_color || '#fafaf8', color: '#000',
            boxShadow: '0 4px 6px rgba(0,0,0,0.02)', minHeight: '480px', display: 'flex', flexDirection: 'column'
          }}>
            {/* Header simulador */}
            <div style={{ background: form.header_color || form.primary_color || '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', alignItems: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: form.font_family }}>
                {logoSrc ? <img src={logoSrc} alt="" style={{ height: '20px', maxWidth: '80px', objectFit: 'contain' }} /> : (form.name || 'MI MARCA')}
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.65rem', fontWeight: 600 }}>
                <span>INICIO</span>
                <span>PRODUCTOS</span>
              </div>
            </div>

            {/* Hero simulador */}
            <div style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', background: '#f1f5f9', position: 'relative' }}>
              {carouselFiles.length > 0 && <img src={carouselFiles[0].preview} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }} />}
              <span style={{ fontSize: '0.55rem', fontWeight: 700, color: form.secondary_color || '#475569', letterSpacing: '0.1em' }}>{form.hero_season || 'NUEVA COLECCIÓN'}</span>
              <h4 style={{ margin: '6px 0 4px', fontSize: '1.2rem', fontFamily: form.font_family, fontWeight: 700, color: form.secondary_color || '#0f172a' }}>{form.hero_title || 'Colección Primavera'}</h4>
              <p style={{ margin: '0 0 12px', fontSize: '0.65rem', color: '#475569' }}>{form.hero_subtitle || '3 cuotas sin interés'}</p>
              <div>
                <button type="button" style={{ background: form.accent_color || '#0f172a', color: '#fff', border: 'none', padding: '6px 12px', fontSize: '0.65rem', borderRadius: radius }}>
                  {form.hero_button_text || 'Comprar'}
                </button>
              </div>
            </div>

            {/* Footer simulador */}
            <div style={{ background: form.footer_color || '#0f172a', color: '#94a3b8', padding: '12px 16px', fontSize: '0.55rem', textAlign: 'center' }}>
              <div>© 2026 {form.name || 'Mi Marca'}.</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
