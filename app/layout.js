import './globals.css';
import Providers from '@/components/Providers';

export const metadata = { title: 'CnB — Choose and Buy' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
