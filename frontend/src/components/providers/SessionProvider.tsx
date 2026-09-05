// ===========================================
// DealFlow360 - NextAuth Session Provider
// ===========================================

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/lib/rbac';

interface Props {
  children: React.ReactNode;
}

export function SessionProvider({ children }: Props) {
  return (
    <NextAuthSessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </NextAuthSessionProvider>
  );
}
