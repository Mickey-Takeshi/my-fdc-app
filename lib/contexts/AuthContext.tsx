'use client';

/**
 * lib/contexts/AuthContext.tsx
 *
 * 認証コンテキスト（ミニマルスターター版）
 * SaaS版と同じパターンを使用
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  user: User | null;
  loading: boolean;
  children: ReactNode;
}

export function AuthProvider({ user, loading, children }: AuthProviderProps) {
  return (
    <AuthContext.Provider value={{ user, loading }}>
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
