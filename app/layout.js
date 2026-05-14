import './globals.css';
import Providers from '@/components/Providers';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';

export const metadata = { title: 'CnB — Choose and Buy' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <EmailVerificationBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
