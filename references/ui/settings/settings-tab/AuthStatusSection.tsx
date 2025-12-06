/**
 * app/_components/settings/settings-tab/AuthStatusSection.tsx
 * 認証状態セクション
 */

import Image from 'next/image';
import { User, LogIn, LogOut } from 'lucide-react';
import { AuthUser } from '@/lib/hooks/useSettingsViewModel';

interface AuthStatusSectionProps {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  onSignIn: () => void;
  onSignOut: () => Promise<void>;
}

export function AuthStatusSection({
  user,
  isAuthenticated,
  loading,
  onSignIn,
  onSignOut,
}: AuthStatusSectionProps) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-light)' }}>
        読み込み中...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'var(--text-light)', marginBottom: '16px' }}>
          ログインしていません
        </div>
        <button
          onClick={onSignIn}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          <LogIn size={16} />
          Googleでログイン
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {user.picture ? (
          <Image
            src={user.picture}
            alt="Profile"
            width={48}
            height={48}
            style={{
              borderRadius: '50%',
              border: '2px solid var(--primary)',
            }}
          />
        ) : (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-gray)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={24} color="var(--text-light)" />
          </div>
        )}
        <div>
          <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
            {user.name || user.email}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-light)' }}>
            {user.email}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--primary)',
              marginTop: '4px',
            }}
          >
            &#10003; ログイン中
          </div>
        </div>
      </div>
      <button
        onClick={onSignOut}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          backgroundColor: 'white',
          color: 'var(--text-dark)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        <LogOut size={16} />
        ログアウト
      </button>
    </div>
  );
}
