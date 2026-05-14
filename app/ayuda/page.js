'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const VISITOR_SECTIONS = [
  {
    id: 'explorar', icon: '🛍️', title: 'Explorar tiendas',
    content: `CnB reúne múltiples tiendas de moda en un solo lugar. Desde la página principal podés ver todas las tiendas disponibles y acceder directamente a cada una.\n\nCada tienda tiene su propio estilo, catálogo y experiencia de compra.`,
    link: '/', linkLabel: 'Ir al inicio',
  },
  {
    id: 'carrito', icon: '🛒', title: 'Agregar al carrito',
    content: `1. Explorá los productos de la tienda\n2. Hacé clic en el producto para ver los detalles\n3. Presioná "Agregar al carrito"\n4. Abrí el carrito con el ícono de la bolsa en el navbar\n5. Revisá los productos y finalizá la compra`,
    link: null, linkLabel: null,
  },
  {
    id: 'probador', icon: '👗', title: 'Usar el probador virtual',
    content: `El vestidor virtual te permite "probarte" ropa digitalmente.\n\n1. Subí tu foto de cuerpo entero desde tu perfil\n2. Hacé clic en el ícono del probador en el navbar de la tienda\n3. Agregá prendas al vestidor\n4. Mirá cómo te quedaría la ropa\n\nNecesitás tener el email verificado para usar esta función.`,
    link: '/profile', linkLabel: 'Configurar foto',
  },
  {
    id: 'pedidos', icon: '📦', title: 'Mis pedidos',
    content: `Desde tu perfil podés ver el historial completo de todas tus compras.\n\nCada pedido muestra el estado, los productos comprados y el total.`,
    link: '/profile/orders', linkLabel: 'Ver mis pedidos',
  },
  {
    id: 'perfil', icon: '👤', title: 'Mi perfil',
    content: `En tu perfil podés:\n• Cambiar tu nombre de usuario y email\n• Actualizar tu foto de perfil\n• Subir tu foto para el probador virtual\n• Ver y editar tus datos personales\n• Cambiar tu contraseña`,
    link: '/profile', linkLabel: 'Ir a mi perfil',
  },
  {
    id: 'cumple', icon: '🎂', title: 'Descuentos de cumpleaños',
    content: `Algunas tiendas ofrecen descuentos especiales en tu cumpleaños.\n\nPara activarlo:\n1. Ingresá a tu perfil\n2. Completá tu fecha de nacimiento\n3. ¡Listo! El día de tu cumpleaños recibirás un cupón de descuento por email y en tus notificaciones`,
    link: '/profile', linkLabel: 'Completar perfil',
  },
  {
    id: 'faq', icon: '❓', title: 'Preguntas frecuentes',
    faq: [
      { q: '¿Cómo creo una cuenta?', a: 'Hacé clic en "Ingresar" en el navbar y luego en "Crear cuenta". Solo necesitás un email y contraseña.' },
      { q: '¿Por qué necesito verificar mi email?', a: 'La verificación de email protege tu cuenta y habilita funciones como el probador virtual y la finalización de compras.' },
      { q: '¿Puedo comprar en varias tiendas al mismo tiempo?', a: 'Actualmente el carrito funciona por tienda. Para comprar en otra tienda, primero finalizá la compra actual.' },
      { q: '¿Cómo uso un cupón de descuento?', a: 'En el carrito, antes de finalizar la compra, encontrarás un campo para ingresar tu código de cupón.' },
      { q: '¿Mis datos están seguros?', a: 'Sí. Usamos cifrado seguro para proteger tus contraseñas y datos personales.' },
    ],
  },
];

const ADMIN_SECTIONS = [
  {
    id: 'tienda', icon: '🏪', title: 'Tu página de tienda',
    content: `Tu tienda tiene varias secciones que podés configurar:\n\n• **Header**: el navbar con el nombre/logo de tu tienda\n• **Hero**: la imagen/banner principal de bienvenida\n• **Carrusel**: imágenes destacadas en la portada\n• **Grid de categorías**: accesos directos a cada categoría\n• **Productos destacados**: productos que querés resaltar`,
    link: null, linkLabel: null,
  },
  {
    id: 'personalizar', icon: '🎨', title: 'Personalizar tu tienda',
    content: `Desde el panel de configuración podés cambiar:\n\n• Colores primario, secundario y de botones\n• Tipografía de toda la tienda\n• Colores del header, footer, carrito y vestidor\n• Logo de la tienda\n• Imágenes del carrusel\n\nHay un preview en tiempo real para ver cómo quedará antes de guardar.`,
    link: '/admin/store', linkLabel: 'Configurar tienda',
  },
  {
    id: 'productos', icon: '📦', title: 'Gestión de productos',
    content: `Desde "Productos" podés:\n\n• Crear nuevos productos con nombre, precio, descripción e imágenes\n• Asignar categorías\n• Gestionar el stock (recibirás una notificación cuando baje de 5 unidades)\n• Activar o desactivar productos`,
    link: '/admin/products', linkLabel: 'Ir a productos',
  },
  {
    id: 'categorias', icon: '🗂️', title: 'Categorías',
    content: `Las categorías organizan tus productos y aparecen en el grid editorial de tu tienda.\n\nPodés asignarles imágenes para que el grid se vea más atractivo. Sin imagen, se usa el color primario de tu tienda como fondo.`,
    link: '/admin/store', linkLabel: 'Gestionar categorías',
  },
  {
    id: 'usuarios', icon: '👥', title: 'Usuarios de tu tienda',
    content: `En "Usuarios" podés ver todos los compradores registrados en tu tienda.\n\nPodés activar o desactivar usuarios si lo necesitás.`,
    link: '/admin/users', linkLabel: 'Ver usuarios',
  },
  {
    id: 'dashboard', icon: '📊', title: 'Dashboard',
    content: `El dashboard muestra un resumen de la actividad de tu tienda:\n\n• Total de ventas\n• Número de pedidos\n• Productos más vendidos\n• Usuarios registrados\n• Pedidos recientes`,
    link: '/admin/dashboard', linkLabel: 'Ver dashboard',
  },
  {
    id: 'cumple-admin', icon: '🎂', title: 'Descuento de cumpleaños',
    content: `Configurá un descuento automático para los usuarios que cumplen años.\n\n1. Ir a "Cumpleaños" en el sidebar\n2. Activar el toggle\n3. Definir el porcentaje de descuento\n4. Elegir cuántos días antes y después del cumpleaños aplica\n\nCada día, el sistema genera automáticamente cupones para los usuarios que cumplen años.`,
    link: '/admin/birthday', linkLabel: 'Configurar descuento',
  },
  {
    id: 'notif-admin', icon: '🔔', title: 'Notificaciones',
    content: `Como admin recibís notificaciones de:\n\n• **Stock bajo**: cuando un producto tiene 5 o menos unidades\n• **Nuevo usuario**: cuando alguien se registra en tu tienda\n\nLas notificaciones aparecen en la campana del panel admin.`,
    link: null, linkLabel: null,
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '0.5px solid #e0dbd4' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: '#0f0f0f' }}>
        {q}
        <span style={{ fontSize: '0.8rem', color: '#6b6560', marginLeft: '8px', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: '#6b6560', lineHeight: 1.6 }}>{a}</p>}
    </div>
  );
}

