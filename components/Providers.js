'use client';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { FittingRoomProvider } from './FittingRoomContext';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <FittingRoomProvider>
        <Toaster position="top-center" />
        {children}
      </FittingRoomProvider>
    </SessionProvider>
  );
}
