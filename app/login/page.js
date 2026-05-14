'use client';
import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const labelStyle = {
  display: 'block', marginBottom: '6px',
  fontFamily: 'var(--font-sans)', fontSize: '0.68rem',
  letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560',
};
const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '0.5px solid #e0dbd4', background: '#fff',
  fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
  outline: 'none', borderRadius: '2px',
  boxSizing: 'border-box', color: '#0f0f0f',
  transition: 'border-color 0.2s',
};

function LoginForm() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [tab, setTab]             = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm]     = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  function changeTab(t) { setTab(t); setError(''); }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const result = await signIn('credentials', {
        email: loginForm.email, password: loginForm.password, redirect: false,
      });
      if (result?.error) setError('Email o contraseña incorrectos');
      else router.push(callbackUrl);
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
      if (result?.error) { changeTab('login'); setError('Cuenta creada. Iniciá sesión.'); }
      else router.push(callbackUrl);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3f0', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{
        padding: '20px clamp(1.2rem, 4vw, 3rem)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '0.5px solid #e8e4df', background: '#fafaf8',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', letterSpacing: '0.08em', color: '#0f0f0f' }}>
            FASHION<span style={{ color: '#6b6560' }}>MALL</span>
          </span>
        </Link>
        <Link href="/" style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', textDecoration: 'none' }}>
          ← Volver al inicio
        </Link>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{
          background: '#fafaf8', border: '0.5px solid #e0dbd4',
          borderRadius: '8px', width: '100%', maxWidth: '420px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>

          {/* Card header */}
          <div style={{ padding: '28px 32px 0', textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'var(--font-serif)', fontWeight: 300,
              fontSize: '1.6rem', margin: '0 0 4px', letterSpacing: '0.02em',
            }}>
              {tab === 'login' ? 'Bienvenido' : 'Crear cuenta'}
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#6b6560', margin: '0 0 24px' }}>
              {tab === 'login' ? 'Ingresá con tu cuenta para continuar' : 'Completá tus datos para registrarte'}
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '0.5px solid #e0dbd4', margin: '0 32px' }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => changeTab(t)} style={{
                flex: 1, padding: '10px 0', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                color: tab === t ? '#0f0f0f' : '#6b6560',
                borderBottom: tab === t ? '1.5px solid #0f0f0f' : '1.5px solid transparent',
                marginBottom: '-0.5px', transition: 'color 0.2s',
              }}>
                {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={{ padding: '24px 32px 32px' }}>
            {error && (
              <div style={{
                background: '#fef2f2', border: '0.5px solid #fecaca',
                padding: '10px 14px', borderRadius: '4px', marginBottom: '16px',
                color: '#c0392b', fontSize: '0.8rem', lineHeight: 1.4,
              }}>
                {error}
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} noValidate>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Email</label>
                  <input type="email" required autoFocus
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    style={inputStyle} placeholder="tu@email.com" autoComplete="email" />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Contraseña</label>
                    <Link href="/forgot-password" style={{ fontSize: '0.68rem', color: '#6b6560', textDecoration: 'none', letterSpacing: '0.04em' }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <input type="password" required
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    style={inputStyle} placeholder="••••••••" autoComplete="current-password" />
                </div>
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '13px',
                  background: loading ? '#888' : '#0f0f0f', color: '#fafaf8',
                  border: 'none', borderRadius: '2px', cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  transition: 'background 0.2s',
                }}>
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </button>
                <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: '#6b6560' }}>
                  ¿No tenés cuenta?{' '}
                  <button type="button" onClick={() => changeTab('register')} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#0f0f0f', textDecoration: 'underline', fontSize: '0.78rem',
                    fontFamily: 'var(--font-sans)',
                  }}>
                    Registrate
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} noValidate>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Nombre de usuario</label>
                  <input type="text" required autoFocus
                    value={regForm.username}
                    onChange={e => setRegForm({ ...regForm, username: e.target.value })}
                    style={inputStyle} placeholder="Tu nombre" autoComplete="username" />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Email</label>
                  <input type="email" required
                    value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                    style={inputStyle} placeholder="tu@email.com" autoComplete="email" />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Contraseña</label>
                  <input type="password" required minLength={6}
                    value={regForm.password}
                    onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                    style={inputStyle} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Confirmar contraseña</label>
                  <input type="password" required
                    value={regForm.confirm}
                    onChange={e => setRegForm({ ...regForm, confirm: e.target.value })}
                    style={inputStyle} placeholder="••••••••" autoComplete="new-password" />
                </div>
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '13px',
                  background: loading ? '#888' : '#0f0f0f', color: '#fafaf8',
                  border: 'none', borderRadius: '2px', cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  transition: 'background 0.2s',
                }}>
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
                <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: '#6b6560' }}>
                  ¿Ya tenés cuenta?{' '}
                  <button type="button" onClick={() => changeTab('login')} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#0f0f0f', textDecoration: 'underline', fontSize: '0.78rem',
                    fontFamily: 'var(--font-sans)',
                  }}>
                    Iniciá sesión
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
