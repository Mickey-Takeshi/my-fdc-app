/**
 * lib/types/app-data.ts
 *
 * Phase 9.9-A: AppData 型定義（完全版）
 *
 * NOTE: archive/phase9-legacy-js/core/state.ts からの移植
 *       Phase 9.9-A でレガシーファイル退避に伴い、型定義を新構造へ移行
 */

// ========================================
// 基本型定義
// ========================================

// 新権限体系 (Phase 9.97)
export type AccountType = 'SA' | 'USER' | 'TEST';
export type WorkspaceRoleType = 'OWNER' | 'ADMIN' | 'MEMBER';

export type FunnelStatus =
  | 'uncontacted'
  | 'responded'
  | 'negotiating'
  | 'won'
  | 'lost';

export type ClientStatus = 'client' | 'contract_expired';

export type Channel =
  | 'real'
  | 'hp'
  | 'mail'
  | 'messenger'
  | 'x'
  | 'phone'
  | 'webapp'
  | undefined;

// ========================================
// データ構造型定義
// ========================================

// Phase 13: 旧KeyResult型削除済み - 新OKR機能では lib/types/okr.ts の KeyResult を使用

export interface EmotionPattern {
  name: string;
  description: string;
}

export interface Product {
  name: string;
  price: string;
  description: string;
  emotion: string;
}

export interface LeanCanvas {
  customerSegment: string;
  problem: string;
  uniqueValue: string;
  solution: string;
  channels: string;
  revenueStreams: string;
  costStructure: string;
  keyMetrics: string;
  unfairAdvantage: string;
  products: {
    front: Product[];
    middle: Product[];
    back: Product[];
  };
  customerWants: string;
  valueProvided: string;
  emotionPoints: string;
}

export interface CustomerJourneyPhase {
  phase: string;
  psychology: string;
  touchpoint: string;
  content: string;
  emotion: string;
  prompt: string;
}

export interface Profile {
  intro: string;
  x: string;
  note: string;
  facebook: string;
}

export interface Profiles {
  bio: string;
  x: string;
  note: string;
  facebook: string;
  instagram: string;
}

export interface Brand {
  // 1. Clarity（明確性）
  brandRepresents: string;        // ブランドが表すもの
  values: string;                 // 価値観
  positioning: string;            // ポジショニング
  valueProposition: string;       // 提供価値（バリュープロポジション）

  // 2. Commitment（コミットメント）
  investmentPolicy: string;       // ブランドへの投資方針
  managementInvolvement: string;  // 経営者の関与

  // 3. Protection（保護）
  intellectualProperty: string;   // 商標・知的財産
  usageRules: string;             // 使用許諾ルール
  prohibitions: string;           // 禁止事項

  // 4. Responsiveness（応答性）
  customerResponsePolicy: string; // 顧客対応方針
  marketChangePolicy: string;     // 市場変化への対応方針

  // 5. Authenticity（真正性）
  brandPersonality: string;       // ブランドの人格・性格
  brandBehavior: string;          // ブランドらしい振る舞い
  nonBrandBehavior: string;       // ブランドらしくない振る舞い

  // 6. Relevance（関連性）
  primaryTarget: string;          // 主要ターゲット
  targetInsights: string;         // ターゲットのニーズ・インサイト
  excludedTarget: string;         // 除外ターゲット

  // 7. Differentiation（差別化）
  competitiveDifference: string;  // 競合との違い
  usp: string;                    // 独自の価値（USP）

  // 8. Consistency（一貫性）
  tone: string;                   // トーン＆マナー
  visualGuidelines: string;       // ビジュアル規定
  wordsUse: string;               // 使うキーワード
  wordsAvoid: string;             // 避けるキーワード

  // 9. Presence（存在感）
  coreMessage: string;            // コアメッセージ
  tagline: string;                // タグライン
  channels: string;               // 発信チャネル

  // 10. Understanding（理解）
  wantToBeUnderstood: string;     // 顧客に理解してほしいこと
  commonMisunderstandings: string; // 誤解されやすいこと
}

export interface MessengerPattern {
  id: number;
  name: string;
  subject: string;
  body: string;
  sent: number;
  zoom: number;
}

export interface Todo {
  id: number | string;
  title: string;
  description?: string;
  deadline?: string;
  category?: string;
  completed: boolean;
  createdAt?: string;
}

// Phase 10: 新しい Task 型を再エクスポート
export type { Task, SubTask, Suit, ElasticLevel, TaskStatus, TaskLog, DailySummary, MonthlySummary, UmeHabit, LinkedUmeHabit, ElasticHabit, ElasticLevelContent } from './todo';

// Phase 11: Action Map 型を再エクスポート
export type { ActionMap, ActionItem, ActionMapId, ActionItemId, ActionItemStatus, ActionItemPriority, ActionItemWithChildren, DueDateWarningLevel } from './action-map';

// Phase 12: OKR 型を再エクスポート
export type { Objective, KeyResult as OKRKeyResult, ObjectiveId, KeyResultId, ObjectiveScope, ObjectiveStatus, KRCalcMethod, ObjectiveRetrospective } from './okr';

export interface HistoryEntry {
  date: string;
  action?: string;
  content?: string;
  note?: string;
}

