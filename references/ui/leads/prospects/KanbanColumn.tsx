'use client';

import { Circle, Building2, Mail } from 'lucide-react';
import type { Lead, LeadStatus } from '@/lib/hooks/useLeads';

const FUNNEL_STATUS_LABELS: Record<string, string> = {
  UNCONTACTED: '未接触',
  RESPONDED: '反応あり',
  NEGOTIATION: '商談中',
  WON: '成約',
  LOST: '失注',
};

interface KanbanColumnProps {
  label: string;
  color: string;
  iconColor: string;
  leads: Lead[];
  onStatusChange: (lead: Lead, newStatus: LeadStatus | 'DELETE') => void;
}

export function KanbanColumn({
  label,
  color,
  iconColor,
  leads,
  onStatusChange,
}: KanbanColumnProps) {
  return (
    <div className="card">
      <h3 style={{ color, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Circle size={20} fill={iconColor} stroke={iconColor} />{label}
      </h3>
      <div style={{ minHeight: '200px' }}>
        {leads.length === 0 ? (
          <p style={{ color: 'var(--text-light)', fontSize: '14px', textAlign: 'center' }}>該当なし</p>
        ) : (
          leads.map(lead => (
            <div
              key={lead.id}
              style={{
                background: 'white',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${color}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <div style={{ fontWeight: 600 }}>{lead.contactPerson}</div>
              </div>
              {lead.companyName && (
                <div style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={13} /> {lead.companyName}
                </div>
              )}
              <div style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={13} /> {lead.email || lead.phone || '-'}
              </div>
              <div style={{ marginTop: '10px' }} onClick={(e) => e.stopPropagation()}>
                <select
                  value={lead.status}
                  onChange={(e) => onStatusChange(lead, e.target.value as LeadStatus | 'DELETE')}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginBottom: '8px',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <option value="UNCONTACTED">{FUNNEL_STATUS_LABELS.UNCONTACTED}</option>
                  <option value="RESPONDED">{FUNNEL_STATUS_LABELS.RESPONDED}</option>
                  <option value="NEGOTIATION">{FUNNEL_STATUS_LABELS.NEGOTIATION}</option>
                  <option value="WON">{FUNNEL_STATUS_LABELS.WON}</option>
                  <option value="LOST">{FUNNEL_STATUS_LABELS.LOST}</option>
                  <option value="DELETE">削除</option>
                </select>
                {lead.memo && (
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-light)',
                    padding: '8px',
                    background: 'var(--bg-gray)',
                    borderRadius: '4px',
                  }}>
                    {lead.memo}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
