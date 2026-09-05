// ===========================================
// DealFlow360 - Root Layout
// ===========================================
// Root layout with session provider and global loading overlay
// ===========================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider, LoadingProvider, LoadingInitializer } from '@/components/providers';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DealFlow360 - Intelligent Sales Operations',
  description: 'Streamline your sales operations with DealFlow360',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LoadingProvider>
          <LoadingInitializer />
          <LoadingOverlay />
          <SessionProvider>
            {children}
          </SessionProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
