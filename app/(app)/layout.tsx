'use client';

/**
 * app/(app)/layout.tsx
 *
 * 認証済みユーザー用レイアウト（Phase 0: 認証のみ）
 * Phase 1 で DataProvider を追加します
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, type AuthUser } from '@/lib/contexts/AuthContext';
// Phase 1 で追加: import { DataProvider } from '@/lib/contexts/DataContext';
import {
  LayoutDashboard,
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
  // ランブックで追加: { href: '/tasks', label: 'タスク', icon: CheckSquare },
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
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(session);
      setUser(parsed.user);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = () => {
    localStorage.removeItem('fdc_session');
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        読み込み中...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AuthProvider user={user} loading={loading}>
      {/* Phase 1 で DataProvider でラップ */}
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
