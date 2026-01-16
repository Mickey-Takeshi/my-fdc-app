/**
 * app/_components/leads/LeadsManagement.tsx
 *
 * Phase 6: リード管理メインコンポーネント
 * Phase 8: アプローチ機能追加
 *
 * 機能:
 * 1. リストビュー / カンバンビュー切り替え
 * 2. リード追加フォーム
 * 3. ステータス変更（ドロップダウン）
 * 4. 失注アンケートモーダル
 * 5. 検索フィルター
 * 6. アプローチ履歴表示・追加
 */

'use client';

import { useState, useMemo } from 'react';
import { Plus, List, LayoutGrid, Trash2, Search, X } from 'lucide-react';
import type { Lead, LeadStatus, CreateLeadInput } from '@/lib/types/lead';
import { LEAD_STATUS_COLORS } from '@/lib/types/lead';
import type { Approach, CreateApproachInput } from '@/lib/types/approach';
import { KanbanColumn } from './KanbanColumn';
import { ListView } from './ListView';
import { AddLeadForm } from './AddLeadForm';
import { LostSurveyModal } from './LostSurveyModal';

interface LeadsManagementProps {
  leads: Lead[];
  onAddLead: (lead: CreateLeadInput) => Promise<Lead | null>;
  onAddLeads?: (leads: CreateLeadInput[]) => Promise<void>;
  onUpdateStatus: (leadId: string, newStatus: LeadStatus) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
  // Phase 8: アプローチ機能
  approaches?: Approach[];
  onAddApproach?: (input: CreateApproachInput) => Promise<Approach | null>;
  onDeleteApproach?: (id: string) => Promise<void>;
}

type ViewMode = 'list' | 'kanban';

