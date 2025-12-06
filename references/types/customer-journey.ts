/**
 * lib/types/customer-journey.ts
 *
 * Phase 14.6-E: カスタマージャーニー定義
 * Phase 14.62: keyActions を status-master.ts から動的取得
 *
 * 【責務】
 * - ジャーニーステージの詳細定義
 * - ステージ別KPI
 * - 遷移条件
 */

import {
  CustomerJourneyStage,
  JOURNEY_STAGE_LABELS,
  JOURNEY_STAGE_DESCRIPTIONS,
  LEAD_RECOMMENDED_ACTIONS,
  CLIENT_RECOMMENDED_ACTIONS,
  LeadStatus,
  ClientStatus,
} from './status-master';

// ========================================
// ステージ別アクション取得（Single Source of Truth）
// ========================================

/**
 * ジャーニーステージに対応するリードステータスを取得
 */
function getLeadStatusForStage(stage: CustomerJourneyStage): LeadStatus | null {
  const statusMap: Partial<Record<CustomerJourneyStage, LeadStatus>> = {
    awareness: 'new',
    interest: 'contacted',
    consideration: 'qualified',
    intent: 'proposal',
    evaluation: 'negotiation',
    purchase: 'won',
  };
  return statusMap[stage] || null;
}

/**
 * ジャーニーステージに対応するクライアントステータスを取得
 */
function getClientStatusForStage(stage: CustomerJourneyStage): ClientStatus | null {
  const statusMap: Partial<Record<CustomerJourneyStage, ClientStatus>> = {
    purchase: 'onboarding',
    retention: 'active',
    advocacy: 'stable', // 推奨段階は安定顧客が主
  };
  return statusMap[stage] || null;
}

/**
 * ステージの主要アクションを取得（status-master.ts から導出）
 * Phase 14.62: Single Source of Truth を status-master.ts に統一
 */
function getActionsForStage(stage: CustomerJourneyStage): string[] {
  // リードステージの場合
  const leadStatus = getLeadStatusForStage(stage);
  if (leadStatus) {
    return LEAD_RECOMMENDED_ACTIONS[leadStatus] || [];
  }

  // クライアントステージの場合
  const clientStatus = getClientStatusForStage(stage);
  if (clientStatus) {
    return CLIENT_RECOMMENDED_ACTIONS[clientStatus] || [];
  }

  return [];
}

// 再エクスポート（他のモジュールから利用可能に）
export type { CustomerJourneyStage };

// ========================================
// 型定義
// ========================================

/**
 * ジャーニーステージ詳細
 */
export interface JourneyStageDetail {
  stage: CustomerJourneyStage;
  label: string;
  description: string;
  /** 目標滞留日数 */
  targetDays: number;
  /** 警告滞留日数（これを超えたら警告） */
  warningDays: number;
  /** 主要KPI */
  kpis: string[];
  /** 主要アクション */
  keyActions: string[];
  /** 遷移条件（次ステージへの移行条件） */
  transitionCriteria: string[];
  /** ステージ色 */
  color: string;
}

/**
 * ファネル統計
 */
export interface FunnelStats {
  stage: CustomerJourneyStage;
  count: number;
  conversionRate: number; // 前ステージからの遷移率
  averageDays: number;    // 平均滞留日数
  staleCount: number;     // 滞留警告対象の件数
}

/**
 * ジャーニー分析結果
 */
export interface JourneyAnalysis {
  stages: FunnelStats[];
  totalLeads: number;
  overallConversionRate: number; // 認知→購入の全体転換率
  bottleneckStage: CustomerJourneyStage | null;
  recommendations: string[];
}

// ========================================
// ジャーニーステージ詳細定義
// ========================================

/**
 * ジャーニーステージ詳細
 */
