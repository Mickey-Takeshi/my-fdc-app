'use client';

import { memo } from 'react';
import { Users, Crown } from 'lucide-react';
import type { AdminUser } from '@/lib/hooks/useAdminViewModel';

/**
 * 管理者情報セクション
 */
export const AdminInfoSection = memo(function AdminInfoSection({ user }: { user: AdminUser }) {
  const email = user.email || '不明';
  const name = user.name || '不明';
  const roleLabel = user.accountType === 'SA' ? 'SA (システム管理者)' : user.workspaceRole || '管理者';

  return (
    <div className="settings-section">
      <div
        className="settings-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <Users
          size={28}
          style={{ color: 'var(--primary)' }}
        />
        <h2
          style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-dark)',
          }}
        >
          管理者情報
        </h2>
      </div>
      <div
        className="settings-body"
        style={{
          background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <Users size={48} style={{ color: 'var(--primary)' }} />
          <div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-dark)',
                marginBottom: '4px',
              }}
            >
              {name}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-medium)' }}>
              {email}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-medium)',
                marginBottom: '4px',
              }}
            >
              ロール
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--primary)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Crown size={18} />
                {roleLabel}
              </span>
            </div>
          </div>
          <div
            style={{
              background: 'white',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-medium)',
                marginBottom: '4px',
              }}
            >
              管理者権限
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--primary)',
              }}
            >
              &#10003; 有効
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
