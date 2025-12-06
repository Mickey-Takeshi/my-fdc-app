/**
 * app/_components/dashboard/OKRSummary.tsx
 *
 * Phase 12: OKR進捗サマリーコンポーネント（新OKRシステム対応版）
 *
 * 新OKRシステム（Phase 12）の Objective と KeyResult を表示
 * - 最初のアクティブな Objective とその KR を表示
 * - 複数 Objective がある場合は最初の非アーカイブを選択
 */

'use client';

import { Target, Check, Triangle } from 'lucide-react';
import type { Objective, KeyResult } from '@/lib/types/okr';

// 新OKRシステム用のProps
export interface OKRSummaryPropsNew {
  objectives: Objective[];
  keyResults: KeyResult[];
}

// 旧OKRシステム用のProps（後方互換性）
export interface OKRData {
  objective: string;
  keyResults: Array<{
    name: string;
    target: number;
    current: number;
  }>;
}

export interface OKRSummaryProps {
  okr?: OKRData | null;
  objectives?: Objective[];
  keyResults?: KeyResult[];
  loading?: boolean;
}

// スケルトンKR数
const SKELETON_KR_COUNT = 3;

export function OKRSummary({ okr, objectives, keyResults, loading = false }: OKRSummaryProps) {
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
          borderRadius: '12px',
          padding: '25px',
          boxShadow: 'var(--shadow)',
        }}
      >
        {/* Objective スケルトン */}
        <div style={{ marginBottom: '15px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            <Target size={18} style={{ color: 'var(--primary)' }} />
            <div style={{
              width: '200px',
              height: '20px',
              background: 'var(--bg-gray)',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          </div>

          {/* 全体進捗バー スケルトン */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div
              style={{
                flex: 1,
                background: 'var(--bg-gray)',
                height: '25px',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary-light), var(--primary))',
                width: '40%',
                opacity: 0.3,
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            </div>
            <div style={{
              width: '50px',
              height: '20px',
              background: 'var(--bg-gray)',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          </div>
        </div>

        {/* Key Results スケルトン */}
        <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
          {Array.from({ length: SKELETON_KR_COUNT }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  width: `${150 + i * 30}px`,
                  height: '16px',
                  background: 'var(--bg-gray)',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                <div
                  style={{
                    background: 'var(--bg-gray)',
                    height: '8px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--primary-light), var(--primary))',
                    width: `${30 + i * 20}%`,
                    opacity: 0.3,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                </div>
              </div>
              <div style={{
                width: '80px',
                height: '16px',
                background: 'var(--bg-gray)',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
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
  // 新OKRシステムのデータがある場合はそちらを使用
  if (objectives && objectives.length > 0 && keyResults) {
    return <NewOKRSummary objectives={objectives} keyResults={keyResults} />;
  }

  // 旧OKRシステム（後方互換性）
  if (!okr || !okr.objective) {
    return (
      <div className="card">
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>
          OKR データが設定されていません
        </p>
      </div>
    );
  }

  // 平均進捗を計算
  const avgProgress = okr.keyResults.length > 0
    ? okr.keyResults.reduce((sum, kr) => {
        const progress = kr.target > 0 ? Math.min((kr.current / kr.target) * 100, 100) : 0;
        return sum + progress;
      }, 0) / okr.keyResults.length
    : 0;

  return (
    <div
      className="card"
      style={{
        background: 'var(--glass)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: '25px',
        boxShadow: 'var(--shadow)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Objective */}
      <div style={{ marginBottom: '15px' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: '16px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-dark)',
          }}
        >
          <Target size={18} style={{ color: 'var(--primary)' }} />
          {okr.objective}
        </div>

        {/* 全体進捗バー */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              background: 'var(--bg-gray)',
              height: '25px',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                width: `${avgProgress}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span
            style={{
              fontWeight: 600,
              color: 'var(--primary)',
              fontSize: '16px',
              minWidth: '50px',
              textAlign: 'right',
            }}
          >
            {Math.round(avgProgress)}%
          </span>
        </div>
      </div>

      {/* Key Results */}
      <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
        {okr.keyResults.map((kr, i) => {
          if (!kr.name) return null;

          const progress = kr.target > 0 ? Math.min((kr.current / kr.target) * 100, 100) : 0;
          const isComplete = progress >= 100;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              {/* KR名と進捗バー */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '4px',
                    color: 'var(--text-medium)',
                  }}
                >
                  <span style={{ fontSize: '16px', display: 'inline-flex', alignItems: 'center' }}>
                    {isComplete ? <Check size={16} color="var(--primary-dark)" /> : <Triangle size={14} color="#FF9800" />}
                  </span>
                  <span>KR{i + 1}: {kr.name}</span>
                </div>
                <div
                  style={{
                    background: 'var(--bg-gray)',
                    height: '8px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: isComplete
                        ? 'linear-gradient(90deg, var(--primary-dark), var(--primary))'
                        : 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                      width: `${progress}%`,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* 進捗数値 */}
              <span
                style={{
                  color: 'var(--text-light)',
                  fontSize: '13px',
                  minWidth: '80px',
                  textAlign: 'right',
                }}
              >
                {kr.current}/{kr.target} ({Math.round(progress)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========================================
// 新OKRシステム用サマリーコンポーネント
// ========================================

function NewOKRSummary({ objectives, keyResults }: OKRSummaryPropsNew) {
  // 最初のアクティブな（非アーカイブ）Objective を取得
  const activeObjective = objectives.find(o => !o.isArchived);

  if (!activeObjective) {
    return (
      <div className="card">
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>
          OKR データが設定されていません
        </p>
      </div>
    );
  }

  // この Objective に紐づく KeyResult を取得
  const objectiveKRs = keyResults.filter(kr => kr.objectiveId === activeObjective.id);

  // 進捗率を計算（Objectiveに直接progressRateがある場合はそれを使用）
  const avgProgress = activeObjective.progressRate ?? (objectiveKRs.length > 0
    ? objectiveKRs.reduce((sum, kr) => sum + (kr.progressRate ?? 0), 0) / objectiveKRs.length
    : 0);

  return (
    <div
      className="card"
      style={{
        background: 'var(--glass)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: '25px',
        boxShadow: 'var(--shadow)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Objective */}
      <div style={{ marginBottom: '15px' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: '16px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-dark)',
          }}
        >
          <Target size={18} style={{ color: 'var(--primary)' }} />
          {activeObjective.title}
        </div>

        {/* 全体進捗バー */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              background: 'var(--bg-gray)',
              height: '25px',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                width: `${avgProgress}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span
            style={{
              fontWeight: 600,
              color: 'var(--primary)',
              fontSize: '16px',
              minWidth: '50px',
              textAlign: 'right',
            }}
          >
            {Math.round(avgProgress)}%
          </span>
        </div>
      </div>

      {/* Key Results */}
      {objectiveKRs.length > 0 ? (
        <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
          {objectiveKRs.map((kr, i) => {
            const progress = kr.progressRate ?? 0;
            const isComplete = progress >= 100 || kr.isAchieved;

            return (
              <div
                key={kr.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                {/* KR名と進捗バー */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '4px',
                      color: 'var(--text-medium)',
                    }}
                  >
                    <span style={{ fontSize: '16px', display: 'inline-flex', alignItems: 'center' }}>
                      {isComplete ? <Check size={16} color="var(--primary-dark)" /> : <Triangle size={14} color="#FF9800" />}
                    </span>
                    <span>KR{i + 1}: {kr.title}</span>
                  </div>
                  <div
                    style={{
                      background: 'var(--bg-gray)',
                      height: '8px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        background: isComplete
                          ? 'linear-gradient(90deg, var(--primary-dark), var(--primary))'
                          : 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                        width: `${progress}%`,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {/* 進捗数値 */}
                <span
                  style={{
                    color: 'var(--text-light)',
                    fontSize: '13px',
                    minWidth: '80px',
                    textAlign: 'right',
                  }}
                >
                  {kr.isQualitative
                    ? (isComplete ? '達成' : '未達成')
                    : `${kr.currentValue ?? 0}/${kr.targetValue ?? 0} (${Math.round(progress)}%)`
                  }
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>
          Key Result が設定されていません
        </p>
      )}
    </div>
  );
}
