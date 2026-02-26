'use client';

/**
 * app/login/page.tsx
 *
 * ログインページ
 * Phase 4: Google OAuth 認証対応
 *
 * - Supabase 設定済み: Google OAuth + デモ認証
 * - Supabase 未設定: localStorage 認証（デモモード）
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, LogIn, Rocket, Database, HardDrive } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'checking' | 'supabase' | 'local'>(
    'checking'
  );

  // URL パラメータからエラーを取得
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'access_denied':
          setError('Google ログインがキャンセルされました');
          break;
        case 'server_error':
          setError('サーバーエラーが発生しました');
          break;
        default:
          setError(`ログインエラー: ${errorParam}`);
      }
    }
  }, [searchParams]);

  // 認証モードを確認
  useEffect(() => {
    const checkAuthMode = async () => {
      try {
        console.log('[Login] Checking auth mode...');
        const res = await fetch('/api/auth/session');
        console.log('[Login] Session response status:', res.status);
        const data = await res.json();
        console.log('[Login] Session data:', data);

        if (data.mockMode) {
          console.log('[Login] Setting auth mode to local (mock)');
          setAuthMode('local');
        } else {
          console.log('[Login] Setting auth mode to supabase');
          setAuthMode('supabase');
          // 既にログイン済みならダッシュボードへ
          if (data.user) {
            console.log('[Login] User found, redirecting to dashboard');
            router.push('/dashboard');
          }
        }
      } catch (err) {
        // API エラー時は localStorage モード
        console.error('[Login] Error checking auth mode:', err);
        setAuthMode('local');
      }
    };

    checkAuthMode();
  }, [router]);

  // Google ログイン
  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase が設定されていません');
      return;
    }

    setIsGoogleLoading(true);
    setError('');

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks',
        },
      });

      if (authError) {
        console.error('[Login] Google OAuth error:', authError);
        setError('Google ログインに失敗しました');
        setIsGoogleLoading(false);
      }
      // 成功時は Google にリダイレクトされる
    } catch (err) {
      console.error('[Login] Google OAuth error:', err);
      setError('Google ログインに失敗しました');
      setIsGoogleLoading(false);
    }
  };

  // デモ認証（パスワード）
  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      // API 経由でデモログイン（Supabase モードでも動作する）
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'ログインに失敗しました');
        setIsLoading(false);
        return;
      }

      // localStorage にもセット（デモモード互換）
      localStorage.setItem(
        'fdc_session',
        JSON.stringify({
          user: data.user,
          loggedInAt: new Date().toISOString(),
        })
      );

      router.push('/dashboard');
    } catch (err) {
      console.error('[Login] Error:', err);
      setError('ログイン処理中にエラーが発生しました');
      setIsLoading(false);
    }
  };

  if (authMode === 'checking') {
    return (
      <div className="login-container">
        <div className="login-card">
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ marginBottom: '24px' }}>
          <Rocket
            size={48}
            style={{
              color: 'var(--primary)',
              marginBottom: '16px',
            }}
          />
        </div>

        <h1>FDC Modular</h1>
        <p>Founders Direct Cockpit - 学習用スターター</p>

        {/* 認証モード表示 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px',
            padding: '8px 12px',
            background: authMode === 'supabase' ? '#dcfce7' : '#fef3c7',
            borderRadius: '8px',
            fontSize: '12px',
            color: authMode === 'supabase' ? '#166534' : '#92400e',
          }}
        >
          {authMode === 'supabase' ? (
            <>
              <Database size={14} />
              Supabase 認証モード
            </>
          ) : (
            <>
              <HardDrive size={14} />
              ローカル認証モード（デモ）
            </>
          )}
        </div>

        {error && (
          <div
            className="alert alert-error"
            style={{ marginBottom: '16px', textAlign: 'left' }}
          >
            {error}
          </div>
        )}

        {/* Google ログインボタン（Supabase モード時のみ） */}
        {authMode === 'supabase' && (
          <>
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#1f2937',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: isGoogleLoading ? 'not-allowed' : 'pointer',
                opacity: isGoogleLoading ? 0.7 : 1,
                marginBottom: '16px',
              }}
            >
              {/* Google アイコン */}
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#4285F4"
                  d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
                />
                <path
                  fill="#34A853"
                  d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
                />
                <path
                  fill="#FBBC05"
                  d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"
                />
                <path
                  fill="#EA4335"
                  d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"
                />
              </svg>
              {isGoogleLoading ? 'ログイン中...' : 'Google でログイン'}
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '16px 0',
                color: 'var(--text-muted)',
                fontSize: '12px',
              }}
            >
              <div
                style={{ flex: 1, height: '1px', background: 'var(--border)' }}
              />
              <span style={{ padding: '0 12px' }}>または</span>
              <div
                style={{ flex: 1, height: '1px', background: 'var(--border)' }}
              />
            </div>
          </>
        )}

        {/* デモ認証（パスワード） */}
        <div className="form-group" style={{ textAlign: 'left' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={14} />
            デモ用パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleDemoLogin()}
            placeholder="パスワードを入力"
            disabled={isLoading}
          />
        </div>

        <button
          className="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={handleDemoLogin}
          disabled={isLoading}
        >
          <LogIn size={18} />
          {isLoading ? 'ログイン中...' : 'デモログイン'}
        </button>

        <p
          style={{
            marginTop: '24px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            background: 'var(--bg-gray)',
            padding: '12px',
            borderRadius: '8px',
          }}
        >
          デモ用パスワード: <code style={{ fontWeight: 600 }}>fdc</code>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-container">
          <div className="login-card">
            <p>読み込み中...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
