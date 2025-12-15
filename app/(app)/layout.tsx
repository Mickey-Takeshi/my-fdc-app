'use client';

/**
 * app/(app)/layout.tsx
 *
 * 認証済みユーザー用レイアウト
 * Phase 3: Supabase 認証対応
 *
 * - Supabase 設定済み: API 経由で認証チェック
 * - Supabase 未設定: localStorage 認証（デモモード）
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, type AuthUser } from '@/lib/contexts/AuthContext';
import { WorkspaceProvider } from '@/lib/contexts/WorkspaceContext';
import {
  LayoutDashboard,
  LogOut,
  CheckSquare,
  Settings,
  Database,
  HardDrive,
  Users,
  Briefcase,
  Map,
  Target,
  Shield,
  Sparkles,
  LayoutGrid,
  Compass,
  type LucideIcon,
} from 'lucide-react';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';

interface NavItemWithRole {
  href: string;
  label: string;
  icon: LucideIcon;
  requireRole?: ('OWNER' | 'ADMIN')[];
}

const NAV_ITEMS: NavItemWithRole[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/okr', label: 'OKR', icon: Target },
  { href: '/leads', label: 'リード', icon: Users },
  { href: '/clients', label: '顧客', icon: Briefcase },
  { href: '/tasks', label: 'タスク', icon: CheckSquare },
  { href: '/action-maps', label: 'ActionMap', icon: Map },
  { href: '/brand', label: 'ブランド', icon: Sparkles },
  { href: '/lean-canvas', label: 'Lean Canvas', icon: LayoutGrid },
  { href: '/mvv', label: 'MVV', icon: Compass },
  { href: '/settings', label: '設定', icon: Settings },
  { href: '/admin', label: '管理', icon: Shield, requireRole: ['OWNER', 'ADMIN'] },
];

// Navigation component that can use workspace context
function Navigation({ pathname }: { pathname: string }) {
  const { role } = useWorkspace();

  return (
    <nav className="tabs">
      {NAV_ITEMS.filter((item) => {
        if (!item.requireRole) return true;
        return role && item.requireRole.includes(role as 'OWNER' | 'ADMIN');
      }).map((item) => {
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
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'supabase' | 'local'>('local');

  const checkAuth = useCallback(async () => {
    try {
      // まず API で認証チェック
      const res = await fetch('/api/auth/session');
      const data = await res.json();

      if (data.mockMode) {
        // Supabase 未設定 → localStorage モード
        setAuthMode('local');
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
          return;
        }
      } else if (data.user) {
        // Supabase 認証成功
        setAuthMode('supabase');
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          accountType: data.user.accountType,
        });
      } else {
        // 認証失敗
        router.push('/login');
        return;
      }
    } catch {
      // API エラー → localStorage フォールバック
      setAuthMode('local');
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
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      if (authMode === 'supabase') {
        // API 経由でログアウト
        await fetch('/api/auth/logout', { method: 'POST' });
      }
    } catch (err) {
      console.error('[Logout] API error:', err);
    }

    // localStorage もクリア
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
      <WorkspaceProvider>
        {/* ヘッダー */}
        <header className="header">
        <div className="header-content">
          <h1>FDC Modular</h1>
          <p className="subtitle">Founders Direct Cockpit - 学習用スターター</p>
        </div>
        <div className="header-actions">
          {/* 認証モード表示 */}
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              padding: '4px 8px',
              background: authMode === 'supabase' ? '#dcfce7' : '#fef3c7',
              borderRadius: '4px',
              color: authMode === 'supabase' ? '#166534' : '#92400e',
            }}
          >
            {authMode === 'supabase' ? (
              <Database size={12} />
            ) : (
              <HardDrive size={12} />
            )}
            {authMode === 'supabase' ? 'DB' : 'Local'}
          </span>
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
        <Navigation pathname={pathname} />

        {/* メインコンテンツ */}
        <main>{children}</main>
      </div>
      </WorkspaceProvider>
    </AuthProvider>
  );
}