export const JOURNEY_STAGE_DETAILS: Record<CustomerJourneyStage, JourneyStageDetail> = {
  awareness: {
    stage: 'awareness',
    label: JOURNEY_STAGE_LABELS.awareness,
    description: JOURNEY_STAGE_DESCRIPTIONS.awareness,
    targetDays: 7,
    warningDays: 14,
    kpis: [
      'リード獲得数',
      'リードソース別獲得数',
      '問合せ対応時間',
    ],
    keyActions: getActionsForStage('awareness'), // Phase 14.62: 動的取得
    transitionCriteria: [
      '初回コンタクト完了',
      '担当者との会話成立',
      'ニーズの初期把握',
    ],
    color: '#94A3B8', // gray-400
  },
  interest: {
    stage: 'interest',
    label: JOURNEY_STAGE_LABELS.interest,
    description: JOURNEY_STAGE_DESCRIPTIONS.interest,
    targetDays: 14,
    warningDays: 21,
    kpis: [
      '商談化率',
      '資料ダウンロード数',
      'ウェビナー参加率',
    ],
    keyActions: getActionsForStage('interest'), // Phase 14.62: 動的取得
    transitionCriteria: [
      '具体的な課題の特定',
      '予算・時期の概算把握',
      '意思決定者の確認',
    ],
    color: '#60A5FA', // blue-400
  },
  consideration: {
    stage: 'consideration',
    label: JOURNEY_STAGE_LABELS.consideration,
    description: JOURNEY_STAGE_DESCRIPTIONS.consideration,
    targetDays: 21,
    warningDays: 30,
    kpis: [
      '提案書送付率',
      'デモ実施率',
      '競合比較状況',
    ],
    keyActions: getActionsForStage('consideration'), // Phase 14.62: 動的取得
    transitionCriteria: [
      '提案内容への興味表明',
      '見積依頼の受領',
      '社内検討の開始',
    ],
    color: '#A78BFA', // violet-400
  },
  intent: {
    stage: 'intent',
    label: JOURNEY_STAGE_LABELS.intent,
    description: JOURNEY_STAGE_DESCRIPTIONS.intent,
    targetDays: 14,
    warningDays: 21,
    kpis: [
      '見積提出率',
      '見積金額',
      'ディスカウント率',
    ],
    keyActions: getActionsForStage('intent'), // Phase 14.62: 動的取得
    transitionCriteria: [
      '見積内容への合意',
      '社内承認プロセス開始',
      '契約条件の交渉開始',
    ],
    color: '#F472B6', // pink-400
  },
  evaluation: {
    stage: 'evaluation',
    label: JOURNEY_STAGE_LABELS.evaluation,
    description: JOURNEY_STAGE_DESCRIPTIONS.evaluation,
    targetDays: 14,
    warningDays: 30,
    kpis: [
      '成約率',
      '平均契約金額',
      '契約サイクル日数',
    ],
    keyActions: getActionsForStage('evaluation'), // Phase 14.62: 動的取得
    transitionCriteria: [
      '最終条件への合意',
      '契約書の承認',
      '発注・契約締結',
    ],
    color: '#FB923C', // orange-400
  },
  purchase: {
    stage: 'purchase',
    label: JOURNEY_STAGE_LABELS.purchase,
    description: JOURNEY_STAGE_DESCRIPTIONS.purchase,
    targetDays: 30,
    warningDays: 60,
    kpis: [
      'オンボーディング完了率',
      '初期利用率',
      '初期満足度',
    ],
    keyActions: getActionsForStage('purchase'), // Phase 14.62: 動的取得
    transitionCriteria: [
      'オンボーディング完了',
      '初期利用開始',
      '初回フィードバック取得',
    ],
    color: '#4ADE80', // green-400
  },
  retention: {
    stage: 'retention',
    label: JOURNEY_STAGE_LABELS.retention,
    description: JOURNEY_STAGE_DESCRIPTIONS.retention,
    targetDays: 90,
    warningDays: 180,
    kpis: [
      '継続率',
      'NPS',
      'アップセル・クロスセル率',
    ],
    keyActions: getActionsForStage('retention'), // Phase 14.62: 動的取得
    transitionCriteria: [
      '高い満足度の維持',
      '追加契約の成立',
      '紹介意向の表明',
    ],
    color: '#22D3EE', // cyan-400
  },
  advocacy: {
    stage: 'advocacy',
    label: JOURNEY_STAGE_LABELS.advocacy,
    description: JOURNEY_STAGE_DESCRIPTIONS.advocacy,
    targetDays: 0, // 無期限
    warningDays: 0,
    kpis: [
      '紹介件数',
      '事例掲載数',
      '口コミ評価',
    ],
    keyActions: getActionsForStage('advocacy'), // Phase 14.62: 動的取得
    transitionCriteria: [
      '紹介の実施',
      '事例掲載の承諾',
      '高評価レビューの投稿',
    ],
    color: '#FBBF24', // amber-400
  },
};

// ========================================
// ファネル分析関数
// ========================================

/**
 * ファネル統計を計算
 */
