/**
 * app/_components/dashboard/ApproachesManagement.tsx
 *
 * Phase 9.92-1: アプローチ管理コンポーネント
 * 旧UI（archive/phase9-legacy-js/tabs/dashboard.ts 行368-446）を再現
 *
 * デザイン仕様:
 * - リアル/HP/メルマガ/メッセンジャー/X/電話・SMS/WEBアプリ の7チャネル表示
 * - 各チャネルのステータス別小計を自動集計
 * - ⚪未接触/🔵反応あり/🟡商談中/🟠成約/🟤失注の件数を表示
 * - チャネル名: var(--text-dark), font-weight: 600
 */

'use client';

import {
  Users,
  Globe,
  Mail,
  MessageCircle,
  Twitter,
  Phone,
  Smartphone,
  Circle,
  BarChart3,
} from 'lucide-react';

export interface ChannelStats {
  channel: string;
  uncontacted: number;
  responded: number;
  negotiating: number;
  won: number;
  lost: number;
  total: number;
}

export interface ApproachesManagementProps {
  channelStats: ChannelStats[];
  loading?: boolean;
}

// スケルトンチャネル（モジュールレベル）
const SKELETON_CHANNELS = [
  { name: 'リアル', Icon: Users },
  { name: 'HP', Icon: Globe },
  { name: 'メルマガ', Icon: Mail },
  { name: 'メッセンジャー', Icon: MessageCircle },
  { name: 'X', Icon: Twitter },
  { name: '電話・SMS', Icon: Phone },
  { name: 'WEBアプリ', Icon: Smartphone },
];

// ステータス定義
const STATUS_CONFIGS = [
  { label: '未接触', color: '#CCCCCC' },
  { label: '反応あり', color: '#2196F3' },
  { label: '商談中', color: '#FFD700' },
  { label: '成約', color: '#FF9800' },
  { label: '失注', color: '#D2691E' },
  { label: '合計', color: 'var(--primary)', isTotal: true },
];

export function ApproachesManagement({ channelStats, loading = false }: ApproachesManagementProps) {
  const channelIcons: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
    'リアル': Users,
    'HP': Globe,
    'メルマガ': Mail,
    'メッセンジャー': MessageCircle,
    'X': Twitter,
    '電話・SMS': Phone,
    'WEBアプリ': Smartphone,
  };

  // ローディング時はスケルトンを表示
  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '15px' }}>
        {SKELETON_CHANNELS.map(({ name, Icon }) => (
          <div
            key={name}
            style={{
              padding: '20px',
              background: 'var(--bg-gray)',
              borderRadius: '8px',
            }}
          >
            {/* チャネル名 */}
            <div
              style={{
                fontWeight: 600,
                color: 'var(--primary)',
                marginBottom: '15px',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Icon size={18} />
              {name}
            </div>

            {/* ステータス別スケルトン */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '10px',
              }}
            >
              {STATUS_CONFIGS.map((status) => (
                <div
                  key={status.label}
                  style={{
                    padding: '10px',
                    background: status.isTotal
                      ? 'linear-gradient(135deg, var(--primary-alpha-10), var(--primary-alpha-20))'
                      : 'white',
                    borderRadius: '6px',
                    textAlign: 'center',
                    borderLeft: `3px solid ${status.color}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-light)',
                      marginBottom: '5px',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {status.isTotal ? (
                        <BarChart3 size={12} />
                      ) : (
                        <Circle size={12} fill={status.color} stroke={status.color} />
                      )}
                      {status.label}
                    </span>
                  </div>
                  <div
                    style={{
                      width: '40px',
                      height: '22px',
                      background: 'var(--bg-gray)',
                      borderRadius: '4px',
                      margin: '0 auto',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '15px' }}>
      {channelStats.map((stats) => {
        const Icon = channelIcons[stats.channel];

        return (
          <div
            key={stats.channel}
            style={{
              padding: '20px',
              background: 'var(--bg-gray)',
              borderRadius: '8px',
            }}
          >
            {/* チャネル名 */}
            <div
              style={{
                fontWeight: 600,
                color: 'var(--primary)',
                marginBottom: '15px',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {Icon && <Icon size={18} />}
              {stats.channel}
            </div>

            {/* ステータス別件数グリッド */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '10px',
              }}
            >
              {/* 未接触 */}
              <div
                style={{
                  padding: '10px',
                  background: 'white',
                  borderRadius: '6px',
                  textAlign: 'center',
                  borderLeft: '3px solid #CCCCCC',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '70px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-light)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Circle size={12} fill="#CCCCCC" stroke="#CCCCCC" />未接触</span>
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '18px',
                    color: 'var(--primary)',
                    marginTop: 'auto',
                  }}
                >
                  {stats.uncontacted}
                </div>
              </div>

              {/* 反応あり */}
              <div
                style={{
                  padding: '10px',
                  background: 'white',
                  borderRadius: '6px',
                  textAlign: 'center',
                  borderLeft: '3px solid #2196F3',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '70px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-light)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Circle size={12} fill="#2196F3" stroke="#2196F3" />反応あり</span>
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '18px',
                    color: 'var(--primary)',
                    marginTop: 'auto',
                  }}
                >
                  {stats.responded}
                </div>
              </div>

              {/* 商談中 */}
              <div
                style={{
                  padding: '10px',
                  background: 'white',
                  borderRadius: '6px',
                  textAlign: 'center',
                  borderLeft: '3px solid #FFD700',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '70px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-light)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Circle size={12} fill="#FFD700" stroke="#FFD700" />商談中</span>
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '18px',
                    color: 'var(--primary)',
                    marginTop: 'auto',
                  }}
                >
                  {stats.negotiating}
                </div>
              </div>

              {/* 成約 */}
              <div
                style={{
                  padding: '10px',
                  background: 'white',
                  borderRadius: '6px',
                  textAlign: 'center',
                  borderLeft: '3px solid #FF9800',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '70px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-light)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Circle size={12} fill="#FF9800" stroke="#FF9800" />成約</span>
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '18px',
                    color: 'var(--primary)',
                    marginTop: 'auto',
                  }}
                >
                  {stats.won}
                </div>
              </div>

              {/* 失注 */}
              <div
                style={{
                  padding: '10px',
                  background: 'white',
                  borderRadius: '6px',
                  textAlign: 'center',
                  borderLeft: '3px solid #D2691E',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '70px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-light)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Circle size={12} fill="#D2691E" stroke="#D2691E" />失注</span>
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '18px',
                    color: 'var(--primary)',
                    marginTop: 'auto',
                  }}
                >
                  {stats.lost}
                </div>
              </div>

              {/* 合計 */}
              <div
                style={{
                  padding: '10px',
                  background: 'linear-gradient(135deg, var(--primary-alpha-10), var(--primary-alpha-20))',
                  borderRadius: '6px',
                  textAlign: 'center',
                  borderLeft: '3px solid var(--primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '70px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-light)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><BarChart3 size={12} />合計</span>
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '18px',
                    color: 'var(--primary)',
                    marginTop: 'auto',
                  }}
                >
                  {stats.total}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
