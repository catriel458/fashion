'use client'
import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

function AuthRefreshInner() {
  const { update, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (status === 'loading') return
    const refresh = async () => {
      // Forzar refresco del JWT — el callback jwt leerá email_verified desde la DB
      await update({})
      const verified = searchParams.get('verified')
      const redirect = searchParams.get('redirect') || '/'
      router.replace(verified ? '/?verified=true' : redirect)
    }
    refresh()
  }, [status])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" />
        <p className="text-muted">Verificando tu cuenta...</p>
      </div>
    </div>
  )
}

export default function AuthRefreshPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="text-muted">Verificando tu cuenta...</p>
        </div>
      </div>
    }>
      <AuthRefreshInner />
    </Suspense>
  )
}
