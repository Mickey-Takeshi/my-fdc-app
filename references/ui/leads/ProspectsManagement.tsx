/**
 * app/_components/prospects/ProspectsManagement.tsx
 *
 * Phase 9.92-2: 見込み客管理コンポーネント（旧UI完全再現）
 * Phase 14.35: コンポーネント分割リファクタリング
 *
 * 機能:
 * 1. アプローチ実績・コンバージョン率表示
 * 2. リストビュー / カンバンビュー切り替え
 * 3. 見込み客追加フォーム
 * 4. CSVインポート機能
 * 5. ステータス変更（ドロップダウン）
 * 6. 失注アンケートモーダル
 */

'use client';

import { useState, useMemo } from 'react';
import { Plus, List, LayoutGrid, Upload, Trash2, Search, X } from 'lucide-react';
import type { Lead, LeadStatus } from '@/lib/hooks/useLeads';
import {
  ApproachStatsSection,
  KanbanColumn,
  ListView,
  LostSurveyModal,
  AddProspectForm,
  CSVImportForm,
} from './prospects';

interface ProspectsManagementProps {
  leads: Lead[];
  onAddLead: (lead: Partial<Lead>) => Promise<void>;
  onAddLeads?: (leads: Partial<Lead>[]) => Promise<void>;
  onUpdateStatus: (leadId: string, newStatus: LeadStatus) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
}

type ViewMode = 'list' | 'kanban';

const FUNNEL_STATUS_COLORS: Record<string, string> = {
  UNCONTACTED: '#E0E0E0',
  RESPONDED: '#2196F3',
  NEGOTIATION: '#FFD700',
  WON: '#FF9800',
};

export function ProspectsManagement({
  leads,
  onAddLead,
  onAddLeads,
  onUpdateStatus,
  onDeleteLead,
}: ProspectsManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCSVImportForm, setShowCSVImportForm] = useState(false);
  const [showLostSurvey, setShowLostSurvey] = useState(false);
  const [selectedLeadForLost, setSelectedLeadForLost] = useState<Lead | null>(null);
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
    return leads.filter(lead =>
      lead.companyName?.toLowerCase().includes(query) ||
      lead.contactPerson?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.memo?.toLowerCase().includes(query)
    );
  }, [leads, searchQuery]);

  const handleStatusChange = async (lead: Lead, newStatus: LeadStatus | 'DELETE') => {
    // 削除が選択された場合
    if (newStatus === 'DELETE') {
      if (confirm('この見込み客を削除しますか？')) {
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

    // それ以外はステータス変更（DELETEは上で処理済み）
    await onUpdateStatus(lead.id, newStatus as LeadStatus);
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
      alert('削除する見込み客データがありません');
      return;
    }

    const confirmed = confirm(
      `全ての見込み客データ（${count}件）を削除します。\n\n` +
      'この操作は取り消せません。本当に削除しますか？'
    );

    if (!confirmed) return;

    const doubleConfirmed = confirm(
      `最終確認\n\n` +
      `${count}件の見込み客データを完全に削除します。\n` +
      '本当によろしいですか？'
    );

    if (!doubleConfirmed) return;

    // Phase 14.11: Promise.all で並列削除（6倍高速化）
    await Promise.all(leads.map(lead => onDeleteLead(lead.id)));
    alert(`${count}件の見込み客データを削除しました`);
  };

  return (
    <div>
      {/* アプローチ実績・コンバージョン率セクション */}
      <ApproachStatsSection leads={leads} />

      {/* 検索バー */}
      <div style={{
        marginBottom: '15px',
        position: 'relative',
      }}>
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
        <p style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--text-medium)' }}>
          {filteredLeads.length}件の結果（全{leads.length}件中）
        </p>
      )}

      {/* ビュー切り替えボタン＋追加・インポート・削除ボタン */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
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
            見込み客追加
          </button>
          <button
            onClick={() => setShowCSVImportForm(!showCSVImportForm)}
            className="btn btn-secondary btn-small"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Upload size={16} />
            CSVインポート
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

      {/* CSVインポートフォーム */}
      {showCSVImportForm && (
        <CSVImportForm
          onCancel={() => setShowCSVImportForm(false)}
          onImport={async (newLeads) => {
            if (onAddLeads) {
              await onAddLeads(newLeads);
            } else {
              // Phase 14.11: Promise.all で並列追加（6倍高速化）
              await Promise.all(newLeads.map(lead => onAddLead(lead)));
            }
          }}
        />
      )}

      {/* 見込み客追加フォーム */}
      {showAddForm && (
        <AddProspectForm
          onAdd={onAddLead}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* リストビュー */}
      {viewMode === 'list' && (
        <ListView
          leads={filteredLeads}
          onStatusChange={handleStatusChange}
          onDeleteLead={onDeleteLead}
        />
      )}

      {/* カンバンビュー */}
      {viewMode === 'kanban' && (
        <div style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '8px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(250px, 1fr))',
            gap: '20px',
            minWidth: '1000px',
          }}>
          <KanbanColumn
            label="未接触"
            color={FUNNEL_STATUS_COLORS.UNCONTACTED}
            iconColor="#E0E0E0"
            leads={filteredLeads.filter(l => l.status === 'UNCONTACTED')}
            onStatusChange={handleStatusChange}
          />
          <KanbanColumn
            label="反応あり"
            color={FUNNEL_STATUS_COLORS.RESPONDED}
            iconColor="#2196F3"
            leads={filteredLeads.filter(l => l.status === 'RESPONDED')}
            onStatusChange={handleStatusChange}
          />
          <KanbanColumn
            label="商談中"
            color={FUNNEL_STATUS_COLORS.NEGOTIATION}
            iconColor="#FFD700"
            leads={filteredLeads.filter(l => l.status === 'NEGOTIATION')}
            onStatusChange={handleStatusChange}
          />
          <KanbanColumn
            label="成約"
            color={FUNNEL_STATUS_COLORS.WON}
            iconColor="#FF9800"
            leads={filteredLeads.filter(l => l.status === 'WON')}
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
        leadName={selectedLeadForLost?.companyName || ''}
        lostSurvey={lostSurvey}
        setLostSurvey={setLostSurvey}
      />
    </div>
  );
}
