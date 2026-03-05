'use client';

/**
 * app/login/page.tsx
 *
 * ログインページ
 * Phase 4: Google OAuth ボタン追加 + デモ用パスワードログイン
 */

import { useState, useEffect } from 'react';
import { Lock, LogIn, Rocket, Globe, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/client/supabase';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // OAuth コールバックからのエラーハンドリング
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('error');
    if (authError) {
      setError('認証に失敗しました。もう一度お試しください。');
      // URL をクリーンアップ
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  // Google OAuth ログイン
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (oauthError) {
        setError('Google ログインの開始に失敗しました');
        setIsGoogleLoading(false);
      }
      // 成功時は Google へリダイレクトされるため、ローディング状態は維持
    } catch {
      setError('Google ログインに失敗しました');
      setIsGoogleLoading(false);
    }
  };

  // デモ用パスワードログイン
  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError('');

    if (password === 'fdc') {
      const sessionData = JSON.stringify({
        user: { id: '1', email: 'demo@example.com', name: 'Demo User' },
        loggedInAt: new Date().toISOString(),
        provider: 'demo',
      });
      // localStorage に保存（クライアント側の認証チェック用）
      localStorage.setItem('fdc_session', sessionData);
      // Cookie に保存（proxy.ts のサーバー側ルート保護用）
      document.cookie = `fdc_session=${encodeURIComponent(sessionData)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      // 少し遅延を入れてUIを見せる
      await new Promise(resolve => setTimeout(resolve, 300));
      // ハードナビゲーションで確実に Cookie を送信
      window.location.href = '/dashboard';
    } else {
      setError('パスワードが違います');
      setIsLoading(false);
    }
  };

  const anyLoading = isLoading || isGoogleLoading;

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

        {/* エラー表示 */}
        {error && (
          <div
            className="alert alert-error"
            style={{ marginBottom: '16px', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          </div>
        )}

        {/* Google OAuth ボタン */}
        <button
          className="btn btn-secondary"
          style={{
            width: '100%',
            padding: '14px 24px',
            fontSize: '15px',
            border: '1px solid var(--border)',
          }}
          onClick={handleGoogleLogin}
          disabled={anyLoading}
        >
          <Globe size={20} />
          {isGoogleLoading ? 'リダイレクト中...' : 'Google でログイン'}
        </button>

        {/* 区切り線 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: '24px 0',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span>または</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* デモ用パスワードログイン */}
        <div className="form-group" style={{ textAlign: 'left' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={14} />
            パスワード
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
            disabled={anyLoading}
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={handleDemoLogin}
          disabled={anyLoading}
        >
          <LogIn size={18} />
          {isLoading ? 'ログイン中...' : 'デモログイン'}
        </button>

        <p style={{
          marginTop: '24px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          background: 'var(--bg-gray)',
          padding: '12px',
          borderRadius: '8px',
        }}>
          デモ用パスワード: <code style={{ fontWeight: 600 }}>fdc</code>
        </p>
      </div>
    </div>
  );
}
