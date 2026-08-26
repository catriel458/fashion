'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useFittingRoom } from '@/components/FittingRoomContext';

export default function AvatarGuide() {
  const pathname = usePathname();
  const { setIsPanelOpen } = useFittingRoom();

  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [stores, setStores] = useState([]);
  
  const scrollRef = useRef(null);

  // Fetch active stores dynamically
  useEffect(() => {
    fetch(`/api/stores?_=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setStores(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Error fetching stores for guide:', err));
  }, []);

  // Parse current storeSlug from URL
  const match = pathname.match(/^\/store\/([^/]+)/);
  const storeSlug = match ? match[1] : null;
  const currentStore = stores.find(s => s.slug === storeSlug);
  const storeName = currentStore ? currentStore.name : (storeSlug ? storeSlug.toUpperCase() : null);

  // Initial greeting state configuration
  const getInitialState = () => ({
    messages: [
      {
        role: 'assistant',
        text: '¡Hola! Soy tu asistente de estilo TnB. ¿Qué tipo de prendas te gustaría probarte hoy?',
      }
    ],
    options: [
      { label: '👕 Remeras', type: 'category', value: 'remeras' },
      { label: '👖 Pantalones', type: 'category', value: 'pantalones' },
      { label: '👔 Camisas', type: 'category', value: 'camisas' },
      { label: '🧥 Abrigos', type: 'category', value: 'abrigos' },
      { label: '👟 Zapatillas', type: 'category', value: 'zapatillas' },
      { label: '🏬 Ver catálogo completo', type: 'catalog' },
      { label: '❓ Otra cosa', type: 'other' },
    ]
  });

  // History stack for backward navigation
  const [history, setHistory] = useState([getInitialState()]);

  // Reset wizard on page load (saved in session memory/react state only)
  useEffect(() => {
    setHistory([getInitialState()]);
  }, [pathname]);

  // Entrance notification / greeting animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const togglePanel = () => {
    setIsOpen(!isOpen);
    if (showTooltip) setShowTooltip(false);
  };

  const current = history[history.length - 1];

  const handleOptionClick = (opt) => {
    const nextMessages = [
      ...current.messages,
      { role: 'user', text: opt.label }
    ];

    let nextText = '';
    let nextOptions = [];

    if (opt.type === 'category') {
      const categoryName = opt.label.split(' ')[1]; // Extract label name without emoji
      if (storeSlug) {
        // User is currently browsing a store
        nextText = `¡Buenísima elección! Encontré la sección de ${categoryName} en esta tienda (${storeName}). ¿Querés explorarla acá o preferís ver otras marcas?`;
        nextOptions = [
          { label: `🛍️ Ver en ${storeName}`, type: 'link', url: `/store/${storeSlug}/category/${opt.value}` },
          { label: '🏬 Explorar todas las tiendas', type: 'link', url: '/stores' }
        ];
      } else {
        // User is not in a store (e.g. landing page or stores catalog)
        nextText = `¡Excelente elección! Para probarte ${categoryName} en el probador inteligente con IA, primero tenés que ingresar a una tienda. ¿Cuál te gustaría visitar?`;
        
        // Show first 3 active stores as options
        const storeOptions = stores.slice(0, 3).map(s => ({
          label: `🏬 ${s.name}`,
          type: 'link',
          url: `/store/${s.slug}/category/${opt.value}`
        }));

        nextOptions = [
          ...storeOptions,
          { label: '🏬 Ver todas las marcas', type: 'link', url: '/stores' }
        ];
      }
    } else if (opt.type === 'catalog') {
      nextText = 'Redirigiendo al catálogo completo de marcas y tiendas disponibles en TnB...';
      setTimeout(() => {
        window.location.href = '/stores';
      }, 800);
    } else if (opt.type === 'other') {
      nextText = '¿En qué más te puedo ayudar hoy?';
      nextOptions = [
        { label: 'ℹ️ ¿Cómo funciona el probador?', type: 'how-it-works' },
        { label: '🏬 Ver tiendas disponibles', type: 'link', url: '/stores' },
        { label: '❓ Ir al centro de ayuda', type: 'link', url: '/ayuda' },
      ];
    } else if (opt.type === 'how-it-works') {
      nextText = `El probador inteligente con IA te permite ver cómo te queda la ropa de forma virtual. Es muy fácil:\n\n1. Subí una foto tuya de cuerpo entero en tu Perfil.\n2. Entrá a cualquier tienda y agregá prendas "Al vestidor".\n3. Abrí el probador virtual en la esquina inferior derecha para generar tu imagen con IA.`;
      nextOptions = [
        { label: '👤 Ir a mi Perfil', type: 'link', url: '/profile' },
        { label: '🏬 Ver tiendas', type: 'link', url: '/stores' }
      ];
    } else if (opt.type === 'link') {
      window.location.href = opt.url;
      return;
    }

    setHistory([
      ...history,
      {
        messages: [
          ...nextMessages,
          { role: 'assistant', text: nextText }
        ],
        options: nextOptions
      }
    ]);
  };

  const handleOpenFittingRoom = () => {
    if (storeSlug) {
      // Open virtual fitting room
      setIsPanelOpen(true);
      setHistory([
        ...history,
        {
          messages: [
            ...current.messages,
            { role: 'user', text: 'Probar en el probador virtual' },
            { role: 'assistant', text: '¡Excelente! Acabo de abrir el probador virtual en el panel lateral. Podés cargar tu foto y ver cómo te quedan las prendas seleccionadas.' }
          ],
          options: current.options
        }
      ]);
    } else {
      // Guide user to choose a store first
      const storeOptions = stores.slice(0, 3).map(s => ({
        label: `🏬 ${s.name}`,
        type: 'link',
        url: `/store/${s.slug}`
      }));

      setHistory([
        ...history,
        {
          messages: [
            ...current.messages,
            { role: 'user', text: 'Probar en el probador virtual' },
            { role: 'assistant', text: 'Para usar el probador inteligente con IA, primero tenés que entrar a una tienda. ¿Cuál te gustaría visitar para empezar?' }
          ],
          options: [
            ...storeOptions,
            { label: '🏬 Ver todas las marcas', type: 'link', url: '/stores' }
          ]
        }
      ]);
    }
  };

  const handleBack = () => {
    if (history.length > 1) {
      setHistory(prev => prev.slice(0, -1));
    }
  };

  return (
    <>
      {/* ── BURBUJA FLOTANTE DEL AVATAR (Abajo a la izquierda) ── */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        {/* Globo de diálogo / Saludo inicial */}
        {showTooltip && !isOpen && (
          <div
            onClick={togglePanel}
            style={{
              background: '#ffffff',
              border: '1px solid var(--black, #0f0f0f)',
              padding: '10px 14px',
              borderRadius: '12px 12px 12px 2px',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
              fontSize: '0.78rem',
              color: 'var(--black, #0f0f0f)',
              fontFamily: 'var(--font-sans), sans-serif',
              marginBottom: '10px',
              cursor: 'pointer',
              animation: 'guide-bounce 2s infinite',
              maxWidth: '200px',
              lineHeight: '1.4',
              position: 'relative',
            }}
          >
            👋 ¡Hola! ¿Querés probarte ropa hoy? Hacé click acá.
          </div>
        )}

        {/* Botón circular con la imagen del avatar */}
        <button
          onClick={togglePanel}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: '2px solid var(--black, #0f0f0f)',
            padding: 0,
            background: 'none',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            outline: 'none',
            animation: 'guide-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
          onMouseEnter={(e) => {
            if (!isOpen) e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            if (!isOpen) e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Avatar Guía"
        >
          <img
            src="/avatar.jfif"
            alt="Guía virtual"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </button>
      </div>

      {/* ── PANEL DEL WIZARD (Abajo a la izquierda) ── */}
      {isOpen && (
        <div
          className="guide-window"
          style={{
            position: 'fixed',
            bottom: '96px',
            left: '24px',
            width: '360px',
            height: '520px',
            maxHeight: 'calc(100vh - 120px)',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(224, 219, 212, 0.7)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 999,
            animation: 'guide-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: 'var(--font-sans), system-ui, sans-serif',
          }}
        >
          {/* Cabecera del Panel */}
          <div
            style={{
              padding: '16px 20px',
              background: 'var(--black, #0f0f0f)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <img
                  src="/avatar.jfif"
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <div style={{ fontWeight: '500', fontSize: '0.85rem', letterSpacing: '0.04em', fontFamily: 'var(--font-serif), serif' }}>
                  Guía TnB
                </div>
                <div style={{ fontSize: '0.65rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Asistente de Navegación
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                opacity: 0.8,
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Listado de Mensajes */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'rgba(250, 249, 246, 0.6)',
              scrollbarWidth: 'none',
            }}
            className="guide-messages-container"
          >
            {current.messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    width: '100%',
                    animation: 'guide-msg-slide 0.25s ease',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '11px 15px',
                      borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      background: isUser ? 'var(--black, #0f0f0f)' : 'rgba(238, 235, 230, 0.95)',
                      color: isUser ? '#ffffff' : '#1f1f1f',
                      fontSize: '0.82rem',
                      lineHeight: '1.45',
                      boxShadow: isUser ? '0 3px 10px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.03)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Opciones del Wizard */}
          <div
            style={{
              padding: '16px',
              background: '#ffffff',
              borderTop: '1px solid rgba(224, 219, 212, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {/* Botón rápido persistente para probador virtual */}
            <button
              onClick={handleOpenFittingRoom}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--black, #0f0f0f)',
                background: 'var(--black, #0f0f0f)',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--black, #0f0f0f)';
              }}
            >
              🧥 Probar en el probador virtual
            </button>

            {/* Listado dinámico de opciones */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                maxHeight: '140px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
              className="guide-options-scroll"
            >
              {current.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleOptionClick(opt)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d4cecb',
                    background: '#ffffff',
                    color: '#4a4542',
                    fontSize: '0.75rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--black, #0f0f0f)';
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.color = 'var(--black, #0f0f0f)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d4cecb';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.color = '#4a4542';
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Acciones del menú inferior: Volver atrás y Cerrar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '4px',
                borderTop: '0.5px solid rgba(224, 219, 212, 0.5)',
                paddingTop: '8px',
              }}
            >
              <button
                onClick={handleBack}
                disabled={history.length <= 1}
                style={{
                  background: 'none',
                  border: 'none',
                  color: history.length <= 1 ? '#ccc' : '#6b6560',
                  cursor: history.length <= 1 ? 'default' : 'pointer',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 500,
                }}
              >
                ← Volver atrás
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b6560',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                }}
              >
                Cerrar asistente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS incorporados */}
      <style jsx global>{`
        @keyframes guide-fade-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes guide-slide-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes guide-msg-slide {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes guide-bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        
        .guide-messages-container::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }

        .guide-options-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .guide-options-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 4px;
        }
        .guide-options-scroll::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .guide-options-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 600px) {
          .guide-window {
            width: calc(100% - 32px) !important;
            height: calc(100% - 32px) !important;
            max-height: calc(100vh - 48px) !important;
            bottom: 16px !important;
            left: 16px !important;
            border-radius: 12px !important;
          }
        }
      `}</style>
    </>
  );
}
