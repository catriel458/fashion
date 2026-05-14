'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const [devUrl, setDevUrl]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.devResetUrl) setDevUrl(data.devResetUrl);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '8px', padding: '40px 36px', width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#0f0f0f', letterSpacing: '0.08em' }}>
              CnB<span style={{ color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', marginLeft: '4px' }}>Choose and Buy</span>
            </div>
          </Link>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 400, margin: '16px 0 4px' }}>Recuperar contraseña</h1>
          <p style={{ fontSize: '0.78rem', color: '#6b6560', margin: 0 }}>Ingresá tu email y te enviaremos un link</p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✉️</div>
            <p style={{ fontSize: '0.875rem', color: '#333', lineHeight: 1.6 }}>
              Si ese email existe en nuestro sistema, te enviamos un link para restablecer tu contraseña.
            </p>
            <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '8px' }}>Revisá también la carpeta de spam.</p>
            {devUrl && (
              <div style={{ marginTop: '16px', background: '#fef9c3', border: '0.5px solid #fde047', borderRadius: '4px', padding: '12px 14px', textAlign: 'left' }}>
                <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78350f', margin: '0 0 6px' }}>
                  Modo desarrollo — link de reset:
                </p>
                <a href={devUrl} style={{ fontSize: '0.72rem', color: '#0f0f0f', wordBreak: 'break-all', lineHeight: 1.5 }}>
                  {devUrl}
                </a>
              </div>
            )}
            <Link href="/login" style={{ display: 'inline-block', marginTop: '20px', fontSize: '0.72rem', color: '#0f0f0f', textDecoration: 'underline', letterSpacing: '0.08em' }}>
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', color: '#c0392b', fontSize: '0.8rem' }}>
                {error}
              </div>
            )}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' }}>
                Email
              </label>
              <input
                type="email" required autoFocus value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                style={{ width: '100%', padding: '9px 11px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontSize: '0.875rem', outline: 'none', borderRadius: '2px', boxSizing: 'border-box', color: '#0f0f0f' }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#ccc' : '#0f0f0f', color: '#fafaf8', border: 'none', borderRadius: '2px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              {loading ? 'Enviando...' : 'Enviar link de recuperación'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link href="/login" style={{ fontSize: '0.72rem', color: '#6b6560', textDecoration: 'none' }}>
                ← Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
