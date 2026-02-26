/**
 * app/_components/leads/ListView.tsx
 *
 * Phase 6: リスト表示コンポーネント
 * Phase 8: アプローチ機能追加
 */

'use client';

import { memo, useCallback, useState } from 'react';
import { Building2, Mail, FileText, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import type { Lead, LeadStatus } from '@/lib/types/lead';
import { LEAD_STATUS_LABELS } from '@/lib/types/lead';
import type { Approach, CreateApproachInput } from '@/lib/types/approach';
import { ApproachTimeline } from '@/app/_components/approaches/ApproachTimeline';
import { AddApproachForm } from '@/app/_components/approaches/AddApproachForm';

interface ListViewProps {
  leads: Lead[];
  onStatusChange: (lead: Lead, newStatus: LeadStatus | 'DELETE') => void;
  onDeleteLead: (leadId: string) => Promise<void>;
  // Phase 8: アプローチ機能
  approaches?: Approach[];
  onAddApproach?: (input: CreateApproachInput) => Promise<Approach | null>;
  onDeleteApproach?: (id: string) => Promise<void>;
}

// 個別の行コンポーネント（memo化で再レンダリング防止）
const LeadRow = memo(function LeadRow({
  lead,
  onStatusChange,
  onDeleteLead,
  approaches,
  onAddApproach,
  onDeleteApproach,
}: {
  lead: Lead;
  onStatusChange: (lead: Lead, newStatus: LeadStatus | 'DELETE') => void;
  onDeleteLead: (leadId: string) => Promise<void>;
  approaches?: Approach[];
  onAddApproach?: (input: CreateApproachInput) => Promise<Approach | null>;
  onDeleteApproach?: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showApproachForm, setShowApproachForm] = useState(false);

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onStatusChange(lead, e.target.value as LeadStatus | 'DELETE');
    },
    [lead, onStatusChange]
  );

  const handleDelete = useCallback(() => {
    onDeleteLead(lead.id);
  }, [lead.id, onDeleteLead]);

  // このリードのアプローチを取得
  const leadApproaches = approaches?.filter((a) => a.leadId === lead.id) || [];

  return (
    <div className="card" style={{ marginBottom: '15px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '10px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{ fontWeight: 600, fontSize: '16px', marginBottom: '5px' }}
          >
            {LEAD_STATUS_LABELS[lead.status]} {lead.contactPerson}
          </div>
          {lead.companyName && (
            <div
              style={{
                color: 'var(--text-light)',
                marginBottom: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Building2 size={14} /> {lead.companyName}
            </div>
          )}
          <div
            style={{
              color: 'var(--text-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Mail size={14} /> {lead.email || lead.phone || '-'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* アプローチ件数バッジ */}
          {leadApproaches.length > 0 && (
            <span
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: '#E3F2FD',
                color: '#1976D2',
              }}
            >
              {leadApproaches.length}件
            </span>
          )}
          <select
            value={lead.status}
            onChange={handleStatusChange}
            style={{ padding: '5px 10px' }}
          >
            <option value="UNCONTACTED">
              {LEAD_STATUS_LABELS.UNCONTACTED}
            </option>
            <option value="RESPONDED">{LEAD_STATUS_LABELS.RESPONDED}</option>
            <option value="NEGOTIATION">
              {LEAD_STATUS_LABELS.NEGOTIATION}
            </option>
            <option value="WON">{LEAD_STATUS_LABELS.WON}</option>
            <option value="LOST">{LEAD_STATUS_LABELS.LOST}</option>
            <option value="DELETE">削除</option>
          </select>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => setExpanded(!expanded)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {lead.memo && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            background: 'var(--bg-gray)',
            borderRadius: '8px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
          }}
        >
          <FileText size={14} style={{ flexShrink: 0, marginTop: '2px' }} />{' '}
          {lead.memo}
        </div>
      )}

      {/* 展開セクション: アプローチ履歴 */}
      {expanded && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '14px' }}>
              アプローチ履歴 ({leadApproaches.length})
            </h4>
            {onAddApproach && (
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setShowApproachForm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> 記録
              </button>
            )}
          </div>

          {showApproachForm && onAddApproach && (
            <AddApproachForm
              leadId={lead.id}
              onAdd={async (input) => {
                await onAddApproach(input);
              }}
              onClose={() => setShowApproachForm(false)}
            />
          )}

          <ApproachTimeline
            approaches={leadApproaches}
            onDelete={onDeleteApproach}
          />

          <div style={{ marginTop: '12px' }}>
            <button
              className="btn btn-secondary btn-small"
              onClick={handleDelete}
              style={{ color: '#C62828' }}
            >
              リードを削除
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export const ListView = memo(function ListView({
  leads,
  onStatusChange,
  onDeleteLead,
  approaches,
  onAddApproach,
  onDeleteApproach,
}: ListViewProps) {
  if (leads.length === 0) {
    return (
      <div className="card">
        <h3>リードリスト</h3>
        <p style={{ color: 'var(--text-light)' }}>リードはまだありません</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: '15px' }}>
        リードリスト
        {leads.length >= 50 && (
          <span
            style={{
              fontSize: '14px',
              fontWeight: 'normal',
              color: 'var(--text-light)',
              marginLeft: '10px',
            }}
          >
            ({leads.length}件)
          </span>
        )}
      </h3>
      <div>
        {leads.map((lead) => (
          <LeadRow
            key={lead.id}
            lead={lead}
            onStatusChange={onStatusChange}
            onDeleteLead={onDeleteLead}
            approaches={approaches}
            onAddApproach={onAddApproach}
            onDeleteApproach={onDeleteApproach}
          />
        ))}
      </div>
    </div>
  );
});
