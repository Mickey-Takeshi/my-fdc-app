/**
 * app/(app)/clients/page.tsx
 *
 * Phase 7: Clients ページ
 */

'use client';

import { useEffect } from 'react';
import { useClients, ClientsProvider } from '@/lib/contexts/ClientsContext';
import { useLeads, LeadsProvider } from '@/lib/contexts/LeadsContext';
import { ClientsManagement } from '@/app/_components/clients';

function ClientsPageContent() {
  const {
    clients,
    loading: clientsLoading,
    error: clientsError,
    reloadClients,
    addClient,
    updateClient,
    deleteClient,
  } = useClients();

  const { leads, loading: leadsLoading, reloadLeads } = useLeads();

  useEffect(() => {
    reloadClients();
    reloadLeads();
  }, [reloadClients, reloadLeads]);

  // LOST リードを抽出
  const lostLeads = leads.filter((lead) => lead.status === 'LOST');

  if (clientsLoading || leadsLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>読み込み中...</div>
    );
  }

  if (clientsError) {
    return (
      <div
        style={{ padding: '40px', textAlign: 'center', color: 'var(--error)' }}
      >
        {clientsError}
      </div>
    );
  }

  return (
    <ClientsManagement
      clients={clients}
      lostLeads={lostLeads}
      onAddClient={addClient}
      onUpdateClient={updateClient}
      onDeleteClient={deleteClient}
    />
  );
}

export default function ClientsPage() {
  return (
    <LeadsProvider>
      <ClientsProvider>
        <ClientsPageContent />
      </ClientsProvider>
    </LeadsProvider>
  );
}
