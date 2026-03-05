'use client';

/**
 * app/(app)/leads/_components/KanbanView.tsx
 *
 * カンバン表示（Phase 6）
 * ステータス別のカラム表示 + ステータス変更
 */

import { KANBAN_STATUSES, PROSPECT_STATUS_LABELS, type Prospect, type ProspectStatus } from '@/lib/types/prospect';
import KanbanCard from './KanbanCard';

interface KanbanViewProps {
  prospects: Prospect[];
  onSelect: (prospect: Prospect) => void;
  onStatusChange: (prospectId: string, newStatus: ProspectStatus) => void;
}

export default function KanbanView({ prospects, onSelect, onStatusChange }: KanbanViewProps) {
  return (
    <div className="kanban-board">
      {KANBAN_STATUSES.map((status) => {
        const columnProspects = prospects.filter((p) => p.status === status);

        return (
          <div
            key={status}
            className="kanban-column"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('kanban-column-dragover');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('kanban-column-dragover');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('kanban-column-dragover');
              const prospectId = e.dataTransfer.getData('text/plain');
              if (prospectId) {
                onStatusChange(prospectId, status);
              }
            }}
          >
            <div className="kanban-column-header">
              <span className={`kanban-status-dot status-${status}`} />
              <span className="kanban-column-title">
                {PROSPECT_STATUS_LABELS[status]}
              </span>
              <span className="kanban-column-count">{columnProspects.length}</span>
            </div>

            <div className="kanban-column-body">
              {columnProspects.map((prospect) => (
                <div
                  key={prospect.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', prospect.id);
                    e.currentTarget.classList.add('kanban-card-dragging');
                  }}
                  onDragEnd={(e) => {
                    e.currentTarget.classList.remove('kanban-card-dragging');
                  }}
                >
                  <KanbanCard prospect={prospect} onSelect={onSelect} />
                </div>
              ))}
              {columnProspects.length === 0 && (
                <div className="kanban-empty">
                  リードなし
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
