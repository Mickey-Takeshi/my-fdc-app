/**
 * app/_components/todo/task-form-modal/ElasticHabitSelector.tsx
 *
 * 習慣化タスク（松竹梅）選択コンポーネント
 */

'use client';

import React from 'react';
import type { ElasticLevel } from '@/lib/types/todo';
import { ELASTIC_CONFIG } from '@/lib/types/todo';

interface ElasticHabitSelectorProps {
  isElasticHabit: boolean;
  elasticLevel?: ElasticLevel;
  onToggleElastic: (enabled: boolean) => void;
  onSelectLevel: (level: ElasticLevel) => void;
  onSetDuration: (minutes: number) => void;
}

export function ElasticHabitSelector({
  isElasticHabit,
  elasticLevel,
  onToggleElastic,
  onSelectLevel,
  onSetDuration,
}: ElasticHabitSelectorProps) {
  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--bg-gray)',
        borderRadius: '12px',
      }}
    >
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          marginBottom: isElasticHabit ? '12px' : 0,
        }}
      >
        <input
          type="checkbox"
          checked={isElasticHabit}
          onChange={(e) => {
            onToggleElastic(e.target.checked);
            if (e.target.checked && !elasticLevel) {
              onSelectLevel('take');
            }
          }}
          style={{ width: '18px', height: '18px' }}
        />
        <span style={{ fontWeight: 500 }}>習慣化タスク（松竹梅）</span>
      </label>

      {isElasticHabit && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          {(Object.keys(ELASTIC_CONFIG) as ElasticLevel[]).map((level) => {
            const config = ELASTIC_CONFIG[level];
            const isSelected = elasticLevel === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => {
                  onSelectLevel(level);
                  // レベルに応じたデフォルト時間を設定
                  onSetDuration(config.defaultMinutes);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: isSelected
                    ? '2px solid var(--primary)'
                    : '1px solid var(--border)',
                  borderRadius: '8px',
                  background: isSelected ? 'var(--primary-light)' : 'white',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '14px' }}>
                  {config.ja}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                  {config.defaultMinutes}分
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
