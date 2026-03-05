'use client';

/**
 * app/(app)/layout.tsx
 *
 * 認証済みユーザー用レイアウト
 * Phase 4: Cookie フォールバック追加、Supabase signOut 統合
 */

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, type AuthUser } from '@/lib/contexts/AuthContext';
import { createClient } from '@/lib/client/supabase';
import LandingPage from '@/components/landing/default/LandingPage';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Building2,
  Map,
  Target,
  Sparkles,
  Grid3X3,
  Compass,
  Settings,
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
  { href: '/action-maps', label: 'Action Map', icon: Map },
  { href: '/okr', label: 'OKR', icon: Target },
  { href: '/brand', label: 'Brand', icon: Sparkles },
  { href: '/lean-canvas', label: 'Canvas', icon: Grid3X3 },
  { href: '/mvv', label: 'MVV', icon: Compass },
  { href: '/leads', label: 'リード', icon: Users },
  { href: '/clients', label: 'クライアント', icon: Building2 },
  { href: '/settings', label: '設定', icon: Settings },
];

/**
 * Cookie から fdc_session の値を取得
 * OAuth コールバックは Cookie のみ設定するため、Cookie からの読み取りが必要
 */
function getSessionFromCookie(): string | null {
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith('fdc_session='));

  if (!match) return null;

  try {
    return decodeURIComponent(match.substring('fdc_session='.length));
  } catch {
    return null;
  }
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(() => {
    // 1. localStorage を優先チェック（デモログインで設定）
    let sessionStr = localStorage.getItem('fdc_session');

    // 2. localStorage になければ Cookie をチェック（OAuth コールバックで設定）
    if (!sessionStr) {
      const cookieValue = getSessionFromCookie();
      if (cookieValue) {
        sessionStr = cookieValue;
        // localStorage に同期して次回以降の読み取りを高速化
        localStorage.setItem('fdc_session', cookieValue);
      }
    }

    if (!sessionStr) {
      // 未ログイン時はリダイレクトせず、LP を表示
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(sessionStr);
      setUser(parsed.user);
    } catch {
      // セッション無効の場合も LP を表示
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = () => {
    // Supabase セッションをクリア（非同期、エラーは無視）
    const supabase = createClient();
    supabase.auth.signOut().catch(() => {
      // ログアウト失敗してもローカル状態はクリアする
    });

    // fdc_session をクリア
    localStorage.removeItem('fdc_session');
    document.cookie = 'fdc_session=; path=/; max-age=0';

    // ハードナビゲーションで確実にリダイレクト
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        読み込み中...
      </div>
    );
  }

  // 未ログイン時は LP を表示
  if (!user) {
    return <LandingPage />;
  }

  return (
    <AuthProvider user={user} loading={loading} logout={handleLogout}>
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
