import AdminSidebar from '@/components/AdminSidebar';

export const metadata = { title: 'Admin — FashionMall' };

export default function AdminLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3f0' }}>
      <AdminSidebar />
      <main style={{ marginLeft: '220px', flex: 1, minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
        {children}
      </main>
    </div>
  );
}
