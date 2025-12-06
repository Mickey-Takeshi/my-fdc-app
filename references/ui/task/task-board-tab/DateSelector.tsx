/**
 * app/_components/todo/task-board-tab/DateSelector.tsx
 *
 * 日付選択コンポーネント（昨日・今日・明日）
 */

import React from 'react';
import type { DateSelection } from '@/lib/hooks/useTaskViewModel';
import { DATE_LABELS } from './constants';

interface DateSelectorProps {
  selectedDate: DateSelection;
  onDateChange: (date: DateSelection) => void;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const dates: DateSelection[] = ['yesterday', 'today', 'tomorrow'];

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {dates.map((date) => (
        <button
          key={date}
          onClick={() => onDateChange(date)}
          style={{
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: selectedDate === date ? 600 : 400,
            background: selectedDate === date ? 'var(--primary)' : 'white',
            color: selectedDate === date ? 'white' : 'var(--text-dark)',
            border: selectedDate === date ? 'none' : '1px solid var(--border)',
            borderRadius: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {DATE_LABELS[date]}
        </button>
      ))}
    </div>
  );
}
