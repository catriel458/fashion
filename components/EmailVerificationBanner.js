'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function EmailVerificationBanner() {
  const { data: session } = useSession();
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!session?.user || session.user.email_verified !== false) return null;

  async function handleResend() {
    if (cooldown > 0 || sending) return;
    setSending(true);
    try {
      await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      });
      setSent(true);
      setCooldown(60);
      setTimeout(() => setSent(false), 4000);
    } catch {
      // silencioso
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{
      background: '#fef9c3', borderBottom: '1px solid #fde047',
      padding: '10px 20px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: '12px', flexWrap: 'wrap',
      fontSize: '0.78rem', fontFamily: 'var(--font-sans)', zIndex: 90,
      position: 'relative',
    }}>
      <span style={{ color: '#78350f' }}>
        ⚠️ Verificá tu email para acceder a todas las funciones.
      </span>
      {sent ? (
        <span style={{ color: '#166534', fontWeight: 500 }}>✓ Email enviado</span>
      ) : (
        <button
          onClick={handleResend}
          disabled={sending || cooldown > 0}
          style={{
            background: '#0f0f0f', color: '#fff', border: 'none',
            padding: '5px 12px', borderRadius: '2px', cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
            fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            opacity: cooldown > 0 ? 0.6 : 1,
          }}
        >
          {sending ? 'Enviando...' : cooldown > 0 ? `Reenviar (${cooldown}s)` : 'Reenviar email de verificación'}
        </button>
      )}
    </div>
  );
}
