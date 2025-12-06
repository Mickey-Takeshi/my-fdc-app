/**
 * app/_components/admin/sa-dashboard/SystemMetrics.tsx
 *
 * Phase 14.3-B: システムメトリクス表示コンポーネント
 *
 * 【責務】
 * - キャッシュ状態の表示
 * - 同期キュー状態の表示
 * - Vercel Analyticsへのリンク
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Database, Zap, Clock, ExternalLink } from 'lucide-react';

// ========================================
// 型定義
// ========================================

interface CacheStats {
  enabled: boolean;
  type: 'memory' | 'vercel-kv' | 'disabled';
  ttlSeconds: number;
}

interface SystemMetricsData {
  timestamp: string;
  cache: {
    session: CacheStats;
    workspace: CacheStats;
  };
  sync: {
    queueLength: number;
  };
  analyticsUrl: string;
}

// ========================================
// コンポーネント
// ========================================

export function SystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/system-metrics', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const getCacheTypeLabel = (type: CacheStats['type']) => {
    switch (type) {
      case 'vercel-kv':
        return 'Vercel KV (Redis)';
      case 'memory':
        return 'メモリ (開発モード)';
      case 'disabled':
        return '無効';
    }
  };

  const getCacheStatusColor = (enabled: boolean) => {
    return enabled ? 'var(--primary)' : '#ef4444';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <RefreshCw
          size={24}
          style={{ animation: 'spin 1s linear infinite' }}
        />
        <p style={{ marginTop: '8px', color: 'var(--text-light)' }}>
          読み込み中...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
        }}
      >
        <p>エラー: {error}</p>
        <button
          onClick={fetchMetrics}
          style={{
            marginTop: '8px',
            padding: '8px 16px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          再試行
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div style={{ marginTop: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
          システムメトリクス
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchMetrics}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              backgroundColor: 'var(--bg-gray)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            <RefreshCw size={14} />
            更新
          </button>
          <a
            href="https://vercel.com/analytics"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '13px',
            }}
          >
            <ExternalLink size={14} />
            Vercel Analytics
          </a>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* セッションキャッシュ */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Zap size={20} style={{ color: 'var(--primary)' }} />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
              セッションキャッシュ
            </h4>
            <span
              style={{
                marginLeft: 'auto',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getCacheStatusColor(metrics.cache.session.enabled),
              }}
            />
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>タイプ:</span>
              <span style={{ fontWeight: '500', color: 'var(--text-dark)' }}>
                {getCacheTypeLabel(metrics.cache.session.type)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TTL:</span>
              <span style={{ fontWeight: '500', color: 'var(--text-dark)' }}>
                {metrics.cache.session.ttlSeconds}秒
              </span>
            </div>
          </div>
        </div>

        {/* ワークスペースキャッシュ */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Database size={20} style={{ color: 'var(--primary)' }} />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
              ワークスペースキャッシュ
            </h4>
            <span
              style={{
                marginLeft: 'auto',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getCacheStatusColor(metrics.cache.workspace.enabled),
              }}
            />
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>タイプ:</span>
              <span style={{ fontWeight: '500', color: 'var(--text-dark)' }}>
                {getCacheTypeLabel(metrics.cache.workspace.type)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TTL:</span>
              <span style={{ fontWeight: '500', color: 'var(--text-dark)' }}>
                {metrics.cache.workspace.ttlSeconds}秒
              </span>
            </div>
          </div>
        </div>

        {/* 同期キュー */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Clock size={20} style={{ color: 'var(--primary)' }} />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
              同期キュー
            </h4>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>待機中ジョブ:</span>
              <span
                style={{
                  fontWeight: '600',
                  fontSize: '18px',
                  color: metrics.sync.queueLength > 0 ? '#f59e0b' : 'var(--primary)',
                }}
              >
                {metrics.sync.queueLength}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p
        style={{
          marginTop: '12px',
          fontSize: '12px',
          color: 'var(--text-light)',
          textAlign: 'right',
        }}
      >
        最終更新: {new Date(metrics.timestamp).toLocaleString('ja-JP')}
      </p>
    </div>
  );
}
