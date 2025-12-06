/**
 * app/_components/dashboard/KPICards.tsx
 *
 * Phase 9.92-1: KPI統計カードコンポーネント
 * 旧UI（archive/phase9-legacy-root/index.html）のデザインを100%再現
 *
 * デザイン仕様（旧UIから完全コピー）:
 * - 4カードを横並び（グリッド: repeat(auto-fit, minmax(200px, 1fr))）
 * - 背景: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)
 * - テキスト色: white
 * - 影: var(--shadow-primary-md)
 * - 角丸: 12px
 * - カード内パディング: 25px
 * - ホバー: translateY(-4px) scale(1.02)
 * - 光るエフェクト: radial-gradient アニメーション
 */

'use client';

import { AnimatedNumber } from '@/app/_components/common/AnimatedNumber';

export interface KPICardsProps {
  stats: {
    totalProspects: number;
    activeDeals: number;
    wonDeals: number;
    conversionRate: string;
  } | null;
  loading?: boolean;
}

export function KPICards({ stats, loading = false }: KPICardsProps) {
  const cards = [
    {
      label: '総見込み客数',
      value: stats?.totalProspects ?? 0,
      testId: 'stat-total-prospects',
      isPercentage: false,
    },
    {
      label: '商談中',
      value: stats?.activeDeals ?? 0,
      testId: 'stat-active-deals',
      isPercentage: false,
    },
    {
      label: '成約数',
      value: stats?.wonDeals ?? 0,
      testId: 'stat-won-deals',
      isPercentage: false,
    },
    {
      label: '成約率',
      value: stats?.conversionRate ?? '0%',
      testId: 'stat-conversion-rate',
      isPercentage: true,
    },
  ];

  return (
    <section
      className="stats-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px',
      }}
      aria-label="主要KPI指標"
      role="region"
    >
      {cards.map((card, index) => (
        <article
          key={index}
          className="stat-card"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            color: 'white',
            padding: '25px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-primary-md)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          aria-label={`${card.label}: ${card.value}`}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
            e.currentTarget.style.boxShadow = 'var(--shadow-primary-lg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = 'var(--shadow-primary-md)';
          }}
        >
          {/* 光るエフェクト（radial-gradient アニメーション）*/}
          <div
            style={{
              content: '""',
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              animation: 'statGlow 8s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />

          {/* 数値 */}
          <div
            id={card.testId}
            data-testid={card.testId}
            className="stat-value"
            style={{
              fontSize: '36px',
              fontWeight: 600,
              marginBottom: '5px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {loading ? (
              <span
                style={{
                  display: 'inline-block',
                  width: '60px',
                  height: '36px',
                  background: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ) : (
              <AnimatedNumber
                value={card.value}
                suffix={card.isPercentage ? '%' : ''}
                decimals={card.isPercentage ? 1 : 0}
              />
            )}
          </div>

          {/* ラベル */}
          <div
            className="stat-label"
            style={{
              fontSize: '13px',
              opacity: 0.9,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {card.label}
          </div>
        </article>
      ))}

      {/* アニメーション定義 */}
      <style jsx>{`
        @keyframes statGlow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20%, -20%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </section>
  );
}
