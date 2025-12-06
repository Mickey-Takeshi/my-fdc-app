'use client';

import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { Lead } from '@/lib/hooks/useLeads';

interface ApproachStatsSectionProps {
  leads: Lead[];
}

const CHANNEL_LABELS: Record<string, string> = {
  REAL: 'リアル',
  HP: 'HP',
  MAIL_MAGAZINE: 'メルマガ',
  MESSENGER: 'メッセンジャー',
  X: 'X',
  PHONE_SMS: '電話・SMS',
  WEB_APP: 'WEBアプリ',
  OTHER: 'その他',
};

export function ApproachStatsSection({ leads }: ApproachStatsSectionProps) {
  const [showApproachForm, setShowApproachForm] = useState(false);

  // チャネル別の統計を計算
  const channelStats = leads.reduce((acc, lead) => {
    const channel = lead.channel || 'OTHER';
    if (!acc[channel]) {
      acc[channel] = { total: 0, responded: 0 };
    }
    acc[channel].total++;
    if (lead.status !== 'UNCONTACTED') {
      acc[channel].responded++;
    }
    return acc;
  }, {} as Record<string, { total: number; responded: number }>);

  return (
    <div className="card" style={{
      marginBottom: '30px',
      background: 'linear-gradient(135deg, var(--primary-alpha-05) 0%, var(--primary-alpha-10) 100%)',
      borderLeft: '5px solid var(--primary-alpha-60)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={20} />
          アプローチ実績・コンバージョン率
        </h3>
        <button
          className="btn btn-secondary btn-small"
          onClick={() => setShowApproachForm(!showApproachForm)}
        >
          + アプローチ記録追加
        </button>
      </div>

      {/* アプローチ記録追加フォーム */}
      {showApproachForm && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '15px' }}>新規アプローチ記録</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px' }}>日付</label>
              <input type="date" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px' }}>アプローチ手法</label>
              <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <option value="messenger">メッセンジャー</option>
                <option value="directmail">直メール</option>
                <option value="phone">電話</option>
                <option value="mailmagazine">メルマガ</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px' }}>アプローチ母数</label>
              <input type="number" placeholder="例：50" min="0" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px' }}>反応数</label>
              <input type="number" placeholder="例：10" min="0" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button className="btn btn-primary">保存</button>
            <button className="btn btn-secondary" onClick={() => setShowApproachForm(false)}>キャンセル</button>
          </div>
        </div>
      )}

      {/* アプローチ統計表示 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
        {Object.entries(channelStats).map(([channel, stats]) => {
          const rate = stats.total > 0 ? Math.round((stats.responded / stats.total) * 100) : 0;
          return (
            <div key={channel} style={{
              background: 'white',
              padding: '15px',
              borderRadius: '8px',
              borderLeft: '3px solid var(--primary-alpha-50)',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--primary-dark)' }}>
                {CHANNEL_LABELS[channel] || channel}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-medium)' }}>
                <span>母数: {stats.total}</span>
                <span>反応: {stats.responded}</span>
              </div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ background: 'var(--bg-gray)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--primary-alpha-60) 0%, var(--primary) 100%)',
                    width: `${rate}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                  {rate}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
