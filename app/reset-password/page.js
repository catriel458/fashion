'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams    = useSearchParams();
  const router          = useRouter();
  const token           = searchParams.get('token');
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError('Token inválido o faltante.');
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError('Las contraseñas no coinciden'); return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inp = { width: '100%', padding: '9px 11px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontSize: '0.875rem', outline: 'none', borderRadius: '2px', boxSizing: 'border-box', color: '#0f0f0f' };
  const lbl = { display: 'block', marginBottom: '6px', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '8px', padding: '40px 36px', width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#0f0f0f', letterSpacing: '0.08em' }}>
              CnB<span style={{ color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', marginLeft: '4px' }}>Choose and Buy</span>
            </div>
          </Link>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 400, margin: '16px 0 4px' }}>Nueva contraseña</h1>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✓</div>
            <p style={{ color: '#2e7d32', fontSize: '0.875rem' }}>Contraseña actualizada. Redirigiendo...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', color: '#c0392b', fontSize: '0.8rem' }}>
                {error}
              </div>
            )}
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Nueva contraseña</label>
              <input type="password" required minLength={6} value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })}
                style={inp} placeholder="••••••••" autoComplete="new-password" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={lbl}>Confirmar contraseña</label>
              <input type="password" required value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                style={inp} placeholder="••••••••" autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading || !token} style={{ width: '100%', padding: '12px', background: loading ? '#ccc' : '#0f0f0f', color: '#fafaf8', border: 'none', borderRadius: '2px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