export interface Prospect {
  id: number | string;
  name: string;
  company?: string;
  contact?: string;
  status: FunnelStatus | string;
  channel?: Channel;
  memo?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  notes?: string;
  history?: Array<{
    date: string;
    action?: string;
    content?: string;
    note?: string;
  }>;
  reminder?: string | null;
  reminderNote?: string;
  nextMeeting?: string | null;
  contractDeadline?: string | null;
  lostReason?: string;
  lostFeedback?: string;
}

export interface Client {
  id: number | string;
  name: string;
  company?: string;
  contact?: string;
  status: ClientStatus | string;
  channel?: Channel;
  memo?: string;
  contractDeadline?: string | null;
  contractDate?: string;
  nextMeeting?: string | null;
  tags?: string[];
  notes?: string;
  history?: Array<{
    date: string;
    action: string;
    note?: string;
  }>;
  createdAt?: string;
  convertedAt?: string;
}

export interface ApproachRecord {
  id: number;
  date: string;
  channel: string;
  count: number;
  responses: number;
}

export interface LostDeal {
  id: number;
  name: string;
  company: string;
  contact: string;
  reason: string;
  lostDate: string;
  details: string;
}

export interface ApproachStats {
  total: number;
  responses: number;
}

export interface Template {
  id: number;
  name: string;
  emotionPattern?: string;
  subject: string;
  body: string;
  notes?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Templates {
  messenger: Template[];
  email: Template[];
  proposal: Template[];
  closing: Template[];
  [key: string]: Template[];
}

export interface TemplateUsageHistory {
  id: number;
  templateId: number;
  templateName: string;
  templateType?: string;
  recipientName?: string;
  usedAt: string;
  successful?: boolean | null;
  zoomStatus?: string | null;
}

/**
 * 設定項目の共通型（拡張性を持たせた汎用的な設定値）
 */
export interface SettingsSection {
  [key: string]: string | number | boolean | null | undefined;
}

export interface Settings {
  projectName: string;
  userName: string;
  clientInfo?: SettingsSection;
  strategy?: SettingsSection;
  revenue?: SettingsSection;
  leanCanvas?: SettingsSection;
  customerJourney?: SettingsSection;
  kpi?: SettingsSection;
  roadmap?: SettingsSection;
  design?: SettingsSection;
}

export interface ConversionGoals {
  uncontacted?: number;
  responded?: number;
  recruiting?: number;
  negotiating: number;
  won: number;
  client: number;
}

/**
 * 送信履歴の個別エントリ
 */
export interface SendHistoryEntry {
  id: number | string;
  templateId: number;
  templateName: string;
  recipientName?: string;
  recipientEmail?: string;
  sentAt: string;
  status?: 'sent' | 'failed' | 'pending';
  channel?: Channel;
}

// ========================================
// AppData 型定義（完全版）
// ========================================

/**
 * アプリケーションデータ（完全版）
 */
export interface AppData {
  workspaceId?: string;

  auth?: {
    googleConnected: boolean;
    googleUserId?: string;
    email?: string;
    name?: string;
    picture?: string;
    accountType?: AccountType;
    role?: WorkspaceRoleType;
    workspaceId?: string;
  };

  mvv: {
    mission: string;
    vision: string;
    value: string;
  };

  // Phase 13: 旧okrフィールド削除済み - 新OKRは objectives/okrKeyResults を使用

  emotionPatterns: EmotionPattern[];
  leanCanvas: LeanCanvas;
  customerJourney: CustomerJourneyPhase[];
  profile: Profile;
  profiles: Profiles;
  brand: Brand;
  messengerPatterns: MessengerPattern[];
  sendHistory: SendHistoryEntry[];
  todos: Todo[];
  // Phase 10: 新しい4象限タスク管理システム（todosとは別管理）
  tasks?: import('./todo').Task[];
  // Phase 14.10: 習慣タスク専用配列（通常tasksと完全分離 - 競合回避）
  habitTasks?: import('./todo').Task[];
  // Phase 10: タスク完了ログ（履歴管理・レポート用）
  taskLogs?: import('./todo').TaskLog[];
  // Phase 10: 日別サマリー（8日〜90日の集計）
  dailySummaries?: import('./todo').DailySummary[];
  // Phase 10: 月別サマリー（91日以降の集計）
  monthlySummaries?: import('./todo').MonthlySummary[];
  // Phase 10-E: 梅習慣マスタ（5分単位の習慣リスト）- 後方互換
  umeHabits?: import('./todo').UmeHabit[];
  // Phase 10: 編集可能な習慣マスタ（梅竹松）
  elasticHabits?: import('./todo').ElasticHabit[];
  // Phase 10: 最後に週次アーカイブを実行した日付（日曜日）
  lastWeeklyArchiveDate?: string;
  // Phase 10: 最後に月次アーカイブを実行した年月（月初1日）
  lastMonthlyArchiveYearMonth?: string;

  // Phase 11: Action Map（戦術計画）
  actionMaps?: import('./action-map').ActionMap[];
  // Phase 11: Action Item（Action Map 配下の具体タスク）
  actionItems?: import('./action-map').ActionItem[];

  // Phase 12: OKR（戦略レイヤー）
  objectives?: import('./okr').Objective[];
  // Phase 12: Key Result（成果指標）
  okrKeyResults?: import('./okr').KeyResult[];

  prospects: Prospect[];
  clients: Client[];
  approachRecords?: ApproachRecord[];
  lostDeals?: LostDeal[];
  approaches: Record<string, ApproachStats>;
  conversionGoals?: ConversionGoals;
  templates: Templates;
  templateUsageHistory: TemplateUsageHistory[];
  settings: Settings;
}
