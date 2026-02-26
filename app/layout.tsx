/**
 * ルートレイアウト
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WebVitals } from '@/app/_components/analytics/WebVitals';
import { ServiceWorkerRegistration } from '@/app/_components/pwa/ServiceWorkerRegistration';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'FDC - スタートアップ成長プラットフォーム',
  description:
    'スタートアップの成長を加速するオールインワンプラットフォーム。OKR管理、顧客管理、タスク管理を一元化。',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FDC',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    title: 'FDC - スタートアップ成長プラットフォーム',
    description:
      'スタートアップの成長を加速するオールインワンプラットフォーム。OKR管理、顧客管理、タスク管理を一元化。',
    type: 'website',
    locale: 'ja_JP',
    siteName: 'FDC',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FDC - スタートアップ成長プラットフォーム',
    description:
      'スタートアップの成長を加速するオールインワンプラットフォーム。OKR管理、顧客管理、タスク管理を一元化。',
  },
};

export const viewport: Viewport = {
  themeColor: '#667eea',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <WebVitals />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
