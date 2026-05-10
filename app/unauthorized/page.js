import Link from 'next/link';

export const metadata = { title: 'Sin acceso — FashionMall' };

export default function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--white)', fontFamily: 'var(--font-sans)',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '380px' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '4rem', fontWeight: 300, color: '#e0dbd4', lineHeight: 1, marginBottom: '16px' }}>
          403
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: '1.8rem', margin: '0 0 12px', letterSpacing: '0.02em' }}>
          Sin acceso
        </h1>
        <p style={{ color: '#6b6560', fontSize: '0.875rem', lineHeight: 1.7, margin: '0 0 28px' }}>
          No tenés permisos para acceder a esta página.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <Link href="/" style={{
            fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase',
            background: '#0f0f0f', color: '#fff',
            padding: '10px 22px', borderRadius: '2px', textDecoration: 'none',
          }}>
            Inicio
          </Link>
          <Link href="/store/zara" style={{
            fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase',
            border: '0.5px solid #e0dbd4', color: '#0f0f0f',
            padding: '10px 22px', borderRadius: '2px', textDecoration: 'none',
          }}>
            Ver tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
