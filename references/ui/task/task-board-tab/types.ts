/**
 * app/_components/todo/task-board-tab/types.ts
 *
 * TaskBoardTab の型定義
 */

export type ViewMode = 'board' | 'habits' | 'schedule' | 'history';

export interface HabitSelectionMode {
  active: boolean;
  suit: 'heart' | 'club';
  level: 'ume' | 'take' | 'matsu';
}

export interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

export interface CelebrationOverlayProps {
  show: boolean;
  onComplete: () => void;
}
