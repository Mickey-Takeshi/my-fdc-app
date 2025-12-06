/**
 * lib/contexts/AuthContext.tsx
 *
 * 認証情報をアプリ全体で共有するContext
 * - layout.tsx で1回のみ認証APIを呼び出し
 * - 子コンポーネントは useAuth() で認証情報を取得
 */

'use client';

import { createContext, useContext, ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  accountType: string;
  workspaceId: string | null;
  workspaceRole: string | null;
  trialDaysRemaining: number | null;
  isTrialExpired: boolean;
  createdAt: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  user: AuthUser | null;
  loading: boolean;
}

export function AuthProvider({ children, user, loading }: AuthProviderProps) {
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * useWorkspace の代替として使用可能
 * 既存の useWorkspace と互換性のあるインターフェース
 */
export function useAuthWorkspace() {
  const { user, loading } = useAuth();

  return {
    workspaceId: user?.workspaceId ?? null,
    workspaceRole: user?.workspaceRole ?? null,
    accountType: user?.accountType ?? null,
    userId: user?.id ?? null,
    loading,
    error: null as string | null,
  };
}
