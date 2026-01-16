'use client';

/**
 * app/(app)/settings/page.tsx
 *
 * 設定ページ
 */

import { SettingsTab } from '@/app/_components/settings';
import { SettingsProvider } from '@/lib/contexts/SettingsContext';

export default function SettingsPage() {
  return (
    <SettingsProvider>
      <SettingsTab />
    </SettingsProvider>
  );
}
