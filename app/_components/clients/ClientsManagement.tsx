/**
 * app/_components/clients/ClientsManagement.tsx
 *
 * Phase 7: クライアント管理メインコンポーネント
 */

'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, AlertTriangle, Users } from 'lucide-react';
import type { Client } from '@/lib/types/client';
import type { Lead } from '@/lib/types/lead';
import { isContractExpired } from '@/lib/types/client';
import { ClientCard } from './ClientCard';
import { AddClientForm } from './AddClientForm';
import { LostProspectsSection } from './LostProspectsSection';

interface ClientsManagementProps {
  clients: Client[];
  lostLeads: Lead[];
  onAddClient: (input: Parameters<typeof AddClientForm>[0]['onAdd'] extends (input: infer T) => unknown ? T : never) => Promise<Client | null>;
  onUpdateClient: (id: string, updates: Partial<Client>) => Promise<Client | null>;
  onDeleteClient: (id: string) => Promise<void>;
}

export function ClientsManagement({
  clients,
  lostLeads,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
}: ClientsManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);

  // 契約中と期限切れを分離
  const { activeClients, expiredClients } = useMemo(() => {
    const active: Client[] = [];
    const expired: Client[] = [];

    clients.forEach((client) => {
      if (isContractExpired(client.contractDeadline) || client.status === 'contract_expired') {
        expired.push(client);
      } else {
        active.push(client);
      }
    });

    return { activeClients: active, expiredClients: expired };
  }, [clients]);

  // 検索フィルター
  const filteredClients = useMemo(() => {
    const targetClients = showExpiredOnly ? expiredClients : activeClients;

    if (!searchQuery) return targetClients;

    const query = searchQuery.toLowerCase();
    return targetClients.filter(
      (client) =>
        client.contactPerson.toLowerCase().includes(query) ||
        client.companyName?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query)
    );
  }, [activeClients, expiredClients, showExpiredOnly, searchQuery]);

  const handleAddClient = async (input: Parameters<typeof AddClientForm>[0]['onAdd'] extends (input: infer T) => unknown ? T : never) => {
    await onAddClient(input);
  };

  return (
    <div>
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} />
            顧客管理
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-light)', fontSize: '14px' }}>
            契約中: {activeClients.length}件 / 期限切れ: {expiredClients.length}件
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={18} />
          新規クライアント
        </button>
      </div>

      {/* 追加フォーム */}
      {showAddForm && (
        <AddClientForm
          onAdd={handleAddClient}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* 期限切れ警告 */}
      {expiredClients.length > 0 && !showExpiredOnly && (
        <div
          style={{
            padding: '12px 16px',
            background: '#FFEBEE',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="#C62828" />
            <span style={{ color: '#C62828', fontWeight: 500 }}>
              契約期限切れのクライアントが {expiredClients.length} 件あります
            </span>
          </div>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => setShowExpiredOnly(true)}
            style={{ borderColor: '#C62828', color: '#C62828' }}
          >
            確認する
          </button>
        </div>
      )}

      {/* フィルター */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="名前、会社名、メールで検索..."
            style={{
              width: '100%',
              padding: '10px 10px 10px 40px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-small ${!showExpiredOnly ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowExpiredOnly(false)}
          >
            契約中 ({activeClients.length})
          </button>
          <button
            className={`btn btn-small ${showExpiredOnly ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowExpiredOnly(true)}
            style={showExpiredOnly ? {} : expiredClients.length > 0 ? { borderColor: '#FF5722', color: '#FF5722' } : {}}
          >
            期限切れ ({expiredClients.length})
          </button>
        </div>
      </div>

      {/* クライアント一覧 */}
      <div style={{ marginBottom: '30px' }}>
        {filteredClients.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}
          >
            {searchQuery
              ? '検索条件に一致するクライアントがありません'
              : showExpiredOnly
              ? '期限切れのクライアントはありません'
              : 'クライアントがいません。新規クライアントを追加してください。'}
          </div>
        ) : (
          filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onUpdate={onUpdateClient}
              onDelete={onDeleteClient}
            />
          ))
        )}
      </div>

      {/* 失注分析セクション */}
      <LostProspectsSection lostLeads={lostLeads} />
    </div>
  );
}
