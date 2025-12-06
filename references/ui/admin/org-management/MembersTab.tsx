/**
 * app/_components/admin/org-management/MembersTab.tsx
 *
 * Phase 14.35: レポートライン管理タブコンポーネント
 */

'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import {
  RefreshCw,
  UserPlus,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import type { Department, ReportLine, MemberAssignment } from './types';

interface MembersTabProps {
  workspaceId: string;
}

export const MembersTab = memo(function MembersTab({
  workspaceId,
}: MembersTabProps) {
  const [_departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<MemberAssignment[]>([]);
  const [reportLines, setReportLines] = useState<ReportLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // レポートライン設定フォーム
  const [showReportLineForm, setShowReportLineForm] = useState(false);
  const [selectedSubordinate, setSelectedSubordinate] = useState<string | null>(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null);
  const [reportLineLoading, setReportLineLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // グループ、メンバー、レポートラインを並行取得
      const [deptRes, membersRes, reportLinesRes] = await Promise.all([
        fetch(`/api/org-chart/departments?workspaceId=${workspaceId}`, { credentials: 'include' }),
        fetch(`/api/workspaces/${workspaceId}/members`, { credentials: 'include' }),
        fetch(`/api/org-chart/report-lines?workspaceId=${workspaceId}`, { credentials: 'include' }),
      ]);

      if (!deptRes.ok || !membersRes.ok || !reportLinesRes.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const [deptData, membersData, reportLinesData] = await Promise.all([
        deptRes.json(),
        membersRes.json(),
        reportLinesRes.json(),
      ]);

      setDepartments(deptData.departments || []);
      setMembers(
        (membersData.members || []).map((m: { userId: string; name: string; email: string; picture: string | null }) => ({
          userId: m.userId,
          name: m.name,
          email: m.email,
          picture: m.picture,
          departmentId: null, // NOTE: グループ情報を取得
          role: null,
        }))
      );
      setReportLines(reportLinesData.reportLines || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddReportLine = async () => {
    if (!selectedSubordinate || !selectedSupervisor) {
      alert('部下と上司を選択してください');
      return;
    }

    setReportLineLoading(true);
    try {
      const res = await fetch('/api/org-chart/report-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workspaceId,
          subordinateId: selectedSubordinate,
          supervisorId: selectedSupervisor,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'レポートラインの作成に失敗しました');
      }

      setShowReportLineForm(false);
      setSelectedSubordinate(null);
      setSelectedSupervisor(null);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作に失敗しました');
    } finally {
      setReportLineLoading(false);
    }
  };

  const handleDeleteReportLine = async (id: string) => {
    if (!confirm('このレポートラインを削除してもよろしいですか？')) return;

    try {
      const res = await fetch(`/api/org-chart/report-lines/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '削除に失敗しました');
      }

      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました');
    }
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
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>レポートライン</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchData}
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
            onClick={() => setShowReportLineForm(true)}
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
            <UserPlus size={16} />
            レポートライン追加
          </button>
        </div>
      </div>

      {/* レポートライン追加フォーム */}
      {showReportLineForm && (
        <div
          style={{
            padding: '16px',
            background: '#F9FAFB',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          <h4 style={{ margin: '0 0 16px', fontSize: '16px' }}>レポートラインを設定</h4>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                部下
              </label>
              <select
                value={selectedSubordinate || ''}
                onChange={(e) => setSelectedSubordinate(e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                }}
              >
                <option value="">選択してください</option>
                {members
                  .filter((m) => m.userId !== selectedSupervisor)
                  .map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name || m.email}
                    </option>
                  ))}
              </select>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--text-medium)' }} />
            <div style={{ minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                上司
              </label>
              <select
                value={selectedSupervisor || ''}
                onChange={(e) => setSelectedSupervisor(e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                }}
              >
                <option value="">選択してください</option>
                {members
                  .filter((m) => m.userId !== selectedSubordinate)
                  .map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name || m.email}
                    </option>
                  ))}
              </select>
            </div>
            <button
              onClick={handleAddReportLine}
              disabled={reportLineLoading}
              style={{
                padding: '8px 20px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: reportLineLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {reportLineLoading ? '処理中...' : '設定'}
            </button>
            <button
              onClick={() => setShowReportLineForm(false)}
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
      ) : reportLines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-medium)' }}>
          レポートラインがまだありません。「レポートライン追加」ボタンで設定してください。
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
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '550px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', background: '#F9FAFB' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600 }}>部下</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '14px', fontWeight: 600 }}>→</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600 }}>上司</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {reportLines.map((rl) => (
                <tr key={rl.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {(rl.subordinate?.name || rl.subordinate?.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <span>{rl.subordinate?.name || rl.subordinate?.email || `ID: ${rl.subordinateId}`}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-medium)' }}>
                    <ArrowRight size={16} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {(rl.supervisor?.name || rl.supervisor?.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <span>{rl.supervisor?.name || rl.supervisor?.email || `ID: ${rl.supervisorId}`}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => handleDeleteReportLine(rl.id)}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
