/**
 * app/_components/admin/sa-dashboard/StatCard.tsx
 *
 * Phase 13 WS-E: SADashboardから分割
 * 統計表示カード
 */

'use client';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-medium)',
              marginBottom: '4px',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-dark)',
            }}
          >
            {value.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatCard;
