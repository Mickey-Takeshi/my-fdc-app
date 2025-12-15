/**
 * app/_components/settings/ProfileSection.tsx
 *
 * プロフィール編集セクション
 */

'use client';

import React, { useState, useEffect } from 'react';
import { User, Save, AlertCircle } from 'lucide-react';
import type { Profile } from '@/lib/types/settings';
import { validateProfile } from '@/lib/types/settings';
import { SectionCard } from './SectionCard';

interface ProfileSectionProps {
  profile: Profile;
  onUpdate: (updates: Partial<Profile>) => void;
}

export function ProfileSection({ profile, onUpdate }: ProfileSectionProps) {
  const [formData, setFormData] = useState<Profile>(profile);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (field: keyof Profile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSocialChange = (field: keyof Profile['socialLinks'], value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [field]: value },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    const validationErrors = validateProfile(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onUpdate(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid var(--border, #e5e7eb)',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '6px',
    color: 'var(--text-dark, #1f2937)',
  };

  return (
    <SectionCard
      title="プロフィール"
      icon={<User size={24} color="var(--primary, #6366f1)" />}
      description="基本情報とSNSリンクを設定します"
    >
      {/* エラー表示 */}
      {errors.length > 0 && (
        <div
          style={{
            padding: '12px',
            background: '#fef2f2',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          {errors.map((error, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#dc2626',
                fontSize: '13px',
              }}
            >
              <AlertCircle size={14} />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* 基本情報 */}
      <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>名前</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="山田 太郎"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>メールアドレス</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@example.com"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>会社名</label>
            <input
              type="text"
              value={formData.company || ''}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="株式会社サンプル"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Webサイト</label>
            <input
              type="url"
              value={formData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://example.com"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>自己紹介</label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder="自己紹介を入力してください"
            rows={3}
            style={{
              ...inputStyle,
              resize: 'vertical',
            }}
          />
        </div>
      </div>

      {/* SNSリンク */}
      <div style={{ marginBottom: '24px' }}>
        <h4
          style={{
            margin: '0 0 12px',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-dark, #1f2937)',
          }}
        >
          SNSリンク
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>X (Twitter)</label>
            <input
              type="text"
              value={formData.socialLinks.x || ''}
              onChange={(e) => handleSocialChange('x', e.target.value)}
              placeholder="@username"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Facebook</label>
            <input
              type="text"
              value={formData.socialLinks.facebook || ''}
              onChange={(e) => handleSocialChange('facebook', e.target.value)}
              placeholder="username"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Instagram</label>
            <input
              type="text"
              value={formData.socialLinks.instagram || ''}
              onChange={(e) => handleSocialChange('instagram', e.target.value)}
              placeholder="@username"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Note</label>
            <input
              type="text"
              value={formData.socialLinks.note || ''}
              onChange={(e) => handleSocialChange('note', e.target.value)}
              placeholder="username"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          background: saved ? '#10b981' : 'var(--primary, #6366f1)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        <Save size={16} />
        {saved ? '保存しました' : '保存'}
      </button>
    </SectionCard>
  );
}

export default ProfileSection;
