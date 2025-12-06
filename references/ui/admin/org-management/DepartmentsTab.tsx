/**
 * app/_components/admin/org-management/DepartmentsTab.tsx
 *
 * Phase 14.35: グループ管理タブコンポーネント
 */

'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import type { Department } from './types';

interface DepartmentsTabProps {
  workspaceId: string;
}

export const DepartmentsTab = memo(function DepartmentsTab({
  workspaceId,
}: DepartmentsTabProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // 新規/編集フォーム
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formParentId, setFormParentId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org-chart/departments?workspaceId=${workspaceId}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'グループの取得に失敗しました');
      }
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleSubmit = async () => {
    if (!formName.trim()) {
      alert('グループ名を入力してください');
      return;
    }

    setFormLoading(true);
    try {
      if (editingId) {
        // 更新
        const res = await fetch(`/api/org-chart/departments/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: formName, parentId: formParentId }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '更新に失敗しました');
        }
      } else {
        // 新規作成
        const res = await fetch('/api/org-chart/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            workspaceId,
            name: formName,
            parentId: formParentId,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '作成に失敗しました');
        }
      }

      setShowForm(false);
      setEditingId(null);
      setFormName('');
      setFormParentId(null);
      await fetchDepartments();
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作に失敗しました');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingId(dept.id);
    setFormName(dept.name);
    setFormParentId(dept.parentId);
    setShowForm(true);
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`グループ「${dept.name}」を削除してもよろしいですか？`)) return;

    try {
      const res = await fetch(`/api/org-chart/departments/${dept.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '削除に失敗しました');
      }
      await fetchDepartments();
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ツリー構造を構築
  const buildTree = (parentId: string | null): Department[] => {
    return departments
      .filter((d) => d.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const renderTree = (parentId: string | null, depth: number = 0): React.ReactNode => {
    const items = buildTree(parentId);
    if (items.length === 0) return null;

    return items.map((dept) => {
      const children = buildTree(dept.id);
      const hasChildren = children.length > 0;
      const isExpanded = expandedIds.has(dept.id);

      return (
        <div key={dept.id}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              paddingLeft: `${depth * 24 + 12}px`,
              borderBottom: '1px solid var(--border)',
              background: depth % 2 === 0 ? 'white' : '#F9FAFB',
            }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(dept.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-medium)',
                }}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <span style={{ width: '24px' }} />
            )}
            <FolderTree size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ flex: 1, fontWeight: 500 }}>{dept.name}</span>
            <button
              onClick={() => handleEdit(dept)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: 'var(--bg-gray)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              <Edit size={14} />
              編集
            </button>
            <button
              onClick={() => handleDelete(dept)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: '#B91C1C',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              <Trash2 size={14} />
              削除
            </button>
          </div>
          {hasChildren && isExpanded && renderTree(dept.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>グループ一覧</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchDepartments}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--bg-gray)',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            更新
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setFormName('');
              setFormParentId(null);
              setShowForm(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <Plus size={16} />
            グループを追加
          </button>
        </div>
      </div>

      {/* 新規/編集フォーム */}
      {showForm && (
        <div
          style={{
            padding: '16px',
            background: '#F9FAFB',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          <h4 style={{ margin: '0 0 16px', fontSize: '16px' }}>
            {editingId ? 'グループを編集' : '新しいグループを作成'}
          </h4>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                グループ名
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="例: 営業チーム"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                親グループ
              </label>
              <select
                value={formParentId || ''}
                onChange={(e) => setFormParentId(e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                }}
              >
                <option value="">なし（トップレベル）</option>
                {departments
                  .filter((d) => d.id !== editingId)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </div>
            <button
              onClick={handleSubmit}
              disabled={formLoading}
              style={{
                padding: '8px 20px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: formLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {formLoading ? '処理中...' : editingId ? '更新' : '作成'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: 'var(--text-medium)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '6px',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-medium)' }}>
          読み込み中...
        </div>
      ) : departments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-medium)' }}>
          グループがまだありません。「グループを追加」ボタンで作成してください。
        </div>
      ) : (
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div style={{ minWidth: '500px' }}>
          {renderTree(null)}
          </div>
        </div>
      )}
    </div>
  );
});
