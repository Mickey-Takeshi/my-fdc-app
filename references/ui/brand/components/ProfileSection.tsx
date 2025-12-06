/**
 * app/_components/brand/components/ProfileSection.tsx
 * プロフィールセクション（表示・編集）
 */

'use client';

import { Profiles } from '@/lib/types/app-data';

/**
 * プロフィール表示セクション
 */
export function ProfileDisplaySection({ profiles }: { profiles: Profiles }) {
  const items = [
    { label: '自己紹介', value: profiles.bio, multiline: true },
    { label: 'X (Twitter)', value: profiles.x },
    { label: 'Facebook', value: profiles.facebook },
    { label: 'Note', value: profiles.note },
    { label: 'Instagram', value: profiles.instagram },
  ];

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            padding: '12px',
            background: 'var(--bg-gray)',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-light)',
              marginBottom: '4px',
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              color: item.value ? 'var(--text-dark)' : 'var(--text-light)',
              fontSize: '14px',
              whiteSpace: item.multiline ? 'pre-wrap' : 'normal',
            }}
          >
            {item.value || '未設定'}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * プロフィール編集セクション
 */
export function ProfileEditSection({
  editProfiles,
  onUpdate,
}: {
  editProfiles: Profiles;
  onUpdate: (field: keyof Profiles, value: string) => void;
}) {
  const fields: { key: keyof Profiles; label: string; placeholder: string; multiline?: boolean }[] = [
    { key: 'bio', label: '自己紹介', placeholder: '自己紹介文を入力...', multiline: true },
    { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/username' },
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username' },
    { key: 'note', label: 'Note', placeholder: 'https://note.com/username' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  ];

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {fields.map((field) => (
        <div key={field.key}>
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              fontSize: '14px',
              color: 'var(--text-dark)',
            }}
          >
            {field.label}
          </label>
          {field.multiline ? (
            <textarea
              value={editProfiles[field.key]}
              onChange={(e) => onUpdate(field.key, e.target.value)}
              placeholder={field.placeholder}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '14px',
                minHeight: '100px',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <input
              type="text"
              value={editProfiles[field.key]}
              onChange={(e) => onUpdate(field.key, e.target.value)}
              placeholder={field.placeholder}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
