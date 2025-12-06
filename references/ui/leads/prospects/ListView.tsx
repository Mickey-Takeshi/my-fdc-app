/**
 * app/_components/prospects/prospects/ListView.tsx
 *
 * Phase 14.11: memo化による最適化
 * - 個別行をmemo化して不要な再レンダリング防止
 */

'use client';

import { memo, useCallback } from 'react';
import { Building2, Mail, FileText } from 'lucide-react';
import type { Lead, LeadStatus } from '@/lib/hooks/useLeads';

const FUNNEL_STATUS_LABELS: Record<string, string> = {
  UNCONTACTED: '未接触',
  RESPONDED: '反応あり',
  NEGOTIATION: '商談中',
  WON: '成約',
  LOST: '失注',
};

interface ListViewProps {
  leads: Lead[];
  onStatusChange: (lead: Lead, newStatus: LeadStatus | 'DELETE') => void;
  onDeleteLead: (leadId: string) => Promise<void>;
}

// 個別の行コンポーネント（memo化で再レンダリング防止）
const LeadRow = memo(function LeadRow({
  lead,
  onStatusChange,
  onDeleteLead,
}: {
  lead: Lead;
  onStatusChange: (lead: Lead, newStatus: LeadStatus | 'DELETE') => void;
  onDeleteLead: (leadId: string) => Promise<void>;
}) {
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(lead, e.target.value as LeadStatus | 'DELETE');
  }, [lead, onStatusChange]);

  const handleDelete = useCallback(() => {
    onDeleteLead(lead.id);
  }, [lead.id, onDeleteLead]);

  return (
    <div className="card" style={{ marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '5px' }}>
            {FUNNEL_STATUS_LABELS[lead.status]} {lead.contactPerson}
          </div>
          {lead.companyName && (
            <div style={{ color: 'var(--text-light)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building2 size={14} /> {lead.companyName}
            </div>
          )}
          <div style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Mail size={14} /> {lead.email || lead.phone || '-'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={lead.status}
            onChange={handleStatusChange}
            style={{ padding: '5px 10px' }}
          >
            <option value="UNCONTACTED">{FUNNEL_STATUS_LABELS.UNCONTACTED}</option>
            <option value="RESPONDED">{FUNNEL_STATUS_LABELS.RESPONDED}</option>
            <option value="NEGOTIATION">{FUNNEL_STATUS_LABELS.NEGOTIATION}</option>
            <option value="WON">{FUNNEL_STATUS_LABELS.WON}</option>
            <option value="LOST">{FUNNEL_STATUS_LABELS.LOST}</option>
            <option value="DELETE">削除</option>
          </select>
          <button
            className="btn btn-secondary btn-small"
            onClick={handleDelete}
          >
            削除
          </button>
        </div>
      </div>
      {lead.memo && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: 'var(--bg-gray)',
          borderRadius: '8px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
        }}>
          <FileText size={14} style={{ flexShrink: 0, marginTop: '2px' }} /> {lead.memo}
        </div>
      )}
    </div>
  );
});

export const ListView = memo(function ListView({ leads, onStatusChange, onDeleteLead }: ListViewProps) {
  if (leads.length === 0) {
    return (
      <div className="card">
        <h3>見込み客リスト</h3>
        <p style={{ color: 'var(--text-light)' }}>見込み客はまだありません</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: '15px' }}>
        見込み客リスト
        {leads.length >= 50 && (
          <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-light)', marginLeft: '10px' }}>
            ({leads.length}件)
          </span>
        )}
      </h3>
      <div>
        {leads.map(lead => (
          <LeadRow
            key={lead.id}
            lead={lead}
            onStatusChange={onStatusChange}
            onDeleteLead={onDeleteLead}
          />
        ))}
      </div>
    </div>
  );
});
