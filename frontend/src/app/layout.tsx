// ===========================================
// DealFlow360 - Root Layout
// ===========================================
// Root layout with session provider and global loading overlay
// ===========================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider, LoadingProvider, LoadingInitializer, ToastProvider, ToastInitializer } from '@/components/providers';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DealFlow360 - Intelligent Sales Operations',
  description: 'Streamline your sales operations with DealFlow360',
  icons: {
    icon: '/favicon.ico?v=2',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <LoadingProvider>
          <LoadingInitializer />
          <LoadingOverlay />
          <ToastProvider>
            <ToastInitializer />
            <SessionProvider>
              {children}
            </SessionProvider>
          </ToastProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
