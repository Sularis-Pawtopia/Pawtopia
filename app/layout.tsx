import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { GlobalNav } from '@/components/layout/GlobalNav';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pawtopia - Find Your Perfect Pet Companion',
  description: 'Connect with shelters and find your perfect pet companion. Adopt, don\'t shop!',
  keywords: ['pet adoption', 'animal shelter', 'adopt pets', 'rescue animals'],
  icons: {
    icon: '/favicon.ico?v=2',
    shortcut: '/favicon.ico?v=2',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Suspense fallback={null}>
            <GlobalNav />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
