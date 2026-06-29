'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomePopupGeneral({ storeId, storeName, discountPercent, storeSlug, primaryColor }) {
  const { data: session, status } = useSession();
  const [isVisible, setIsVisible] = useState(false);
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') return;
    if (typeof window !== 'undefined') {
      const shown = localStorage.getItem('tnb_popup_' + storeId);
      if (shown === '1') return;

      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [storeId, status]);

  if (!isVisible || status === 'loading' || status === 'authenticated') return null;

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tnb_popup_' + storeId, '1');
    }
    setIsVisible(false);
  };

  const stripeColor = primaryColor || '#009aae';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fafaf8',
              border: '0.5px solid #e8e4df',
              borderRadius: 10,
              maxWidth: 400,
              width: '90%',
              padding: '40px 32px',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            {/* Botón X */}
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: 14,
                right: 18,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                color: '#999',
                lineHeight: 1,
              }}
            >
              ✕
            </button>

            {/* Franja de color superior */}
            <div
              style={{
                background: stripeColor,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                borderRadius: '10px 10px 0 0',
              }}
            />

            {/* Eyebrow label */}
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#6b6560',
                marginBottom: 10,
              }}
            >
              OFERTA DE BIENVENIDA
            </div>

            {/* Nombre de tienda */}
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                fontWeight: 400,
                letterSpacing: '0.06em',
                color: '#1a1a1a',
                margin: '0 0 4px 0',
              }}
            >
              {storeName}
            </h3>

            {/* Descuento destacado */}
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 48,
                fontWeight: 300,
                color: '#1a1a1a',
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              {discountPercent}% OFF
            </div>

            {/* Separador */}
            <div
              style={{
                width: 40,
                height: 1,
                background: '#e0dbd4',
                margin: '16px auto',
              }}
            />

            {/* Párrafo */}
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: '#6b6560',
                lineHeight: 1.6,
                marginBottom: 28,
                marginRight: 0,
                marginLeft: 0,
              }}
            >
              Creá tu cuenta gratis y recibí tu código de descuento en el email de confirmación de tu registro.
            </p>

            {/* Botón CTA */}
            <button
              onClick={() => {
                handleClose();
                window.location.href = `/register?referralStoreId=${storeId}`;
              }}
              onMouseEnter={() => setIsBtnHovered(true)}
              onMouseLeave={() => setIsBtnHovered(false)}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#fff',
                background: isBtnHovered ? '#333' : '#1a1a1a',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                marginBottom: 12,
                fontFamily: 'var(--font-sans)',
                transition: 'background 0.2s',
              }}
            >
              QUIERO MI {discountPercent}% DE DESCUENTO
            </button>

            {/* Link secundario */}
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                color: '#999',
                letterSpacing: '0.08em',
              }}
            >
              ¿Ya tenés cuenta?{' '}
              <a
                href="/login"
                style={{
                  color: '#1a1a1a',
                  textDecoration: 'underline',
                  fontWeight: 500,
                }}
              >
                Iniciá sesión
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
