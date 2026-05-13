'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useCart } from './CartContext';
import { useFittingRoom } from './FittingRoomContext';

const NAV_CATEGORIES = [
  { label: 'Remeras',    slug: 'remeras' },
  { label: 'Pantalones', slug: 'pantalones' },
  { label: 'Abrigos',    slug: 'abrigos' },
  { label: 'Camisas',    slug: 'camisas' },
  { label: 'Zapatillas', slug: 'zapatillas' },
];

export default function StoreNavbar({
  storeSlug    = 'zara',
  storeName    = 'Zara',
  storeLogo    = null,
  headerBg     = null,
  headerTextColor = null,
  headerFont   = null,
  headerFontSize = null,
  primaryColor = '#009aae',
}) {
  const { itemCount, setIsOpen } = useCart();
  const { items: fittingItems, setIsPanelOpen } = useFittingRoom();
  const { data: session } = useSession();
  const [isMobile, setIsMobile]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const bg        = headerBg || 'rgba(250,250,248,0.92)';
  const textColor = headerTextColor || '#0f0f0f';
  const nameColor = headerTextColor || primaryColor || '#0f0f0f';
  const font      = headerFont || 'var(--font-sans)';
  const fSize     = headerFontSize || '0.68rem';

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: isMobile ? '56px' : '64px',
      background: bg,
      backdropFilter: 'blur(12px)',
      borderBottom: '0.5px solid rgba(128,128,128,0.15)',
      display: 'flex', alignItems: 'center',
      padding: isMobile ? '0 1.2rem' : '0 2.5rem',
      gap: '12px',
    }}>

      {/* CnB logo — siempre contrasta con el fondo del header */}
      <Link href="/" style={{ textDecoration: 'none', color: textColor, fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: isMobile ? '1rem' : '1.15rem', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
        CnB
      </Link>

      <span style={{ color: textColor, opacity: 0.3, fontWeight: 300, fontSize: '1rem' }}>/</span>

      <Link href={`/store/${storeSlug}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
        {storeLogo ? (
          <img src={storeLogo} alt={storeName} style={{ height: '28px', maxWidth: '100px', objectFit: 'contain' }} />
        ) : (
          <span style={{
            color: nameColor,
            fontFamily: font,
            fontSize: fSize,
            letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500,
            whiteSpace: 'nowrap',
          }}>
            {storeName}
          </span>
        )}
      </Link>

      {/* Category links desktop */}
      {!isMobile && (
        <div style={{ display: 'flex', gap: '20px', marginLeft: '16px', flex: 1 }}>
          {NAV_CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              href={`/store/${storeSlug}/category/${cat.slug}`}
              style={{
                textDecoration: 'none',
                color: textColor,
                opacity: 0.65,
                fontFamily: font,
                fontSize: fSize,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                transition: 'opacity 0.2s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0.65'; }}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      )}

      {isMobile && <div style={{ flex: 1 }} />}

      {/* User avatar / menu */}
      {session?.user && (
        <div style={{ position: 'relative' }}>
          <button onClick={() => setUserMenuOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} aria-label="Menú de usuario">
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(128,128,128,0.15)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `0.5px solid ${textColor}30`, flexShrink: 0 }}>
              {session.user.avatar_url
                ? <img src={session.user.avatar_url} alt={session.user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '0.75rem', color: textColor, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
                    {(session.user.username?.[0] || session.user.email?.[0] || '?').toUpperCase()}
                  </span>
              }
            </div>
          </button>

          {userMenuOpen && (
            <>
              <div onClick={() => setUserMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
              <div style={{ position: 'absolute', top: '44px', right: 0, background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', minWidth: '160px', zIndex: 99, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #e8e4df' }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 500, color: '#0f0f0f' }}>{session.user.username}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: '#aaa', marginTop: 2 }}>{session.user.role}</div>
                </div>
                <Link href="/profile" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', padding: '9px 14px', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.08em', color: '#0f0f0f', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.background = '#f5f3f0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Mi perfil</Link>
                <Link href="/profile/orders" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', padding: '9px 14px', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.08em', color: '#0f0f0f', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.background = '#f5f3f0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Mis pedidos</Link>
                {session.user.role === 'admin' && (
                  <Link href="/admin" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', padding: '9px 14px', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.08em', color: '#0f0f0f', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.background = '#f5f3f0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Admin</Link>
                )}
                {session.user.role === 'superadmin' && (
                  <Link href="/superadmin/dashboard" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', padding: '9px 14px', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.08em', color: '#a78bfa', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.background = '#f5f3f0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Superadmin</Link>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {!session?.user && (
        <Link href="/login" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: textColor, textDecoration: 'none', padding: '4px 8px', border: `0.5px solid ${textColor}60`, borderRadius: '2px', whiteSpace: 'nowrap', transition: 'opacity 0.2s', opacity: 0.8 }}>
          Ingresar
        </Link>
      )}

      {/* Fitting room button */}
      <button onClick={() => setIsPanelOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '8px', color: textColor, display: 'flex', alignItems: 'center' }} aria-label="Abrir vestidor" title="Vestidor virtual">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="12" cy="10" r="3"/>
          <path d="M7 21v-1a5 5 0 0110 0v1"/>
        </svg>
        {fittingItems.length > 0 && (
          <span style={{ position: 'absolute', top: '2px', right: '2px', background: textColor, color: bg, width: '16px', height: '16px', borderRadius: '50%', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}>
            {fittingItems.length > 9 ? '9+' : fittingItems.length}
          </span>
        )}
      </button>

      {/* Cart button */}
      <button onClick={() => setIsOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '8px', color: textColor, display: 'flex', alignItems: 'center' }} aria-label="Abrir carrito">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        {itemCount > 0 && (
          <span style={{ position: 'absolute', top: '2px', right: '2px', background: textColor, color: bg, width: '16px', height: '16px', borderRadius: '50%', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}>
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </button>

      {/* Hamburger mobile */}
      {isMobile && (
        <button onClick={() => setMenuOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5, padding: 4 }}>
          <span style={{ display: 'block', width: 22, height: 1.5, background: textColor, transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }} />
          <span style={{ display: 'block', width: 22, height: 1.5, background: menuOpen ? 'transparent' : textColor, transition: 'all 0.2s' }} />
          <span style={{ display: 'block', width: 22, height: 1.5, background: textColor, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
        </button>
      )}

      {isMobile && menuOpen && (
        <div style={{ position: 'fixed', top: '56px', left: 0, right: 0, background: bg, backdropFilter: 'blur(12px)', borderBottom: '0.5px solid rgba(128,128,128,0.15)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 16, zIndex: 99 }}>
          {NAV_CATEGORIES.map(cat => (
            <Link key={cat.slug} href={`/store/${storeSlug}/category/${cat.slug}`} onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: textColor, fontFamily: font, fontSize: '0.8rem', letterSpacing: '0.16em', textTransform: 'uppercase', borderBottom: `0.5px solid ${textColor}20`, paddingBottom: 14 }}>
              {cat.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
