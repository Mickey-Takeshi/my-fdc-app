'use client';

/**
 * app/(app)/dashboard/page.tsx
 *
 * ダッシュボードページ
 * Phase 13: Google Calendar 連携（今日の予定表示）
 */

import { Rocket, ArrowRight, CheckSquare, Settings, Database } from 'lucide-react';
import { TodaySchedule } from '@/app/_components/calendar';

export default function DashboardPage() {
  return (
    <div>
      {/* ウェルカムカード */}
      <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <Rocket
          size={64}
          style={{
            color: 'var(--primary)',
            marginBottom: '24px',
          }}
        />

        <h2 style={{
          fontSize: '28px',
          fontWeight: 700,
          marginBottom: '16px',
          color: 'var(--text-dark)',
          border: 'none',
          padding: 0,
        }}>
          FDC Modular Starter へようこそ！
        </h2>

        <p style={{
          color: 'var(--text-light)',
          fontSize: '16px',
          marginBottom: '32px',
          maxWidth: '500px',
          margin: '0 auto 32px',
        }}>
          このダッシュボードは Phase 0 の初期状態です。<br />
          各 Phase を進めることで機能が追加されていきます。
        </p>

        {/* 次のステップ */}
        <div style={{
          background: 'var(--bg-gray)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'left',
          maxWidth: '400px',
          margin: '0 auto',
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-dark)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            📚 次のステップ
          </h3>

          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckSquare size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-medium)' }}>
                Phase 1: タスク機能を追加
              </span>
              <ArrowRight size={14} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Settings size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-medium)' }}>
                Phase 2: 設定ページを追加
              </span>
              <ArrowRight size={14} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Database size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-medium)' }}>
                Phase 3: Supabase 統合
              </span>
              <ArrowRight size={14} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
            </li>
          </ul>
        </div>
      </div>

      {/* 今日の予定（Phase 13） */}
      <div className="card" style={{ marginTop: '24px', padding: '20px' }}>
        <TodaySchedule />
      </div>

      {/* Coming Soon カード */}
      <div className="stats-grid" style={{ marginTop: '24px' }}>
        <div className="stat-card" style={{ opacity: 0.6 }}>
          <div className="stat-value">—</div>
          <div className="stat-label">タスク数（Phase 1）</div>
        </div>
        <div className="stat-card" style={{ opacity: 0.6 }}>
          <div className="stat-value">—</div>
          <div className="stat-label">完了数（Phase 1）</div>
        </div>
        <div className="stat-card" style={{ opacity: 0.6 }}>
          <div className="stat-value">—</div>
          <div className="stat-label">進捗率（Phase 1）</div>
        </div>
      </div>
    </div>
  );
}
