'use client';

/**
 * app/login/page.tsx
 *
 * ログインページ（ミニマルスターター版）
 * SaaS版と同じUI・デザインを使用
 * デモ用: パスワード = "fdc"
 */

import { useState } from 'react';
import { Lock, LogIn, Rocket } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    // デモ用認証
    if (password === 'fdc') {
      const sessionData = JSON.stringify({
        user: { id: '1', email: 'demo@example.com', name: 'Demo User' },
        loggedInAt: new Date().toISOString(),
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
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
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
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={handleLogin}
          disabled={isLoading}
        >
          <LogIn size={18} />
          {isLoading ? 'ログイン中...' : 'ログイン'}
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
