import './globals.css';

export const metadata = { title: 'FashionMall — Tu shopping virtual' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}