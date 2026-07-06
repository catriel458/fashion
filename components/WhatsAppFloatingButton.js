'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function WhatsAppFloatingButton({ whatsappNumber, storeName }) {
  const { data: session } = useSession();
  const [hovered, setHovered] = useState(false);

  if (!whatsappNumber) return null;

  const cleanNumber = whatsappNumber.replace(/\D/g, '');
  if (!cleanNumber) return null;

  const userName = session?.user?.username || session?.user?.first_name || '';
  const greeting = userName
    ? `Hola ${storeName}, soy ${userName}. Quiero más información.`
    : `Hola ${storeName}, quiero más información.`;
  const encodedText = encodeURIComponent(greeting);
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;

  return (
    <>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(37, 211, 102, 0.35)',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: hovered ? 'scale(1.08) translateY(-2px)' : 'scale(1)',
          animation: 'waPulse 2s infinite',
        }}
        aria-label="Contactar por WhatsApp"
      >
        {/* WhatsApp Icon */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: 'block' }}
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </a>

      <style jsx global>{`
        @keyframes waPulse {
          0% {
            box-shadow: 0 8px 24px rgba(37, 211, 102, 0.35);
          }
          50% {
            box-shadow: 0 8px 32px rgba(37, 211, 102, 0.6), 0 0 0 10px rgba(37, 211, 102, 0.2);
          }
          100% {
            box-shadow: 0 8px 24px rgba(37, 211, 102, 0.35);
          }
        }
      `}</style>
    </>
  );
}
