import SuperadminSidebar from '@/components/SuperadminSidebar';

export const metadata = { title: 'Superadmin — FashionMall' };

export default function SuperadminLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3f0' }}>
      <SuperadminSidebar />
      <main style={{ marginLeft: '240px', flex: 1, minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
        {children}
      </main>
    </div>
  );
}