export function calculateFunnelStats(
  leadsByStage: Record<CustomerJourneyStage, number>,
  averageDaysByStage: Record<CustomerJourneyStage, number>,
  staleCountByStage: Record<CustomerJourneyStage, number>
): FunnelStats[] {
  const stages: CustomerJourneyStage[] = [
    'awareness',
    'interest',
    'consideration',
    'intent',
    'evaluation',
    'purchase',
  ];

  const stats: FunnelStats[] = [];
  let previousCount = 0;

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const count = leadsByStage[stage] || 0;
    const avgDays = averageDaysByStage[stage] || 0;
    const staleCount = staleCountByStage[stage] || 0;

    // 最初のステージは転換率100%、それ以降は前ステージからの比率
    const conversionRate =
      i === 0
        ? 100
        : previousCount > 0
        ? (count / previousCount) * 100
        : 0;

    stats.push({
      stage,
      count,
      conversionRate: Math.round(conversionRate * 10) / 10,
      averageDays: Math.round(avgDays),
      staleCount,
    });

    // 前ステージの件数を更新（現在のステージ + 先のステージの合計）
    if (i === 0) {
      previousCount = count;
      for (let j = 1; j < stages.length; j++) {
        previousCount += leadsByStage[stages[j]] || 0;
      }
    } else {
      previousCount = count;
      for (let j = i + 1; j < stages.length; j++) {
        previousCount += leadsByStage[stages[j]] || 0;
      }
    }
  }

  return stats;
}

/**
 * ボトルネックステージを特定
 */
export function identifyBottleneck(stats: FunnelStats[]): CustomerJourneyStage | null {
  // 転換率が最も低いステージを特定（最初のステージを除く）
  let minConversionRate = 100;
  let bottleneckStage: CustomerJourneyStage | null = null;

  for (let i = 1; i < stats.length; i++) {
    if (stats[i].conversionRate < minConversionRate) {
      minConversionRate = stats[i].conversionRate;
      bottleneckStage = stats[i].stage;
    }
  }

  return bottleneckStage;
}

/**
 * ジャーニー分析を実行
 */
export function analyzeJourney(
  leadsByStage: Record<CustomerJourneyStage, number>,
  averageDaysByStage: Record<CustomerJourneyStage, number>,
  staleCountByStage: Record<CustomerJourneyStage, number>
): JourneyAnalysis {
  const stats = calculateFunnelStats(leadsByStage, averageDaysByStage, staleCountByStage);
  const bottleneckStage = identifyBottleneck(stats);

  // 全体の転換率（認知→購入）
  const totalLeads = stats[0]?.count || 0;
  const purchasedLeads = leadsByStage.purchase || 0;
  const overallConversionRate =
    totalLeads > 0 ? (purchasedLeads / totalLeads) * 100 : 0;

  // 改善提案の生成
  const recommendations: string[] = [];

  if (bottleneckStage) {
    const detail = JOURNEY_STAGE_DETAILS[bottleneckStage];
    recommendations.push(
      `「${detail.label}」ステージの転換率が低いため、以下のアクションを推奨します：`
    );
    detail.keyActions.forEach((action) => {
      recommendations.push(`・${action}`);
    });
  }

  // 滞留警告
  for (const stat of stats) {
    if (stat.staleCount > 0) {
      const detail = JOURNEY_STAGE_DETAILS[stat.stage];
      recommendations.push(
        `「${detail.label}」ステージに${stat.staleCount}件の滞留案件があります（${detail.warningDays}日以上）`
      );
    }
  }

  // 平均滞留日数の警告
  for (const stat of stats) {
    const detail = JOURNEY_STAGE_DETAILS[stat.stage];
    if (stat.averageDays > detail.targetDays && detail.targetDays > 0) {
      recommendations.push(
        `「${detail.label}」ステージの平均滞留日数（${stat.averageDays}日）が目標（${detail.targetDays}日）を超えています`
      );
    }
  }

  return {
    stages: stats,
    totalLeads,
    overallConversionRate: Math.round(overallConversionRate * 10) / 10,
    bottleneckStage,
    recommendations,
  };
}

// ========================================
// ヘルパー関数
// ========================================

/**
 * ステージ詳細を取得
 */
export function getJourneyStageDetail(
  stage: CustomerJourneyStage
): JourneyStageDetail {
  return JOURNEY_STAGE_DETAILS[stage];
}

/**
 * 滞留日数が警告レベルかチェック
 */
export function isStaleInStage(
  stage: CustomerJourneyStage,
  daysInStage: number
): boolean {
  const detail = JOURNEY_STAGE_DETAILS[stage];
  return detail.warningDays > 0 && daysInStage >= detail.warningDays;
}

/**
 * 次のステージを取得
 */
export function getNextStage(
  currentStage: CustomerJourneyStage
): CustomerJourneyStage | null {
  const stages: CustomerJourneyStage[] = [
    'awareness',
    'interest',
    'consideration',
    'intent',
    'evaluation',
    'purchase',
    'retention',
    'advocacy',
  ];

  const currentIndex = stages.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === stages.length - 1) {
    return null;
  }

  return stages[currentIndex + 1];
}
