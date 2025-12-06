/**
 * app/_components/admin/DataQualityPanel.tsx
 *
 * Phase 14.6-B: データ品質ダッシュボード
 * ワークスペース内のデータ品質を可視化し、改善提案を表示する
 */

'use client';

import { useState, useMemo } from 'react';
import {
  generateWorkspaceQualitySummary,
  type WorkspaceQualitySummary,
  type QualityIssue,
} from '@/lib/core/data-quality';

interface DataQualityPanelProps {
  workspaceId: string;
  leads?: Array<{ id: string; data: Record<string, unknown> }>;
  clients?: Array<{ id: string; data: Record<string, unknown> }>;
  tasks?: Array<{ id: string; data: Record<string, unknown> }>;
}

export default function DataQualityPanel({
  leads = [],
  clients = [],
  tasks = [],
}: DataQualityPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'leads' | 'clients' | 'tasks'>('all');

  // useMemoで計算（useEffect + setStateを回避）
  const summary = useMemo<WorkspaceQualitySummary>(() => {
    return generateWorkspaceQualitySummary(leads, clients, tasks);
  }, [leads, clients, tasks]);

  // 問題件数をseverityごとに集計
  const issueCounts = useMemo(() => {
    return summary.topIssues.reduce(
      (acc, issue) => {
        acc[issue.severity]++;
        return acc;
      },
      { error: 0, warning: 0, info: 0 }
    );
  }, [summary]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getSeverityBadge = (severity: 'error' | 'warning' | 'info') => {
    const styles = {
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      info: 'bg-blue-100 text-blue-800',
    };
    const labels = {
      error: 'エラー',
      warning: '警告',
      info: '情報',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles[severity]}`}>
        {labels[severity]}
      </span>
    );
  };

  // topIssuesをフィルタリング
  const filteredIssues = summary.topIssues;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">データ品質サマリー</h2>

      {/* 全体スコア */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">全体スコア</span>
          <span className={`text-2xl font-bold ${getScoreColor(summary.overallScore)}`}>
            {summary.overallScore}点
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${getScoreBgColor(summary.overallScore)}`}
            style={{ width: `${summary.overallScore}%` }}
          />
        </div>
      </div>

      {/* エンティティ別統計 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">
            {summary.entityCounts.leads}
          </div>
          <div className="text-xs text-gray-500">見込み客</div>
          <div className={`text-sm ${getScoreColor(summary.averageScores.leads)}`}>
            平均 {summary.averageScores.leads}点
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">
            {summary.entityCounts.clients}
          </div>
          <div className="text-xs text-gray-500">既存客</div>
          <div className={`text-sm ${getScoreColor(summary.averageScores.clients)}`}>
            平均 {summary.averageScores.clients}点
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">
            {summary.entityCounts.tasks}
          </div>
          <div className="text-xs text-gray-500">タスク</div>
          <div className={`text-sm ${getScoreColor(summary.averageScores.tasks)}`}>
            平均 {summary.averageScores.tasks}点
          </div>
        </div>
      </div>

      {/* 問題件数サマリー */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full" />
          <span className="text-sm">エラー: {issueCounts.error}件</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-yellow-500 rounded-full" />
          <span className="text-sm">警告: {issueCounts.warning}件</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full" />
          <span className="text-sm">情報: {issueCounts.info}件</span>
        </div>
      </div>

      {/* カテゴリフィルタ */}
      <div className="flex gap-2 mb-4">
        {(['all', 'leads', 'clients', 'tasks'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-sm rounded ${
              selectedCategory === cat
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={selectedCategory === cat ? { background: 'var(--primary)' } : undefined}
          >
            {cat === 'all' ? 'すべて' : cat === 'leads' ? '見込み客' : cat === 'clients' ? '既存客' : 'タスク'}
          </button>
        ))}
      </div>

      {/* 問題一覧 */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h3 className="text-sm font-medium">検出された問題 ({filteredIssues.length}件)</h3>
        </div>
        {filteredIssues.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            問題は検出されませんでした
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {filteredIssues.slice(0, 20).map((issue: QualityIssue, idx: number) => (
              <div key={idx} className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getSeverityBadge(issue.severity)}
                      <span className="text-xs text-gray-500">
                        {issue.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-xs text-gray-500 mt-1">
                        💡 {issue.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredIssues.length > 20 && (
              <div className="px-4 py-2 text-center text-sm text-gray-500 bg-gray-50">
                他 {filteredIssues.length - 20} 件の問題があります
              </div>
            )}
          </div>
        )}
      </div>

      {/* 改善提案 */}
      {summary.improvementSuggestions.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">改善提案</h3>
          <ul className="space-y-2">
            {summary.improvementSuggestions.map((rec: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span style={{ color: 'var(--primary)' }}>→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
