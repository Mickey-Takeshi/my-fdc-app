/**
 * app/(app)/leads/page.tsx
 *
 * Phase 6: Leads ページ
 * Phase 7: クライアント変換機能追加
 * Phase 8: アプローチ機能追加、PDCA分析
 */

'use client';

import { useState } from 'react';
import { LeadsProvider, useLeads } from '@/lib/contexts/LeadsContext';
import { ClientsProvider, useClients } from '@/lib/contexts/ClientsContext';
import {
  ApproachesProvider,
  useApproaches,
} from '@/lib/contexts/ApproachesContext';
import { PDCAProvider, usePDCA } from '@/lib/contexts/PDCAContext';
import { LeadsManagement } from '@/app/_components/leads';
import { ApproachStatsCard } from '@/app/_components/approaches';
import { PDCACard } from '@/app/_components/pdca';
import type { Lead } from '@/lib/types/lead';

function LeadsPageContent() {
  const { leads, loading, error, addLead, updateStatus, deleteLead } =
    useLeads();
  const { convertLead } = useClients();
  const { approaches, stats, addApproach, deleteApproach } = useApproaches();
  const { weeklyAnalysis, monthlyAnalysis, createGoal, updateGoal } = usePDCA();
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [converting, setConverting] = useState(false);
  const [pdcaView, setPdcaView] = useState<'weekly' | 'monthly'>('weekly');

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>読み込み中...</div>
    );
  }

  if (error) {
    return (
      <div
        style={{ padding: '40px', textAlign: 'center', color: 'var(--error)' }}
      >
        {error}
      </div>
    );
  }

  // 成約時の変換処理
  const handleUpdateStatus = async (leadId: string, status: string) => {
    if (status === 'WON') {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        setConvertingLead(lead);
        return;
      }
    }
    await updateStatus(leadId, status as Parameters<typeof updateStatus>[1]);
  };

  // クライアント変換実行
  const handleConvert = async () => {
    if (!convertingLead) return;
    setConverting(true);
    try {
      await convertLead(convertingLead.id);
      await updateStatus(convertingLead.id, 'WON');
      setConvertingLead(null);
    } finally {
      setConverting(false);
    }
  };

  // 変換せずにステータスだけ変更
  const handleSkipConvert = async () => {
    if (!convertingLead) return;
    await updateStatus(convertingLead.id, 'WON');
    setConvertingLead(null);
  };

  return (
    <>
      {/* PDCA分析カード */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={() => setPdcaView('weekly')}
            className={pdcaView === 'weekly' ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
          >
            週次
          </button>
          <button
            onClick={() => setPdcaView('monthly')}
            className={pdcaView === 'monthly' ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
          >
            月次
          </button>
        </div>
        {pdcaView === 'weekly' && weeklyAnalysis && (
          <PDCACard
            analysis={weeklyAnalysis}
            onCreateGoal={createGoal}
            onUpdateGoal={updateGoal}
          />
        )}
        {pdcaView === 'monthly' && monthlyAnalysis && (
          <PDCACard
            analysis={monthlyAnalysis}
            onCreateGoal={createGoal}
            onUpdateGoal={updateGoal}
          />
        )}
      </div>

      {/* アプローチ統計カード */}
      {stats && <ApproachStatsCard stats={stats} />}

      <LeadsManagement
        leads={leads}
        onAddLead={addLead}
        onUpdateStatus={handleUpdateStatus}
        onDeleteLead={deleteLead}
        approaches={approaches}
        onAddApproach={addApproach}
        onDeleteApproach={deleteApproach}
      />

      {/* 変換確認モーダル */}
      {convertingLead && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setConvertingLead(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px' }}>顧客に変換しますか？</h3>
            <p style={{ color: 'var(--text-light)', marginBottom: '20px' }}>
              リード「{convertingLead.contactPerson}」を成約にします。
              顧客として登録しますか？
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConvertingLead(null)}
                disabled={converting}
              >
                キャンセル
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleSkipConvert}
                disabled={converting}
              >
                変換しない
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConvert}
                disabled={converting}
              >
                {converting ? '変換中...' : '顧客に変換'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function LeadsPage() {
  return (
    <LeadsProvider>
      <ClientsProvider>
        <ApproachesProvider>
          <PDCAProvider>
            <LeadsPageContent />
          </PDCAProvider>
        </ApproachesProvider>
      </ClientsProvider>
    </LeadsProvider>
  );
}
