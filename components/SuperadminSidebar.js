'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const NAV = [
  { href: '/superadmin/dashboard',  label: 'Dashboard'     },
  { href: '/superadmin/stores',     label: 'Tiendas'       },
  { href: '/superadmin/stores/new', label: '+ Crear tienda' },
  { href: '/superadmin/products',   label: 'Productos'     },
  { href: '/superadmin/users',      label: 'Usuarios'      },
  { href: '/superadmin/fitting-monitor', label: 'Monitor Probador' },
  { href: '/superadmin/settings',   label: 'Configuración' },
];

export default function SuperadminSidebar() {
  const pathname          = usePathname();
  const { data: session } = useSession();
  const [open, setOpen]    = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <aside style={{
        width: '240px', background: '#1a0a2e', color: '#fff',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 200,
      }} className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div style={{ padding: '22px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', letterSpacing: '0.08em', color: '#fff' }}>
              TnB<span style={{ color: '#a78bfa', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.18em', marginLeft: '4px' }}>Try & Buy</span>
            </div>
          </Link>
          <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: '3px' }}>
            Panel Superadmin
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/superadmin' && pathname.startsWith(item.href) && item.href !== '/superadmin/stores/new');
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'block', padding: '10px 20px',
                fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                background: active ? 'rgba(167,139,250,0.15)' : 'none',
                textDecoration: 'none', transition: 'all 0.2s',
                borderLeft: active ? '2px solid #a78bfa' : '2px solid transparent',
              }}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          {session && (
            <div style={{ marginBottom: '10px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.user.username || session.user.email}
            </div>
          )}
          <button onClick={() => signOut({ callbackUrl: '/stores' })} style={{
            background: 'none', border: '0.5px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '6px 12px', borderRadius: '2px', width: '100%', fontFamily: 'var(--font-sans)',
          }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: '56px',
        background: '#1a0a2e', zIndex: 190,
        alignItems: 'center', justifyContent: 'space-between', padding: '0 16px',
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
      }} className="admin-mobile-bar">
        <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '1.4rem', padding: '4px' }} aria-label="Abrir menú">
          ☰
        </button>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', letterSpacing: '0.08em', color: '#fff' }}>
            TnB
          </div>
        </Link>
        <div style={{ width: 28 }} />
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.5)' }}
          className="admin-sidebar-backdrop"
        />
      )}
    </>
  );
}
