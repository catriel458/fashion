'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

const labelStyle = {
  display: 'block', marginBottom: '6px',
  fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
  letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560',
};
const inputStyle = {
  width: '100%', padding: '9px 11px',
  border: '0.5px solid #e0dbd4', background: '#fff',
  fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
  outline: 'none', borderRadius: '2px',
  boxSizing: 'border-box', color: '#0f0f0f',
};

export default function AuthModal({ isOpen, onClose, message, onSuccess }) {
  const [tab, setTab]             = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm]     = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  if (!isOpen) return null;

  function handleTabChange(t) { setTab(t); setError(''); }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const result = await signIn('credentials', {
        email: loginForm.email, password: loginForm.password, redirect: false,
      });
      if (result?.error) setError('Email o contraseña incorrectos');
      else { onSuccess?.(); onClose(); }
    } catch { setError('Error al iniciar sesión'); }
    finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (regForm.password !== regForm.confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regForm.username, email: regForm.email, password: regForm.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrarse');
      const result = await signIn('credentials', {
        email: regForm.email, password: regForm.password, redirect: false,
      });
      if (result?.error) { handleTabChange('login'); setError('Cuenta creada. Iniciá sesión.'); }
      else { onSuccess?.(); onClose(); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    /* Overlay — es el flex container que centra el modal */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      {/* Modal — stopPropagation evita que el click cierre el modal */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fafaf8', borderRadius: '8px',
          border: '0.5px solid #e0dbd4',
          width: '100%', maxWidth: '420px',
          maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
          padding: '32px', boxSizing: 'border-box',
          position: 'relative', flexShrink: 0,
        }}
      >
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1rem', color: '#6b6560', lineHeight: 1,
        }}>✕</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 400 }}>
            FASHION<span style={{ color: '#6b6560' }}>MALL</span>
          </div>
          {message && (
            <p style={{
              fontSize: '0.78rem', color: '#6b6560', lineHeight: 1.5,
              marginTop: '10px', padding: '10px 14px',
              background: '#f0ede8', borderRadius: '4px',
            }}>
              {message}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '0.5px solid #e0dbd4' }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => handleTabChange(t)} style={{
              flex: 1, padding: '10px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.14em',
              textTransform: 'uppercase', fontFamily: 'var(--font-sans)',
              color: tab === t ? '#0f0f0f' : '#6b6560',
              borderBottom: tab === t ? '1.5px solid #0f0f0f' : '1.5px solid transparent',
              marginBottom: '-0.5px',
            }}>
              {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '0.5px solid #fecaca',
            padding: '10px 14px', borderRadius: '4px', marginBottom: '14px',
            color: '#c0392b', fontSize: '0.8rem',
          }}>
            {error}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Email</label>
              <input type="email" required autoFocus value={loginForm.email}
                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                style={inputStyle} placeholder="tu@email.com" autoComplete="email" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Contraseña</label>
              <input type="password" required value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                style={inputStyle} placeholder="••••••••" autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', border: 'none', borderRadius: '2px',
              background: loading ? '#ccc' : '#0f0f0f', color: '#fafaf8',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Link href="/forgot-password" onClick={onClose} style={{ fontSize: '0.72rem', color: '#6b6560', textDecoration: 'none', letterSpacing: '0.06em' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Usuario</label>
              <input type="text" required autoFocus value={regForm.username}
                onChange={e => setRegForm({ ...regForm, username: e.target.value })}
                style={inputStyle} placeholder="Tu nombre de usuario" autoComplete="username" />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Email</label>
              <input type="email" required value={regForm.email}
                onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                style={inputStyle} placeholder="tu@email.com" autoComplete="email" />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Contraseña</label>
              <input type="password" required minLength={6} value={regForm.password}
                onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                style={inputStyle} placeholder="••••••••" autoComplete="new-password" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Confirmar contraseña</label>
              <input type="password" required value={regForm.confirm}
                onChange={e => setRegForm({ ...regForm, confirm: e.target.value })}
                style={inputStyle} placeholder="••••••••" autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', border: 'none', borderRadius: '2px',
              background: loading ? '#ccc' : '#0f0f0f', color: '#fafaf8',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
