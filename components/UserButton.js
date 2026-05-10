'use client';
import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function UserButton() {
  const { data: session }          = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  if (!session) {
    return (
      <Link href="/login" style={{
        fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
        background: 'none', color: '#6b6560',
        padding: '7px 14px', borderRadius: 4,
        border: '0.5px solid #e0dbd4',
        textDecoration: 'none', fontFamily: 'var(--font-sans)',
        display: 'inline-block',
      }}>
        Ingresar
      </Link>
    );
  }

  const user     = session.user;
  const initials = (user.username?.[0] || user.email?.[0] || '?').toUpperCase();

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(v => !v)}
        style={{
          width: 34, height: 34, borderRadius: '50%',
          background: '#0f0f0f', border: 'none', cursor: 'pointer',
          overflow: 'hidden', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.username}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ color: '#fff', fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
            {initials}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute', top: '42px', right: 0,
          background: '#fafaf8', border: '0.5px solid #e0dbd4',
          borderRadius: '4px', minWidth: '185px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          zIndex: 1000, overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #e0dbd4' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#0f0f0f' }}>{user.username}</div>
            <div style={{ fontSize: '0.7rem', color: '#6b6560', marginTop: '2px' }}>{user.email}</div>
          </div>

          <Link href="/profile" onClick={() => setShowDropdown(false)} style={itemStyle}>
            Mi perfil
          </Link>
          {user.role === 'visitor' && (
            <Link href="/profile/orders" onClick={() => setShowDropdown(false)} style={itemStyle}>
              Mis compras
            </Link>
          )}
          {user.role === 'admin' && (
            <Link href="/admin/dashboard" onClick={() => setShowDropdown(false)} style={itemStyle}>
              Panel admin
            </Link>
          )}
          <button
            onClick={() => { signOut({ callbackUrl: '/' }); setShowDropdown(false); }}
            style={{
              ...itemStyle, display: 'block', width: '100%', textAlign: 'left',
              border: 'none', cursor: 'pointer',
              borderTop: '0.5px solid #e0dbd4', color: '#c0392b',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

const itemStyle = {
  display: 'block', padding: '10px 16px',
  fontSize: '0.8rem', color: '#0f0f0f',
  textDecoration: 'none', background: 'none',
  fontFamily: 'var(--font-sans)',
};
