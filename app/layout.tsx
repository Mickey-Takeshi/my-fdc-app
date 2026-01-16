/**
 * app/layout.tsx
 *
 * ルートレイアウト（ミニマルスターター版）
 * Phase 22: フォント最適化・Web Vitals計測追加
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WebVitals } from '@/app/_components/analytics/WebVitals';

// フォント最適化: subset指定でサイズ削減
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // FOUT防止: フォント読み込み中は代替フォント表示
  preload: true,
});

export const metadata: Metadata = {
  title: 'FDC Modular Starter',
  description: 'Founders Direct Cockpit - Modular Starter',
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
        {children}
      </body>
    </html>
  );
}
