'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AvatarGuide() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Entrance notification / greeting animation
  useEffect(() => {
    // Show greeting tooltip after a small delay
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const togglePanel = () => {
    setIsOpen(!isOpen);
    if (showTooltip) setShowTooltip(false);
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
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
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
            height: '480px',
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

          {/* Cuerpo / Contenido del Wizard (Placeholder inicial) */}
          <div
            style={{
              flex: 1,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'rgba(250, 249, 246, 0.6)',
              textAlign: 'center',
              gap: '16px',
            }}
          >
            <p style={{ fontSize: '0.85rem', color: 'var(--black, #0f0f0f)', margin: 0 }}>
              Cargando el asistente de navegación de ropa...
            </p>
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
        @keyframes guide-bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
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