export function LeadsManagement({
  leads,
  onAddLead,
  onUpdateStatus,
  onDeleteLead,
  approaches,
  onAddApproach,
  onDeleteApproach,
}: LeadsManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLostSurvey, setShowLostSurvey] = useState(false);
  const [selectedLeadForLost, setSelectedLeadForLost] = useState<Lead | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');

  // 失注アンケートの状態
  const [lostSurvey, setLostSurvey] = useState({
    reason: '',
    reasonOther: '',
    feedback: '',
  });

  // 検索フィルタリング
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const query = searchQuery.toLowerCase();
    return leads.filter(
      (lead) =>
        lead.companyName?.toLowerCase().includes(query) ||
        lead.contactPerson?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.memo?.toLowerCase().includes(query)
    );
  }, [leads, searchQuery]);

  const handleStatusChange = async (
    lead: Lead,
    newStatus: LeadStatus | 'DELETE'
  ) => {
    // 削除が選択された場合
    if (newStatus === 'DELETE') {
      if (confirm('このリードを削除しますか？')) {
        await onDeleteLead(lead.id);
      }
      return;
    }

    // 失注が選択された場合はアンケートモーダルを表示
    if (newStatus === 'LOST') {
      setSelectedLeadForLost(lead);
      setShowLostSurvey(true);
      return;
    }

    // それ以外はステータス変更
    await onUpdateStatus(lead.id, newStatus);
  };

  const handleSubmitLostSurvey = async () => {
    if (!lostSurvey.reason) {
      alert('失注理由を選択してください');
      return;
    }

    if (!selectedLeadForLost) return;

    await onUpdateStatus(selectedLeadForLost.id, 'LOST');

    setShowLostSurvey(false);
    setLostSurvey({ reason: '', reasonOther: '', feedback: '' });
    setSelectedLeadForLost(null);
  };

  const handleDeleteAll = async () => {
    const count = leads.length;
    if (count === 0) {
      alert('削除するリードデータがありません');
      return;
    }

    const confirmed = confirm(
      `全てのリードデータ（${count}件）を削除します。\n\n` +
        'この操作は取り消せません。本当に削除しますか？'
    );

    if (!confirmed) return;

    const doubleConfirmed = confirm(
      `最終確認\n\n` +
        `${count}件のリードデータを完全に削除します。\n` +
        '本当によろしいですか？'
    );

    if (!doubleConfirmed) return;

    // 並列削除
    await Promise.all(leads.map((lead) => onDeleteLead(lead.id)));
    alert(`${count}件のリードデータを削除しました`);
  };

  return (
    <div>
      {/* 検索バー */}
      <div
        style={{
          marginBottom: '15px',
          position: 'relative',
        }}
      >
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-light)',
          }}
        />
        <input
          type="text"
          placeholder="名前、会社名、メール、メモで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 40px 10px 40px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} style={{ color: 'var(--text-light)' }} />
          </button>
        )}
      </div>

      {/* 検索結果表示 */}
      {searchQuery && (
        <p
          style={{
            marginBottom: '10px',
            fontSize: '14px',
            color: 'var(--text-medium)',
          }}
        >
          {filteredLeads.length}件の結果（全{leads.length}件中）
        </p>
      )}

      {/* ビュー切り替えボタン＋追加・削除ボタン */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setViewMode('list')}
          className={viewMode === 'list' ? 'btn btn-primary' : 'btn btn-secondary'}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <List size={16} />
          リスト表示
        </button>
        <button
          onClick={() => setViewMode('kanban')}
          className={viewMode === 'kanban' ? 'btn btn-primary' : 'btn btn-secondary'}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <LayoutGrid size={16} />
          カンバン表示
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-secondary btn-small"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={16} />
            リード追加
          </button>
          <button
            onClick={handleDeleteAll}
            className="btn btn-danger btn-small"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Trash2 size={16} />
            全削除
          </button>
        </div>
      </div>

      {/* リード追加フォーム */}
      {showAddForm && (
        <AddLeadForm onAdd={onAddLead} onCancel={() => setShowAddForm(false)} />
      )}

      {/* リストビュー */}
      {viewMode === 'list' && (
        <ListView
          leads={filteredLeads}
          onStatusChange={handleStatusChange}
          onDeleteLead={onDeleteLead}
          approaches={approaches}
          onAddApproach={onAddApproach}
          onDeleteApproach={onDeleteApproach}
        />
      )}

      {/* カンバンビュー */}
      {viewMode === 'kanban' && (
        <div
          style={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '8px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(250px, 1fr))',
              gap: '20px',
              minWidth: '1000px',
            }}
          >
            <KanbanColumn
              label="未接触"
              color={LEAD_STATUS_COLORS.UNCONTACTED}
              iconColor="#E0E0E0"
              leads={filteredLeads.filter((l) => l.status === 'UNCONTACTED')}
              onStatusChange={handleStatusChange}
            />
            <KanbanColumn
              label="反応あり"
              color={LEAD_STATUS_COLORS.RESPONDED}
              iconColor="#2196F3"
              leads={filteredLeads.filter((l) => l.status === 'RESPONDED')}
              onStatusChange={handleStatusChange}
            />
            <KanbanColumn
              label="商談中"
              color={LEAD_STATUS_COLORS.NEGOTIATION}
              iconColor="#FFD700"
              leads={filteredLeads.filter((l) => l.status === 'NEGOTIATION')}
              onStatusChange={handleStatusChange}
            />
            <KanbanColumn
              label="成約"
              color={LEAD_STATUS_COLORS.WON}
              iconColor="#FF9800"
              leads={filteredLeads.filter((l) => l.status === 'WON')}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>
      )}

      {/* 失注アンケートモーダル */}
      <LostSurveyModal
        isOpen={showLostSurvey}
        onClose={() => {
          setShowLostSurvey(false);
          setLostSurvey({ reason: '', reasonOther: '', feedback: '' });
        }}
        onSubmit={handleSubmitLostSurvey}
        leadName={selectedLeadForLost?.companyName || selectedLeadForLost?.contactPerson || ''}
        lostSurvey={lostSurvey}
        setLostSurvey={setLostSurvey}
      />
    </div>
  );
}
