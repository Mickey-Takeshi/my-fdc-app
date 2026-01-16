/**
 * app/invite/[token]/page.tsx
 *
 * Phase 18: 招待承認ページ
 */

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // 未ログインの場合はログインページへ（招待トークンを保持）
      router.push(`/login?invite=${token}`);
      return;
    }

    // 招待を承認
    const acceptInvite = async () => {
      try {
        const response = await fetch('/api/invitations/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error);
          setStatus('error');
          return;
        }

        setStatus('success');

        // 3秒後にダッシュボードへ
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } catch (err) {
        console.error('Failed to accept invitation:', err);
        setError('招待の承認に失敗しました');
        setStatus('error');
      }
    };

    acceptInvite();
  }, [user, authLoading, token, router]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      {status === 'loading' && (
        <>
          <Loader size={48} className="animate-spin" color="var(--primary)" />
          <h2 style={{ margin: '16px 0 8px' }}>招待を処理しています...</h2>
          <p style={{ color: 'var(--text-light)' }}>しばらくお待ちください</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle size={48} color="var(--success)" />
          <h2 style={{ margin: '16px 0 8px' }}>招待を承認しました</h2>
          <p style={{ color: 'var(--text-light)' }}>
            ダッシュボードに移動します...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle size={48} color="var(--danger)" />
          <h2 style={{ margin: '16px 0 8px' }}>招待の承認に失敗しました</h2>
          <p style={{ color: 'var(--text-light)' }}>{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              marginTop: '24px',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#fff',
              background: 'var(--primary)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            ダッシュボードへ
          </button>
        </>
      )}
    </div>
  );
}
