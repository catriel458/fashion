export const metadata = { title: 'Probador Virtual' };
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'Georgia, serif', background: '#fafaf8', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
