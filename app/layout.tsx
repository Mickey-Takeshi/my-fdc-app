/**
 * app/layout.tsx
 *
 * ルートレイアウト（ミニマルスターター版）
 * Phase 23: PWA manifest + theme-color
 * Phase 24: SEO metadata (OpenGraph)
 */

import type { Metadata } from 'next';
import './globals.css';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: 'FDC Modular - Founders Direct Cockpit',
  description:
    'Business management tool for founders. Task management, OKR, CRM, Brand Strategy and more.',
  openGraph: {
    title: 'FDC Modular - Founders Direct Cockpit',
    description: 'Business management tool for founders.',
    type: 'website',
  },
  manifest: '/manifest.json',
  other: {
    'theme-color': '#667eea',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
