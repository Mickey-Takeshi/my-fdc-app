'use client';

/**
 * lib/contexts/AuthContext.tsx
 *
 * 認証コンテキスト
 * Phase 4: logout 関数を追加、useAuth フックで認証状態とログアウトを提供
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  user: User | null;
  loading: boolean;
  logout: () => void;
  children: ReactNode;
}

export function AuthProvider({ user, loading, logout, children }: AuthProviderProps) {
  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { User as AuthUser };
