'use client';

/**
 * app/login/page.tsx
 *
 * ログインページ（Supabase Auth + Google OAuth）
 * デモモード: パスワード "fdc" でも引き続きログイン可能
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, Rocket, Chrome } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
        },
      });
      if (authError) {
        setError(authError.message);
        setIsLoading(false);
      }
    } catch {
      setError('ログインに失敗しました');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    if (password === 'fdc') {
      const sessionData = JSON.stringify({
        user: { id: '1', email: 'demo@example.com', name: 'Demo User' },
        loggedInAt: new Date().toISOString(),
      });
      localStorage.setItem('fdc_session', sessionData);
      document.cookie = `fdc_session=${encodeURIComponent(sessionData)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      await new Promise(resolve => setTimeout(resolve, 300));
      router.push('/dashboard');
    } else {
      setError('パスワードが違います');
      setIsLoading(false);
    }
  };

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
        <p>Founders Direct Cockpit</p>

        {/* Google OAuth */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '24px' }}
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <Chrome size={18} />
          Google でログイン
        </button>

        <div style={{
          margin: '20px 0',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '12px',
        }}>
          または
        </div>

        {/* デモログイン */}
        <div className="form-group" style={{ textAlign: 'left' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={14} />
            デモパスワード
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

        {error && (
          <div
            className="alert alert-error"
            style={{ marginBottom: '16px', textAlign: 'left' }}
          >
            {error}
          </div>
        )}

        <button
          className="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={handleDemoLogin}
          disabled={isLoading}
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
