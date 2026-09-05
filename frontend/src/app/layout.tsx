// ===========================================
// DealFlow360 - Root Layout
// ===========================================
// PHASE 0: Root layout with providers.
// ===========================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
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
        {/* TODO: Add AuthProvider wrapper in Phase 1 */}
        {children}
      </body>
    </html>
  );
}
