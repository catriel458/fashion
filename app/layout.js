import './globals.css';
import Providers from '@/components/Providers';
import ChatBot from '@/components/ChatBot';

export const metadata = { title: 'TnB — Try & Buy' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          {children}
          <ChatBot />
        </Providers>
      </body>
    </html>
  );
}
