/**
 * lib/types/status-master.ts
 *
 * Phase 14.6-B: ステータス統一定義
 * Phase 14.62: 命名・概念一貫性の統一
 *
 * 【責務】
 * - カスタマージャーニー基準のステータス定義
 * - エンティティ別ステータスマッピング
 * - 次アクション推奨マスタ
 * - ジャーニーステージ適用範囲の定義
 * - ジャーニー離脱理由の型安全な表現
 */

// ========================================
// カスタマージャーニーステージ
// ========================================

/**
 * カスタマージャーニーステージ
 */
export const CUSTOMER_JOURNEY_STAGES = [
  'awareness',      // 認知
  'interest',       // 興味
  'consideration',  // 検討
  'intent',         // 意向
  'evaluation',     // 評価
  'purchase',       // 購入
  'retention',      // 継続
  'advocacy',       // 推奨
] as const;

export type CustomerJourneyStage = (typeof CUSTOMER_JOURNEY_STAGES)[number];

/**
 * ジャーニーステージの日本語ラベル
 */
export const JOURNEY_STAGE_LABELS: Record<CustomerJourneyStage, string> = {
  awareness: '認知',
  interest: '興味',
  consideration: '検討',
  intent: '意向',
  evaluation: '評価',
  purchase: '購入',
  retention: '継続',
  advocacy: '推奨',
};

/**
 * ジャーニーステージの説明
 */
export const JOURNEY_STAGE_DESCRIPTIONS: Record<CustomerJourneyStage, string> = {
  awareness: '顧客が問題や解決策の存在を認識した段階',
  interest: '顧客が解決策に興味を持ち始めた段階',
  consideration: '顧客が複数の選択肢を比較検討している段階',
  intent: '顧客が購入意向を示している段階',
  evaluation: '顧客が最終的な評価・判断をしている段階',
  purchase: '顧客が購入を決定・契約した段階',
  retention: '顧客が継続利用している段階',
  advocacy: '顧客が他者に推奨・紹介する段階',
};

/**
 * ジャーニーステージの適用範囲
 * Phase 14.62: AIが適切なステージを判断できるよう明示化
 */
export const JOURNEY_STAGE_APPLICABILITY: Record<
  CustomerJourneyStage,
  ('lead' | 'client')[]
> = {
  awareness: ['lead'],
  interest: ['lead'],
  consideration: ['lead'],
  intent: ['lead'],
  evaluation: ['lead'],
  purchase: ['lead', 'client'], // 成約時点で両方
  retention: ['client'],
  advocacy: ['client'],
};

/**
 * ジャーニーステージがエンティティに適用可能か
 */
export function isStageApplicable(
  stage: CustomerJourneyStage,
  entityType: 'lead' | 'client'
): boolean {
  return JOURNEY_STAGE_APPLICABILITY[stage].includes(entityType);
}

// ========================================
// ジャーニー離脱
// ========================================

/**
 * ジャーニー離脱理由
 * Phase 14.62: null ではなく明示的な離脱理由を型で表現
 */
export type JourneyExitReason = 'lost' | 'dormant' | 'churned';

/**
 * 離脱理由の日本語ラベル
 */
export const JOURNEY_EXIT_REASON_LABELS: Record<JourneyExitReason, string> = {
  lost: '失注',
  dormant: '休眠',
  churned: '解約',
};

// ========================================
// 見込み客（Lead）ステータス
// ========================================

/**
 * 見込み客ステータス
 */
export const LEAD_STATUSES = [
  'new',          // 新規
  'contacted',    // コンタクト済み
  'qualified',    // 見込みあり
  'proposal',     // 提案中
  'negotiation',  // 交渉中
  'won',          // 成約
  'lost',         // 失注
  'dormant',      // 休眠
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/**
 * 見込み客ステータスの日本語ラベル
 */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: '新規',
  contacted: 'コンタクト済み',
  qualified: '見込みあり',
  proposal: '提案中',
  negotiation: '交渉中',
  won: '成約',
  lost: '失注',
  dormant: '休眠',
};

/**
 * 見込み客ステータス → ジャーニーマッピング
 */
export const LEAD_STATUS_JOURNEY_MAP: Record<LeadStatus, CustomerJourneyStage | null> = {
  new: 'awareness',
  contacted: 'interest',
  qualified: 'consideration',
  proposal: 'intent',
  negotiation: 'evaluation',
  won: 'purchase',
  lost: null, // ジャーニー離脱
  dormant: null, // ジャーニー離脱
};

/**
 * ステータス遷移の許可マトリクス
 */
export const LEAD_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'lost', 'dormant'],
  contacted: ['qualified', 'lost', 'dormant'],
  qualified: ['proposal', 'contacted', 'lost', 'dormant'],
  proposal: ['negotiation', 'qualified', 'lost', 'dormant'],
  negotiation: ['won', 'lost', 'proposal', 'dormant'],
  won: [], // 成約後は遷移不可
  lost: ['dormant', 'new'], // 再アプローチ可能
  dormant: ['new', 'contacted'], // 再アプローチ可能
};

// ========================================
// 既存客（Client）ステータス
// ========================================

/**
 * 既存客ステータス
 */
export const CLIENT_STATUSES = [
  'onboarding',   // オンボーディング中
  'active',       // アクティブ
  'growing',      // 拡大中
  'stable',       // 安定
  'at_risk',      // リスクあり
  'churning',     // 解約中
  'churned',      // 解約済み
] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

/**
 * 既存客ステータスの日本語ラベル
 */
