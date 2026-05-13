'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard'  },
  { href: '/admin/products',  label: 'Productos'  },
  { href: '/admin/users',     label: 'Usuarios'   },
  { href: '/admin/store',     label: 'Mi tienda'  },
];


export default function AdminSidebar() {
  const pathname           = usePathname();
  const { data: session }  = useSession();
  const [open, setOpen]    = useState(false);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside style={{
        width: '220px', background: '#0f0f0f', color: '#fff',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        zIndex: 200,
      }}>
        <div style={{ padding: '22px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', letterSpacing: '0.08em', color: '#fff' }}>
              FASHION<span style={{ color: '#6b6560' }}>MALL</span>
            </div>
          </Link>
          <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: '3px' }}>
            Panel Admin
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'block', padding: '10px 20px',
                fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                background: active ? 'rgba(255,255,255,0.08)' : 'none',
                textDecoration: 'none', transition: 'all 0.2s',
                borderLeft: active ? '2px solid #fff' : '2px solid transparent',
              }}>
                {item.label}
              </Link>
            );
          })}

          <div style={{ margin: '10px 16px', height: '0.5px', background: 'rgba(255,255,255,0.08)' }} />

          {session?.user?.role === 'superadmin' && (
            <Link href="/superadmin/stores" style={{ display: 'block', padding: '10px 20px', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a78bfa', textDecoration: 'none' }}>
              Superadmin →
            </Link>
          )}
          <Link href={session?.user?.store_slug ? `/store/${session.user.store_slug}` : '/'} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px 20px', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
            Ver tienda →
          </Link>
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          {session && (
            <div style={{ marginBottom: '10px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.user.username || session.user.email}
            </div>
          )}
          <button onClick={() => signOut({ callbackUrl: '/' })} style={{
            background: 'none', border: '0.5px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '6px 12px', borderRadius: '2px', width: '100%',
            fontFamily: 'var(--font-sans)',
          }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: '52px',
        background: '#0f0f0f', zIndex: 200,
        alignItems: 'center', padding: '0 16px', gap: '12px',
        '@media (max-width: 768px)': { display: 'flex' },
      }}>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-mobile-bar { display: flex !important; }
          .admin-main { margin-left: 0 !important; padding-top: 52px !important; }
        }
      `}</style>
    </>
  );
}
