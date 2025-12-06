/**
 * app/_components/dashboard/LostReasons.tsx
 *
 * Phase 9.92-1: 失注理由TOP3コンポーネント
 * 旧UI（archive/phase9-legacy-js/tabs/dashboard.ts 行263-320）を再現
 *
 * デザイン仕様:
 * - 各理由: 横並び（順位・理由名・プログレスバー・パーセント・件数）
 * - プログレスバー: 高さ 20px, 角丸 10px
 * - 1位: linear-gradient(90deg, #f44336, #ef5350)
 * - 2位: linear-gradient(90deg, #FF9800, #FFB74D)
 * - 3位: linear-gradient(90deg, #FFC107, #FFCA28)
 */

'use client';

export interface LostReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface LostReasonsProps {
  lostReasons: LostReason[];
  loading?: boolean;
}

// スケルトン用の順位別グラデーション色
const SKELETON_GRADIENTS = [
  'linear-gradient(90deg, #f4433640, #ef535040)', // 1位: 赤（薄め）
  'linear-gradient(90deg, #FF980040, #FFB74D40)', // 2位: オレンジ（薄め）
  'linear-gradient(90deg, #FFC10740, #FFCA2840)', // 3位: 黄色（薄め）
];

export function LostReasons({ lostReasons, loading = false }: LostReasonsProps) {
  // ローディング時はスケルトンを表示
  if (loading) {
    return (
      <div
        className="card"
        style={{
          background: 'var(--glass)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid var(--border-light)',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ display: 'grid', gap: '15px' }}>
          {[0, 1, 2].map((index) => (
            <div key={index}>
              {/* 理由名とパーセント・件数スケルトン */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '5px',
                }}
              >
                <div
                  style={{
                    width: `${100 + index * 20}px`,
                    height: '16px',
                    background: 'var(--bg-gray)',
                    borderRadius: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    width: '80px',
                    height: '14px',
                    background: 'var(--bg-gray)',
                    borderRadius: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              </div>

              {/* プログレスバースケルトン */}
              <div
                style={{
                  background: 'var(--bg-gray)',
                  height: '15px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: SKELETON_GRADIENTS[index],
                    width: `${70 - index * 15}%`,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
        `}</style>
      </div>
    );
  }

  if (lostReasons.length === 0) {
    return (
      <div className="card">
        <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>
          失注データがありません
        </p>
      </div>
    );
  }

  // TOP3のみ表示
  const top3 = lostReasons.slice(0, 3);

  // 順位別のグラデーション色
  const gradients = [
    'linear-gradient(90deg, #f44336, #ef5350)', // 1位: 赤
    'linear-gradient(90deg, #FF9800, #FFB74D)', // 2位: オレンジ
    'linear-gradient(90deg, #FFC107, #FFCA28)', // 3位: 黄色
  ];

  return (
    <div
      className="card"
      style={{
        background: 'var(--glass)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid var(--border-light)',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div style={{ display: 'grid', gap: '15px' }}>
        {top3.map((item, index) => (
          <div key={index}>
            {/* 理由名とパーセント・件数 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '5px',
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: 'var(--text-dark)',
                  fontSize: '14px',
                }}
              >
                {index + 1}. {item.reason}
              </span>
              <span
                style={{
                  color: 'var(--text-light)',
                  fontSize: '13px',
                }}
              >
                {item.count}件 ({Math.round(item.percentage)}%)
              </span>
            </div>

            {/* プログレスバー */}
            <div
              style={{
                background: 'var(--bg-gray)',
                height: '15px',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: gradients[index],
                  width: `${item.percentage}%`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
