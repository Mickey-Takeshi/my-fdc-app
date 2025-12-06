/**
 * app/_components/todo/task-board-tab/TaskBoardTab.tsx
 *
 * Phase 10-D: 4象限タスク管理タブ（メインコンポーネント）
 *
 * 【機能】
 * - 4象限ボードでのタスク管理
 * - ドラッグ&ドロップによる象限変更
 * - タスク追加/編集/完了/削除
 * - 競合解決モーダル連携
 * - 時間有効活用ダッシュボード
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { TodoBoard } from '../TodoBoard';
import { TaskFormModal } from '../task-form-modal';
import { ElasticHabitsPanel } from '../elastic-habits-panel';
import { TimeAllocationBar } from '../TimeAllocationBar';
import { TodaySchedule, type EventToTaskData, type EventCategory, type ScheduleDateSelection } from '../TodaySchedule';
import { GoogleSyncButton } from '../GoogleSyncButton';
import { TaskHistoryReport } from '../task-history-report';
import { ConflictModal } from '../../common/ConflictModal';
import { useTaskViewModel } from '@/lib/hooks/useTaskViewModel';
import { CelebrationOverlay } from './CelebrationOverlay';
import { ViewModeTabBar } from './ViewModeTabBar';
import { DateSelector } from './DateSelector';
import { LoadingState } from './LoadingState';
import { SUIT_TO_EMOJI } from './constants';
import { formatDateWithWeekday, getActualDate } from './utils';
import type { ViewMode, HabitSelectionMode } from './types';

export function TaskBoardTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [habitSelectionMode, setHabitSelectionMode] = useState<HabitSelectionMode | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const prevAllCompletedRef = useRef<boolean | null>(null);

  const {
    loading, saving, error, editingTask, isFormOpen, formData, conflict,
    completeTask, moveTask, moveToJoker, deleteTask,
    openCreateForm, openEditForm, closeForm, updateFormData, submitForm,
    getDurationSuggestion, resolveConflict,
    umeHabits, toggleLinkedHabit, elasticHabits,
    createTaskFromHabit, updateElasticHabit, createElasticHabit, deleteElasticHabit,
    taskLogs, dailySummaries, monthlySummaries,
    selectedDate, setSelectedDate, filteredTasks,
    calendarJokerEvents, fetchCalendarJokerEvents, importCalendarEventAsTask, dismissCalendarEvent, calendarJokerLoading,
  } = useTaskViewModel();

  const todayLabel = useMemo(() => formatDateWithWeekday(getActualDate(selectedDate)), [selectedDate]);

  // 全タスク完了チェック
  const allTasksCompleted = useMemo(() => {
    if (filteredTasks.length === 0) return false;
    return filteredTasks.every(t => t.status === 'done');
  }, [filteredTasks]);

  // タスクが全部完了したらお祝いを表示
  useEffect(() => {
    if (prevAllCompletedRef.current === null) {
      prevAllCompletedRef.current = allTasksCompleted;
      return;
    }
    if (!prevAllCompletedRef.current && allTasksCompleted && filteredTasks.length > 0 && selectedDate === 'today') {
      queueMicrotask(() => setShowCelebration(true));
    }
    prevAllCompletedRef.current = allTasksCompleted;
  }, [allTasksCompleted, filteredTasks.length, selectedDate]);

  const handleCelebrationComplete = useCallback(() => setShowCelebration(false), []);

  // selectedDate が変わったときにカレンダー予定を再取得
  useEffect(() => { fetchCalendarJokerEvents(); }, [fetchCalendarJokerEvents, selectedDate]);

  const handleHabitSelected = useCallback(() => {
    setHabitSelectionMode(null);
    setViewMode('board');
  }, []);

  const handleCreateTaskFromEvent = useCallback(async (data: EventToTaskData) => {
    const categoryToSuit = (cat: EventCategory): 'spade' | 'heart' | 'diamond' | 'club' => {
      if (cat === 'joker' || cat === 'unclassified') return 'heart';
      return cat;
    };
    const suit = categoryToSuit(data.category);
    const emoji = SUIT_TO_EMOJI[suit];
    const hasEmojiPrefix = /^[\u2B1B\uFE0F\uD83D\uDFE5\uD83D\uDFE8\uD83D\uDFE6]/.test(data.title);

    if (!hasEmojiPrefix && data.calendarEventId && data.calendarId) {
      try {
        await fetch('/api/google/calendars/events', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ calendarId: data.calendarId, eventId: data.calendarEventId, summary: `${emoji}${data.title}` }),
        });
      } catch (error) {
        console.error('[TaskBoardTab] Failed to rename calendar event:', error);
      }
    }

    openCreateForm();
    const startDate = new Date(data.startTime);
    const startAt = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;

    setTimeout(() => {
      updateFormData('title', data.title);
      if (data.description) updateFormData('description', data.description);
      updateFormData('durationMinutes', data.estimatedMinutes);
      updateFormData('startAt', startAt);
      updateFormData('suit', suit);
    }, 0);
    setViewMode('board');
  }, [openCreateForm, updateFormData]);

  if (loading) return <LoadingState todayLabel={todayLabel} />;

  return (
    <div className="section">
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Calendar size={24} />
          {todayLabel}
          {saving && <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 'normal' }}>保存中...</span>}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ViewModeTabBar viewMode={viewMode} onViewModeChange={setViewMode} />
          <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <GoogleSyncButton tasks={filteredTasks} compact={false} />
          <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>{filteredTasks.length} タスク</span>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div style={{ padding: '12px 16px', background: '#ffebee', border: '1px solid #f44336', borderRadius: '8px', color: '#c62828', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* コンテンツエリア */}
      {viewMode === 'board' && (
        <>
          <div style={{ marginBottom: '20px' }}><TimeAllocationBar tasks={filteredTasks} /></div>
          <TodoBoard
            tasks={filteredTasks}
            onTaskClick={openEditForm}
            onTaskComplete={completeTask}
            onTaskDelete={deleteTask}
            onTaskMove={moveTask}
            onTaskMoveToJoker={moveToJoker}
            onAddTask={openCreateForm}
            onLinkedHabitComplete={toggleLinkedHabit}
            calendarJokerEvents={calendarJokerEvents}
            onImportCalendarEvent={importCalendarEventAsTask}
            onDismissCalendarEvent={dismissCalendarEvent}
            calendarJokerLoading={calendarJokerLoading}
          />
        </>
      )}

      {viewMode === 'habits' && (
        <ElasticHabitsPanel
          elasticHabits={elasticHabits}
          onCreateTask={(habit, level) => { createTaskFromHabit(habit, level); if (habitSelectionMode?.active) handleHabitSelected(); }}
          onUpdateHabit={updateElasticHabit} onCreateHabit={createElasticHabit} onDeleteHabit={deleteElasticHabit}
          selectionMode={habitSelectionMode} selectedDate={selectedDate}
        />
      )}

      {viewMode === 'schedule' && (
        <TodaySchedule compact={false} onCreateTaskFromEvent={handleCreateTaskFromEvent} externalSelectedDate={selectedDate as ScheduleDateSelection} />
      )}

      {viewMode === 'history' && (
        <TaskHistoryReport taskLogs={taskLogs} dailySummaries={dailySummaries} monthlySummaries={monthlySummaries} />
      )}

      {/* モーダル */}
      <TaskFormModal
        isOpen={isFormOpen} isEditing={!!editingTask} formData={formData} onClose={closeForm} onSubmit={submitForm}
        onUpdateField={updateFormData} getDurationSuggestion={getDurationSuggestion} umeHabits={umeHabits}
      />
      <ConflictModal
        isOpen={conflict.isOpen} serverVersion={conflict.serverVersion} clientVersion={conflict.clientVersion}
        onReload={() => resolveConflict('reload')} onForceOverwrite={() => resolveConflict('overwrite')} onCancel={() => resolveConflict('cancel')}
      />
      <CelebrationOverlay show={showCelebration} onComplete={handleCelebrationComplete} />
    </div>
  );
}

export default TaskBoardTab;
