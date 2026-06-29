'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterRedirectClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const referralStoreId = searchParams.get('referralStoreId') || '';
    router.replace(`/login?tab=register${referralStoreId ? `&referralStoreId=${referralStoreId}` : ''}`);
  }, [router, searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f3f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
      fontSize: '0.875rem',
      color: '#6b6560'
    }}>
      Redireccionando al registro...
    </div>
  );
}

export default function RegisterRedirect() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#f5f3f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.875rem',
        color: '#6b6560'
      }}>
        Cargando...
      </div>
    }>
      <RegisterRedirectClient />
    </Suspense>
  );
}
