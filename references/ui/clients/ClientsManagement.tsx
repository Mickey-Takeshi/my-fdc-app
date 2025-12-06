/**
 * app/_components/clients/ClientsManagement.tsx
 *
 * Phase 9.92-D: 顧客管理タブの React 実装
 * Phase 10.1: 既存客管理 → 顧客管理に名称変更、失注管理を統合
 * Phase 14.35: コンポーネント分割（1192行 → 約180行）
 *
 * 【責務】
 * - 既存客カルテの一覧表示
 * - 契約期限・次回ミーティング管理
 * - ステータス変更（既存客 ⇔ 契約満了）
 * - 取引メモ・履歴管理
 * - 既存客の追加・削除
 * - 失注管理・分析（統合）
 */

'use client';

import { Handshake, Plus, Circle } from 'lucide-react';
import { useClientsViewModel } from '@/lib/hooks/useClientsViewModel';

// サブコンポーネント
import { AddClientForm, ClientCard, LostProspectsSection } from './clients';

// ========================================
// メインコンポーネント
// ========================================

export function ClientsManagement() {
  const {
    clients,
    expiredClients,
    loading,
    error,
    expandedClientId,
    toggleExpand,
    showAddForm,
    setShowAddForm,
    addClient,
    deleteClient,
    updateStatus,
    updateDeadline,
    updateMeeting,
    addNote,
    getDeadlineWarning,
    getMeetingWarning,
  } = useClientsViewModel();

  if (loading) {
    return (
      <div className="section">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Handshake size={24} /> 顧客管理
        </h2>
        <div className="card">
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px' }}>
            読み込み中...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Handshake size={24} /> 顧客管理
        </h2>
        <div className="card">
          <div className="alert alert-error">
            エラー: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Handshake size={24} /> 顧客管理
      </h2>

      {/* 追加ボタン */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '20px',
          }}
        >
          <Plus size={16} />
          既存客を追加
        </button>
      )}

      {/* 追加フォーム */}
      {showAddForm && (
        <AddClientForm
          onSubmit={async (data) => {
            try {
              await addClient(data);
              alert('既存客を追加しました！');
            } catch {
              alert('追加に失敗しました');
            }
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* 既存客一覧 */}
      <h3 style={{
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--text-dark)',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Circle size={14} fill="#4CAF50" stroke="#4CAF50" /> 既存先 ({clients.length}件)
      </h3>
      {clients.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '20px' }}>
            既存先はまだありません
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px', marginBottom: '40px' }}>
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              isExpanded={expandedClientId === client.id}
              onToggleExpand={() => toggleExpand(client.id)}
              onUpdateStatus={(status) => updateStatus(client.id, status)}
              onUpdateDeadline={(deadline) => updateDeadline(client.id, deadline)}
              onUpdateMeeting={(meeting) => updateMeeting(client.id, meeting)}
              onAddNote={(note) => addNote(client.id, note)}
              onDelete={() => deleteClient(client.id)}
              getDeadlineWarning={getDeadlineWarning}
              getMeetingWarning={getMeetingWarning}
            />
          ))}
        </div>
      )}

      {/* 契約満了先一覧 */}
      <h3 style={{
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--text-dark)',
        marginBottom: '16px',
        marginTop: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        paddingTop: '24px',
        borderTop: '2px solid var(--bg-gray)'
      }}>
        <Circle size={14} fill="#9C27B0" stroke="#9C27B0" /> 契約満了先 ({expiredClients.length}件)
      </h3>
      {expiredClients.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '20px' }}>
            契約満了先はまだありません
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {expiredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              isExpanded={expandedClientId === client.id}
              onToggleExpand={() => toggleExpand(client.id)}
              onUpdateStatus={(status) => updateStatus(client.id, status)}
              onUpdateDeadline={(deadline) => updateDeadline(client.id, deadline)}
              onUpdateMeeting={(meeting) => updateMeeting(client.id, meeting)}
              onAddNote={(note) => addNote(client.id, note)}
              onDelete={() => deleteClient(client.id)}
              getDeadlineWarning={getDeadlineWarning}
              getMeetingWarning={getMeetingWarning}
            />
          ))}
        </div>
      )}

      {/* 失注管理・分析セクション */}
      <LostProspectsSection />
    </div>
  );
}
