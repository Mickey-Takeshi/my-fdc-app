/**
 * app/_components/prospects/NextActionSuggestion.tsx
 *
 * Phase 14.6-E: 次アクション提案UI
 *
 * 【責務】
 * - 推奨アクション表示
 * - ワンクリック実行
 * - AI生成オプション
 */

'use client';

import { useState } from 'react';
import {
  Zap,
  Clock,
  MessageSquare,
  FileText,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  type RecommendedAction,
  type ActionRecommendation,
  recommendActionsForLead,
  getPriorityLabel,
} from '@/lib/core/action-recommender';
import type { LeadStatus } from '@/lib/types/status-master';
import type { CustomerJourneyStage } from '@/lib/types/customer-journey';

// ========================================
// 型定義
// ========================================

interface NextActionSuggestionProps {
  /**
   * 見込み客ID
   */
  leadId: string;
  /**
   * 現在のステータス
   */
  status: LeadStatus;
  /**
   * ステータス滞留日数
   */
  daysInStatus: number;
  /**
   * カスタマージャーニーステージ
   */
  journeyStage: CustomerJourneyStage | null;
  /**
   * 追加コンテキスト
   */
  additionalContext?: {
    hasEmail?: boolean;
    hasPhone?: boolean;
    lastContactDays?: number;
    proposalSent?: boolean;
    budget?: string;
  };
  /**
   * アクション実行時のコールバック
   */
  onActionClick?: (action: RecommendedAction) => void;
  /**
   * AI生成リクエスト時のコールバック
   */
  onAIAssist?: (action: RecommendedAction) => void;
  /**
   * コンパクト表示
   */
  compact?: boolean;
}

// ========================================
// メインコンポーネント
// ========================================

export function NextActionSuggestion({
  leadId,
  status,
  daysInStatus,
  journeyStage,
  additionalContext,
  onActionClick,
  onAIAssist,
  compact = false,
}: NextActionSuggestionProps) {
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  // 推奨アクションを生成
  const recommendation: ActionRecommendation = recommendActionsForLead(
    leadId,
    status,
    daysInStatus,
    journeyStage,
    additionalContext
  );

  const handleActionClick = (action: RecommendedAction) => {
    onActionClick?.(action);
  };

  const handleAIAssist = (action: RecommendedAction) => {
    onAIAssist?.(action);
  };

  const handleComplete = (actionId: string) => {
    setCompletedActions((prev) => new Set([...prev, actionId]));
  };

  const activeActions = recommendation.actions.filter(
    (a) => !completedActions.has(a.id)
  );

  if (activeActions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        推奨アクションはありません
      </div>
    );
  }

  if (compact) {
    return (
      <CompactView
        actions={activeActions}
        isStale={recommendation.isStale}
        onActionClick={handleActionClick}
        onAIAssist={onAIAssist ? handleAIAssist : undefined}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* 滞留警告 */}
      {recommendation.isStale && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">
              滞留警告
            </p>
            <p className="text-xs text-red-600">
              {daysInStatus}日間ステータスが変更されていません
            </p>
          </div>
        </div>
      )}

      {/* アクションリスト */}
      <div className="space-y-2">
        {activeActions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            isExpanded={expandedAction === action.id}
            onExpand={() =>
              setExpandedAction(expandedAction === action.id ? null : action.id)
            }
            onActionClick={() => handleActionClick(action)}
            onAIAssist={onAIAssist ? () => handleAIAssist(action) : undefined}
            onComplete={() => handleComplete(action.id)}
          />
        ))}
      </div>

      {/* 次のステータス候補 */}
      {recommendation.nextStatuses.length > 0 && (
        <div className="pt-3 border-t">
          <p className="text-xs text-gray-500 mb-2">次のステータスに進める場合:</p>
          <div className="flex flex-wrap gap-2">
            {recommendation.nextStatuses.map((ns) => (
              <span
                key={ns.status}
                className="px-2 py-1 text-xs rounded"
                style={{ background: 'var(--primary-alpha-10)', color: 'var(--primary-dark)' }}
              >
                → {ns.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// アクションカード
// ========================================

interface ActionCardProps {
  action: RecommendedAction;
  isExpanded: boolean;
  onExpand: () => void;
  onActionClick: () => void;
  onAIAssist?: () => void;
  onComplete: () => void;
}

function ActionCard({
  action,
  isExpanded,
  onExpand,
  onActionClick,
  onAIAssist,
  onComplete,
}: ActionCardProps) {
  const priorityColors = {
    1: 'border-red-400 bg-red-50',
    2: 'border-orange-400 bg-orange-50',
    3: 'border-blue-400 bg-blue-50',
    4: 'border-gray-400 bg-gray-50',
  };

  const categoryIcons = {
    contact: <MessageSquare className="w-4 h-4" />,
    proposal: <FileText className="w-4 h-4" />,
    follow_up: <RefreshCw className="w-4 h-4" />,
    internal: <Zap className="w-4 h-4" />,
    other: <ChevronRight className="w-4 h-4" />,
  };

  return (
    <div
      className={`border-l-4 rounded-lg p-3 cursor-pointer transition-all ${
        priorityColors[action.priority]
      } ${isExpanded ? 'shadow-md' : 'hover:shadow'}`}
      onClick={onExpand}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {categoryIcons[action.category]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-800">{action.action}</span>
            <span
              className={`px-1.5 py-0.5 text-xs rounded ${
                action.priority === 1
                  ? 'bg-red-200 text-red-800'
                  : action.priority === 2
                  ? 'bg-orange-200 text-orange-800'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {getPriorityLabel(action.priority)}
            </span>
            {action.aiAssistAvailable && (
              <span title="AI支援可能">
                <Sparkles className="w-4 h-4 text-purple-500" />
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600">{action.reason}</p>

          {action.dueDays && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{action.dueDays}日以内に実行推奨</span>
            </div>
          )}
        </div>
      </div>

      {/* 展開時のアクションボタン */}
      {isExpanded && (
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onActionClick();
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-white rounded"
            style={{ background: 'var(--primary)' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-dark)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary)'}
          >
            <ChevronRight className="w-4 h-4" />
            実行する
          </button>

          {action.aiAssistAvailable && onAIAssist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAIAssist();
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4" />
              AIで作成
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border rounded hover:bg-gray-100"
          >
            <CheckCircle2 className="w-4 h-4" />
            完了
          </button>
        </div>
      )}
    </div>
  );
}

// ========================================
// コンパクトビュー
// ========================================

interface CompactViewProps {
  actions: RecommendedAction[];
  isStale: boolean;
  onActionClick: (action: RecommendedAction) => void;
  onAIAssist?: (action: RecommendedAction) => void;
}

function CompactView({
  actions,
  isStale,
  onActionClick,
  onAIAssist,
}: CompactViewProps) {
  const topAction = actions[0];
  if (!topAction) return null;

  return (
    <div className="flex items-center gap-2">
      {isStale && (
        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {topAction.action}
        </p>
      </div>

      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => onActionClick(topAction)}
          className="p-1.5 rounded"
          style={{ color: 'var(--primary)' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-alpha-10)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          title="実行"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {topAction.aiAssistAvailable && onAIAssist && (
          <button
            onClick={() => onAIAssist(topAction)}
            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
            title="AIで作成"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default NextActionSuggestion;
