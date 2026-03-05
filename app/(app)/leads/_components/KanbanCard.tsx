'use client';

/**
 * app/(app)/leads/_components/KanbanCard.tsx
 *
 * カンバンカード（Phase 6）
 * リードをカード形式で表示
 */

import { Building2, User, Mail, Phone } from 'lucide-react';
import type { Prospect } from '@/lib/types/prospect';

interface KanbanCardProps {
  prospect: Prospect;
  onSelect: (prospect: Prospect) => void;
}

export default function KanbanCard({ prospect, onSelect }: KanbanCardProps) {
  return (
    <div
      className="kanban-card"
      onClick={() => onSelect(prospect)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(prospect);
        }
      }}
    >
      <div className="kanban-card-header">
        <span className="kanban-card-company">
          <Building2 size={14} />
          {prospect.companyName}
        </span>
        {prospect.channel && (
          <span className="kanban-card-channel">{prospect.channel}</span>
        )}
      </div>

      <div className="kanban-card-contact">
        <User size={13} />
        {prospect.contactPerson}
      </div>

      {prospect.email && (
        <div className="kanban-card-info">
          <Mail size={12} />
          <span>{prospect.email}</span>
        </div>
      )}

      {prospect.phone && (
        <div className="kanban-card-info">
          <Phone size={12} />
          <span>{prospect.phone}</span>
        </div>
      )}

      {prospect.memo && (
        <div className="kanban-card-memo">
          {prospect.memo.length > 60
            ? `${prospect.memo.substring(0, 60)}...`
            : prospect.memo}
        </div>
      )}

      <div className="kanban-card-footer">
        <span className="kanban-card-date">
          {new Date(prospect.createdAt).toLocaleDateString('ja-JP')}
        </span>
      </div>
    </div>
  );
}
