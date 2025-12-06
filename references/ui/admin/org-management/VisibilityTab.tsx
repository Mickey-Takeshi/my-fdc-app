/**
 * app/_components/admin/org-management/VisibilityTab.tsx
 *
 * Phase 14.35: 可視性設定タブコンポーネント
 */

'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { Save } from 'lucide-react';
import type { VisibilityPolicy } from './types';

interface VisibilityTabProps {
  workspaceId: string;
}

export const VisibilityTab = memo(function VisibilityTab({
  workspaceId,
}: VisibilityTabProps) {
  const [_policy, setPolicy] = useState<VisibilityPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォーム値
  const [upwardLevel, setUpwardLevel] = useState(1);
  const [peerVisibility, setPeerVisibility] = useState<'none' | 'same_dept' | 'all'>('same_dept');
  const [unassignedVisibility, setUnassignedVisibility] = useState<'admins_only' | 'visible_to_all'>('admins_only');

  const fetchPolicy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org-chart/visibility-policy?workspaceId=${workspaceId}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '可視性設定の取得に失敗しました');
      }
      const data = await res.json();
      setPolicy(data.policy);
      setUpwardLevel(data.policy.upwardVisibilityLevel);
      setPeerVisibility(data.policy.peerVisibility);
      setUnassignedVisibility(data.policy.unassignedVisibility);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/org-chart/visibility-policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workspaceId,
          upwardVisibilityLevel: upwardLevel,
          peerVisibility,
          unassignedVisibility,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存に失敗しました');
      }

      alert('可視性設定を保存しました');
      await fetchPolicy();
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-medium)' }}>
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '12px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '6px',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 600 }}>可視性ポリシー</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 上位者の可視範囲 */}
        <div
          style={{
            padding: '20px',
            background: '#F9FAFB',
            borderRadius: '8px',
          }}
        >
          <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
            上位者の可視範囲
          </h4>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--text-medium)' }}>
            部下が見れる上司の範囲を設定します。
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="upwardLevel"
                checked={upwardLevel === 0}
                onChange={() => setUpwardLevel(0)}
              />
              <span>上位者は見れない</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="upwardLevel"
                checked={upwardLevel === 1}
                onChange={() => setUpwardLevel(1)}
              />
              <span>直属上司のみ見れる（デフォルト）</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="upwardLevel"
                checked={upwardLevel === 2}
                onChange={() => setUpwardLevel(2)}
              />
              <span>2階層上まで見れる</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="upwardLevel"
                checked={upwardLevel === -1}
                onChange={() => setUpwardLevel(-1)}
              />
              <span>全上位者を見れる</span>
            </label>
          </div>
        </div>

        {/* 同僚の可視範囲 */}
        <div
          style={{
            padding: '20px',
            background: '#F9FAFB',
            borderRadius: '8px',
          }}
        >
          <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
            同僚の可視範囲
          </h4>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--text-medium)' }}>
            同階層のメンバーをどこまで見れるかを設定します。
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="peerVisibility"
                checked={peerVisibility === 'none'}
                onChange={() => setPeerVisibility('none')}
              />
              <span>同僚は見れない</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="peerVisibility"
                checked={peerVisibility === 'same_dept'}
                onChange={() => setPeerVisibility('same_dept')}
              />
              <span>同じグループのメンバーのみ見れる（デフォルト）</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="peerVisibility"
                checked={peerVisibility === 'all'}
                onChange={() => setPeerVisibility('all')}
              />
              <span>全メンバーを見れる</span>
            </label>
          </div>
        </div>

        {/* 未配置メンバーの可視性 */}
        <div
          style={{
            padding: '20px',
            background: '#F9FAFB',
            borderRadius: '8px',
          }}
        >
          <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
            未配置メンバーの可視性
          </h4>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--text-medium)' }}>
            グループに配置されていないメンバーの可視性を設定します。
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="unassignedVisibility"
                checked={unassignedVisibility === 'admins_only'}
                onChange={() => setUnassignedVisibility('admins_only')}
              />
              <span>管理者のみ見れる（デフォルト）</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="unassignedVisibility"
                checked={unassignedVisibility === 'visible_to_all'}
                onChange={() => setUnassignedVisibility('visible_to_all')}
              />
              <span>全員が見れる</span>
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          <Save size={18} />
          {saving ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </div>
  );
});
