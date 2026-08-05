import ShoppingAdminSidebar from '@/components/ShoppingAdminSidebar';

export const metadata = { title: 'Shopping Admin — TnB Fashion' };

export default function ShoppingAdminLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3f0' }}>
      <ShoppingAdminSidebar />
      <main style={{ marginLeft: '220px', flex: 1, minHeight: '100vh', fontFamily: 'var(--font-sans)' }} className="admin-main">
        {children}
      </main>
    </div>
  );
}
