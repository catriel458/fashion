'use client';
import { SessionProvider } from 'next-auth/react';
import { FittingRoomProvider } from './FittingRoomContext';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <FittingRoomProvider>
        {children}
      </FittingRoomProvider>
    </SessionProvider>
  );
}
