/**
 * app/page.tsx
 *
 * ルートページ → ログインページへリダイレクト
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/login');
}
