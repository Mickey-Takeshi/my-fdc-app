/**
 * app/_components/todo/task-form-modal/DurationSelector.tsx
 *
 * 所要時間選択コンポーネント
 */

'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import type { DurationSuggestion } from './types';
import { DURATION_OPTIONS } from './types';

interface DurationSelectorProps {
  durationMinutes?: number;
  suggestion: DurationSuggestion | null;
  onSelectDuration: (minutes: number | undefined) => void;
  onApplySuggestion: () => void;
}

export function DurationSelector({
  durationMinutes,
  suggestion,
  onSelectDuration,
  onApplySuggestion,
}: DurationSelectorProps) {
  return (
    <div>
      <label
        htmlFor="task-duration"
        style={{
          display: 'block',
          marginBottom: '6px',
          fontWeight: 500,
          fontSize: '14px',
        }}
      >
        所要時間
      </label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select
          id="task-duration"
          value={durationMinutes || ''}
          onChange={(e) =>
            onSelectDuration(
              e.target.value ? parseInt(e.target.value, 10) : undefined
            )
          }
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        >
          <option value="">未設定</option>
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* 推奨時間サジェスト */}
        {suggestion && (
          <button
            type="button"
            onClick={onApplySuggestion}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              background:
                suggestion.confidence === 'high'
                  ? '#e8f5e9'
                  : suggestion.confidence === 'medium'
                  ? '#fff3e0'
                  : '#f5f5f5',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              color:
                suggestion.confidence === 'high'
                  ? '#2e7d32'
                  : suggestion.confidence === 'medium'
                  ? '#f57c00'
                  : '#757575',
            }}
            title={suggestion.reason}
          >
            <Sparkles size={14} color={
              suggestion.confidence === 'high'
                ? '#2e7d32'
                : suggestion.confidence === 'medium'
                ? '#f57c00'
                : '#757575'
            } />
            推奨: {suggestion.suggestedMinutes}分
          </button>
        )}
      </div>
    </div>
  );
}
