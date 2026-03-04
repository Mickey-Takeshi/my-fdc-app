'use client';

/**
 * app/(app)/layout.tsx
 *
 * 認証済みユーザー用レイアウト
 * Phase 0: 認証 / Phase 1: タスクページ追加
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, type AuthUser } from '@/lib/contexts/AuthContext';
// Phase 2 以降で DataProvider 統合を検討
import LandingPage from '@/components/landing/default/LandingPage';
import {
  LayoutDashboard,
  CheckSquare,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/tasks', label: 'タスク', icon: CheckSquare },
  // ランブックで追加: { href: '/settings', label: '設定', icon: Settings },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(() => {
    const session = localStorage.getItem('fdc_session');
    if (!session) {
      // 未ログイン時はリダイレクトせず、LPを表示
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(session);
      setUser(parsed.user);
    } catch {
      // セッション無効の場合もLPを表示
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = () => {
    localStorage.removeItem('fdc_session');
    // Cookie も削除（proxy.ts のルート保護と同期）
    document.cookie = 'fdc_session=; path=/; max-age=0';
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        読み込み中...
      </div>
    );
  }

  // 未ログイン時はLPを表示
  if (!user) {
    return <LandingPage />;
  }

  return (
    <AuthProvider user={user} loading={loading}>
      {/* ヘッダー */}
      <header className="header">
        <div className="header-content">
          <h1>FDC Modular</h1>
          <p className="subtitle">Founders Direct Cockpit - 学習用スターター</p>
        </div>
        <div className="header-actions">
          <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>
            {user.name || user.email}
          </span>
          <button className="btn btn-secondary btn-small" onClick={handleLogout}>
            <LogOut size={16} />
            ログアウト
          </button>
        </div>
      </header>

      {/* タブナビゲーション */}
      <div className="container">
        <nav className="tabs">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`tab ${pathname === item.href ? 'active' : ''}`}
              >
                <Icon className="tab-icon" size={20} />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* メインコンテンツ */}
        <main>{children}</main>
      </div>
    </AuthProvider>
  );
}
