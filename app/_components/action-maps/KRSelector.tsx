/**
 * app/_components/action-maps/KRSelector.tsx
 *
 * ActionMapに紐付けるKey Resultを選択するコンポーネント
 */

'use client';

import { useState, useEffect } from 'react';
import { Target, X, Link } from 'lucide-react';

interface KeyResultOption {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  progress: number;
  objective: {
    id: string;
    title: string;
    period: string;
  };
}

interface KRSelectorProps {
  workspaceId: string;
  currentKRId?: string;
  onSelect: (krId: string | null) => void;
}

export function KRSelector({ workspaceId, currentKRId, onSelect }: KRSelectorProps) {
  const [keyResults, setKeyResults] = useState<KeyResultOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const currentKR = keyResults.find((kr) => kr.id === currentKRId);

  useEffect(() => {
    const fetchKeyResults = async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/okr/key-results`);
        if (res.ok) {
          const data = await res.json();
          setKeyResults(data);
        }
      } catch (error) {
        console.error('Failed to fetch key results:', error);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchKeyResults();
    }
  }, [workspaceId]);

  if (loading) {
    return (
      <div style={{ padding: '8px', color: 'var(--text-light)', fontSize: '14px' }}>
        読み込み中...
      </div>
    );
  }

  // KRがない場合
  if (keyResults.length === 0) {
    return (
      <div
        style={{
          padding: '12px',
          backgroundColor: 'var(--bg-muted)',
          borderRadius: '8px',
          fontSize: '14px',
          color: 'var(--text-light)',
        }}
      >
        <Target size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        OKRが未設定です。先にOKRページでKey Resultを作成してください。
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* 現在の選択状態 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          backgroundColor: currentKR ? 'var(--primary-light, #eff6ff)' : 'var(--bg-muted)',
          borderRadius: '8px',
          border: `1px solid ${currentKR ? 'var(--primary)' : 'var(--border)'}`,
        }}
      >
        <Target size={18} color={currentKR ? 'var(--primary)' : 'var(--text-light)'} />

        <div style={{ flex: 1 }}>
          {currentKR ? (
            <>
              <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                {currentKR.objective.title} ({currentKR.objective.period})
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>
                {currentKR.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '2px' }}>
                進捗: {currentKR.progress}% ({currentKR.currentValue}/{currentKR.targetValue} {currentKR.unit})
              </div>
            </>
          ) : (
            <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>
              Key Resultと紐付けていません
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {currentKR && (
            <button
              onClick={() => onSelect(null)}
              style={{
                padding: '6px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: 'var(--danger)',
              }}
              title="紐付け解除"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Link size={14} />
            {currentKR ? '変更' : '紐付け'}
          </button>
        </div>
      </div>

      {/* ドロップダウン */}
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99,
            }}
          />

          {/* 選択リスト */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: 'white',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 100,
            }}
          >
            {/* Objectiveでグループ化 */}
            {Array.from(new Set(keyResults.map((kr) => kr.objective.id))).map((objId) => {
              const objective = keyResults.find((kr) => kr.objective.id === objId)?.objective;
              const krsForObj = keyResults.filter((kr) => kr.objective.id === objId);

              return (
                <div key={objId}>
                  {/* Objectiveヘッダー */}
                  <div
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-muted)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-light)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {objective?.title} ({objective?.period})
                  </div>

                  {/* KRリスト */}
                  {krsForObj.map((kr) => (
                    <button
                      key={kr.id}
                      onClick={() => {
                        onSelect(kr.id);
                        setIsOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: kr.id === currentKRId ? 'var(--primary-light, #eff6ff)' : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      {/* 進捗サークル */}
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: `conic-gradient(${kr.progress >= 100 ? 'var(--success)' : 'var(--primary)'} ${kr.progress * 3.6}deg, var(--bg-muted) 0deg)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}
                        >
                          {kr.progress}%
                        </div>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>
                          {kr.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                          {kr.currentValue}/{kr.targetValue} {kr.unit}
                        </div>
                      </div>

                      {kr.id === currentKRId && (
                        <span
                          style={{
                            padding: '2px 8px',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '11px',
                          }}
                        >
                          選択中
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
