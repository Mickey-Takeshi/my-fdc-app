'use client';

/**
 * app/_components/admin/AIUsagePanel.tsx
 *
 * Phase 14.6-A: AI使用量ダッシュボード
 *
 * 【責務】
 * - ユーザー別AI使用量表示
 * - 日次/週次/月次集計
 * - コスト推定表示
 * - クォータ警告
 */

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, TrendingUp, Users, Zap } from 'lucide-react';

// ========================================
// 型定義
// ========================================

interface DailyUsage {
  date: string;
  requests: number;
  tokens: number;
  costUsd: number;
}

interface UserBreakdown {
  userId: string;
  userName?: string;
  requests: number;
  tokens: number;
  costUsd: number;
}

interface QuotaInfo {
  allowed: boolean;
  reason?: string;
  current: {
    requests: number;
    tokens: number;
    costUsd: number;
  };
  limit: {
    maxRequestsPerMonth: number;
    maxTokensPerMonth: number;
    maxCostPerMonth: number;
  };
  percentUsed: {
    requests: number;
    tokens: number;
    cost: number;
  };
  warning: boolean;
}

interface UsageData {
  period: {
    start: string;
    end: string;
    type: 'day' | 'week' | 'month';
  };
  usage: {
    totalRequests: number;
    totalTokens: number;
    estimatedCostUsd: number;
    userBreakdown?: UserBreakdown[];
  };
  monthlyQuota: QuotaInfo;
  dailyTrend: DailyUsage[];
}

interface AIUsagePanelProps {
  workspaceId: string;
}

// ========================================
// コンポーネント
// ========================================

export function AIUsagePanel({ workspaceId }: AIUsagePanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UsageData | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/ai/usage?workspaceId=${workspaceId}&period=${period}`,
        { credentials: 'include' }
      );

      if (!res.ok) {
        throw new Error('Failed to fetch AI usage');
      }

      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, period]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        エラー: {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { usage, monthlyQuota, dailyTrend } = data;

  return (
    <div className="space-y-6">
      {/* 期間選択 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI使用量</h3>
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm rounded ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p === 'day' ? '日次' : p === 'week' ? '週次' : '月次'}
            </button>
          ))}
        </div>
      </div>

      {/* クォータ警告 */}
      {monthlyQuota.warning && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            月間使用量が上限の80%を超えています
          </span>
        </div>
      )}

      {!monthlyQuota.allowed && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-800">
            {monthlyQuota.reason}
          </span>
        </div>
      )}

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          icon={<Zap className="w-5 h-5 text-blue-500" />}
          label="リクエスト数"
          value={usage.totalRequests.toLocaleString()}
          subValue={`/ ${monthlyQuota.limit.maxRequestsPerMonth.toLocaleString()}`}
          percent={monthlyQuota.percentUsed.requests}
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5 text-green-500" />}
          label="トークン数"
          value={usage.totalTokens.toLocaleString()}
          subValue={`/ ${monthlyQuota.limit.maxTokensPerMonth.toLocaleString()}`}
          percent={monthlyQuota.percentUsed.tokens}
        />
        <SummaryCard
          icon={<Users className="w-5 h-5 text-purple-500" />}
          label="推定コスト"
          value={`$${usage.estimatedCostUsd.toFixed(4)}`}
          subValue={`/ $${monthlyQuota.limit.maxCostPerMonth.toFixed(2)}`}
          percent={monthlyQuota.percentUsed.cost}
        />
      </div>

      {/* 日次推移 */}
      {dailyTrend.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            日次推移（過去30日）
          </h4>
          <div className="h-32 flex items-end gap-1">
            {dailyTrend.slice(-30).map((day, i) => {
              const maxRequests = Math.max(...dailyTrend.map((d) => d.requests), 1);
              const height = (day.requests / maxRequests) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 bg-blue-400 hover:bg-blue-500 rounded-t transition-colors"
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${day.date}: ${day.requests}リクエスト`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{dailyTrend[0]?.date}</span>
            <span>{dailyTrend[dailyTrend.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* ユーザー別内訳 */}
      {usage.userBreakdown && usage.userBreakdown.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            ユーザー別内訳
          </h4>
          <div className="space-y-2">
            {usage.userBreakdown.map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm text-gray-600">
                  {user.userName || `User ${user.userId}`}
                </span>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-500">
                    {user.requests}回
                  </span>
                  <span className="text-gray-500">
                    {user.tokens.toLocaleString()}トークン
                  </span>
                  <span className="font-medium">
                    ${user.costUsd.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// サブコンポーネント
// ========================================

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  percent: number;
}

function SummaryCard({ icon, label, value, subValue, percent }: SummaryCardProps) {
  const getProgressColor = (p: number) => {
    if (p >= 90) return 'bg-red-500';
    if (p >= 80) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        {subValue && (
          <span className="text-sm text-gray-400">{subValue}</span>
        )}
      </div>
      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getProgressColor(percent)} transition-all`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {percent.toFixed(1)}% 使用済み
      </div>
    </div>
  );
}

export default AIUsagePanel;