export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  onboarding: 'オンボーディング中',
  active: 'アクティブ',
  growing: '拡大中',
  stable: '安定',
  at_risk: 'リスクあり',
  churning: '解約中',
  churned: '解約済み',
};

/**
 * 既存客ステータス → ジャーニーマッピング
 */
export const CLIENT_STATUS_JOURNEY_MAP: Record<ClientStatus, CustomerJourneyStage | null> = {
  onboarding: 'purchase',
  active: 'retention',
  growing: 'retention',
  stable: 'retention',
  at_risk: 'retention',
  churning: null,
  churned: null,
};

// ========================================
// タスク（Task）ステータス
// ========================================

/**
 * タスクステータス
 */
export const TASK_STATUSES = [
  'pending',      // 未着手
  'in_progress',  // 進行中
  'blocked',      // ブロック中
  'completed',    // 完了
  'cancelled',    // キャンセル
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

/**
 * タスクステータスの日本語ラベル
 */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '未着手',
  in_progress: '進行中',
  blocked: 'ブロック中',
  completed: '完了',
  cancelled: 'キャンセル',
};

// ========================================
// 次アクション推奨マスタ
// ========================================

/**
 * 見込み客ステータス別推奨アクション
 */
export const LEAD_RECOMMENDED_ACTIONS: Record<LeadStatus, string[]> = {
  new: [
    '初回コンタクト（電話/メール）',
    'ニーズヒアリングの日程調整',
    '会社情報・担当者情報の確認',
  ],
  contacted: [
    '課題・ニーズの深掘りヒアリング',
    '事例紹介・資料送付',
    'デモ・トライアルの提案',
  ],
  qualified: [
    '提案書の作成',
    'デモンストレーションの実施',
    '見積書の作成',
  ],
  proposal: [
    '提案内容の説明・プレゼン',
    '価格交渉',
    '導入スケジュールの調整',
  ],
  negotiation: [
    '最終条件の提示',
    '決裁者へのアプローチ',
    '契約書の準備',
  ],
  won: [
    'オンボーディングの開始',
    '担当引き継ぎ',
    '初期設定サポート',
  ],
  lost: [
    '失注理由のヒアリング',
    '再アプローチ時期の設定',
    'CRM情報の整理',
  ],
  dormant: [
    '状況確認の連絡',
    '再アプローチ可否の判断',
    '長期フォロー計画の策定',
  ],
};

/**
 * 既存客ステータス別推奨アクション
 */
export const CLIENT_RECOMMENDED_ACTIONS: Record<ClientStatus, string[]> = {
  onboarding: [
    '初期設定の完了確認',
    'トレーニングの実施',
    '利用開始後のフォローアップ',
  ],
  active: [
    '定期的な利用状況確認',
    '追加機能の提案',
    '満足度調査の実施',
  ],
  growing: [
    'アップセル提案',
    'クロスセル提案',
    '成功事例のヒアリング',
  ],
  stable: [
    '契約更新の準備',
    '新機能の案内',
    '紹介プログラムの案内',
  ],
  at_risk: [
    '課題のヒアリング',
    '改善策の提案',
    'エスカレーション対応',
  ],
  churning: [
    '解約理由のヒアリング',
    '代替案の提示',
    'リテンション施策の実施',
  ],
  churned: [
    '解約後アンケート',
    '再契約可能性の確認',
    'フィードバックの記録',
  ],
};

// ========================================
// ステータスヘルパー関数
// ========================================

/**
 * ステータス遷移が有効かチェック
 */
export function isValidLeadStatusTransition(
  from: LeadStatus,
  to: LeadStatus
): boolean {
  return LEAD_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * ステータスからジャーニーステージを取得
 */
export function getJourneyStageFromLeadStatus(
  status: LeadStatus
): CustomerJourneyStage | null {
  return LEAD_STATUS_JOURNEY_MAP[status];
}

/**
 * ステータスからジャーニーステージを取得（既存客）
 */
export function getJourneyStageFromClientStatus(
  status: ClientStatus
): CustomerJourneyStage | null {
  return CLIENT_STATUS_JOURNEY_MAP[status];
}

/**
 * 推奨アクションを取得（見込み客）
 */
export function getRecommendedActionsForLead(status: LeadStatus): string[] {
  return LEAD_RECOMMENDED_ACTIONS[status] || [];
}

/**
 * 推奨アクションを取得（既存客）
 */
export function getRecommendedActionsForClient(status: ClientStatus): string[] {
  return CLIENT_RECOMMENDED_ACTIONS[status] || [];
}

/**
 * 次のステータス候補を取得
 */
export function getNextLeadStatuses(currentStatus: LeadStatus): LeadStatus[] {
  return LEAD_STATUS_TRANSITIONS[currentStatus];
}

/**
 * 離脱理由を取得（見込み客）
 * Phase 14.62: null の代わりに明示的な離脱理由を返す
 */
export function getLeadExitReason(status: LeadStatus): JourneyExitReason | null {
  if (status === 'lost') return 'lost';
  if (status === 'dormant') return 'dormant';
  return null;
}

/**
 * 離脱理由を取得（既存客）
 */
export function getClientExitReason(status: ClientStatus): JourneyExitReason | null {
  if (status === 'churned') return 'churned';
  if (status === 'churning') return 'churned'; // 解約中も離脱扱い
  return null;
}

/**
 * ステータスがジャーニー離脱状態かどうか
 */
export function isJourneyExited(
  entityType: 'lead' | 'client',
  status: LeadStatus | ClientStatus
): boolean {
  if (entityType === 'lead') {
    return getLeadExitReason(status as LeadStatus) !== null;
  }
  return getClientExitReason(status as ClientStatus) !== null;
}
