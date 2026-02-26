/**
 * app/_components/mvv/MVVEditor.tsx
 *
 * Phase 17: MVV 編集コンポーネント
 */

'use client';

import { useMVV } from '@/lib/contexts/MVVContext';
import { useBrand } from '@/lib/contexts/BrandContext';
import { MVV_SECTIONS } from '@/lib/types/mvv';
import { MVVSection } from './MVVSection';

export function MVVEditor() {
  const { currentBrand } = useBrand();
  const { mvv, loading, updateMVV } = useMVV();

  if (!currentBrand) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
        ブランドを選択してください
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
        読み込み中...
      </div>
    );
  }

  const handleSave = async (key: 'mission' | 'vision' | 'values', value: string | string[]) => {
    const updates = {
      mission: mvv?.mission || '',
      vision: mvv?.vision || '',
      values: mvv?.values || [],
      [key]: value,
    };
    await updateMVV(updates);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {MVV_SECTIONS.map((section) => (
        <MVVSection
          key={section.key}
          definition={section}
          value={
            section.key === 'values'
              ? mvv?.values || []
              : mvv?.[section.key] || ''
          }
          onSave={(value) => handleSave(section.key, value)}
        />
      ))}
    </div>
  );
}