function SectionCard({ s, onRate }) {
  const [rated, setRated] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(`help_rated_${s.id}`);
  });

  function rate(v) {
    localStorage.setItem(`help_rated_${s.id}`, v);
    setRated(v);
    onRate?.(s.id, v);
  }

  return (
    <div id={s.id} style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '24px 28px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.2rem', margin: 0 }}>{s.title}</h2>
      </div>

      {s.faq ? (
        s.faq.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)
      ) : (
        <p style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.75, whiteSpace: 'pre-line', margin: '0 0 16px' }}>
          {s.content}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '14px', borderTop: '0.5px solid #f0ede8', flexWrap: 'wrap', gap: '8px' }}>
        {s.link && (
          <Link href={s.link} style={{ fontSize: '0.72rem', color: '#0f0f0f', textDecoration: 'none', border: '0.5px solid #e0dbd4', padding: '6px 14px', borderRadius: '2px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {s.linkLabel} →
          </Link>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.65rem', color: '#aaa', letterSpacing: '0.1em' }}>¿Fue útil?</span>
          <button onClick={() => rate('up')} style={{ background: rated === 'up' ? '#e8f5e9' : 'none', border: `0.5px solid ${rated === 'up' ? '#a5d6a7' : '#e0dbd4'}`, cursor: 'pointer', padding: '4px 10px', borderRadius: '2px', fontSize: '0.8rem', color: rated === 'up' ? '#2e7d32' : '#6b6560' }}>👍</button>
          <button onClick={() => rate('down')} style={{ background: rated === 'down' ? '#fef2f2' : 'none', border: `0.5px solid ${rated === 'down' ? '#fecaca' : '#e0dbd4'}`, cursor: 'pointer', padding: '4px 10px', borderRadius: '2px', fontSize: '0.8rem', color: rated === 'down' ? '#c0392b' : '#6b6560' }}>👎</button>
        </div>
      </div>
    </div>
  );
}

export default function AyudaPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const role = session?.user?.role;
  const isAdmin = role === 'admin' || role === 'superadmin';
  const sections = isAdmin ? ADMIN_SECTIONS : VISITOR_SECTIONS;

  const filtered = search.trim()
    ? sections.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        (s.content || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.faq || []).some(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
      )
    : sections;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3f0', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{ background: '#0f0f0f', padding: '24px clamp(1.2rem,5vw,4rem)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: '#fff', marginBottom: '16px', letterSpacing: '0.08em' }}>
              CnB<span style={{ color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.65rem', marginLeft: '4px' }}>Choose and Buy</span>
            </div>
          </Link>
          <h1 style={{ color: '#fff', fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.5rem,4vw,2rem)', margin: '0 0 16px' }}>
            Centro de ayuda
          </h1>
          {/* Buscador */}
          <div style={{ position: 'relative', maxWidth: '480px' }}>
            <input
              type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar en la ayuda..."
              style={{ width: '100%', padding: '10px 40px 10px 14px', background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
            />
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>🔍</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '28px clamp(1.2rem,5vw,4rem) 48px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: '28px' }}>
        {/* Sidebar */}
        <aside style={{ position: 'sticky', top: '24px', alignSelf: 'start' }}>
          <nav style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '16px 0', overflow: 'hidden' }}>
            <div style={{ padding: '0 16px 12px', fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#aaa' }}>
              {isAdmin ? 'Para admins' : 'Para usuarios'}
            </div>
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.72rem', color: '#333', textDecoration: 'none', letterSpacing: '0.04em', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f3f0'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '0.9rem' }}>{s.icon}</span>
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Contenido */}
        <main>
          {/* Breadcrumb */}
          <div style={{ fontSize: '0.68rem', color: '#aaa', marginBottom: '20px' }}>
            <Link href="/" style={{ color: '#aaa', textDecoration: 'none' }}>Inicio</Link>
            {' / '}
            <span style={{ color: '#6b6560' }}>Ayuda</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '0.875rem' }}>
              Sin resultados para "{search}"
            </div>
          ) : (
            filtered.map(s => <SectionCard key={s.id} s={s} />)
          )}
        </main>
      </div>
    </div>
  );
}
